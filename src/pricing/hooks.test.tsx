import React, {StrictMode} from 'react';
import {act, renderHook, waitFor} from '@testing-library/react';

import * as mocks from '../../test/mocks';
import makeDeferred from '../../test/makeDeferred';
import {PricingContext} from './PricingContext';
import {PricingProvider} from './PricingProvider';
import {useCurrencySelection} from './useCurrencySelection';
import {usePricingToken} from './usePricingToken';
import {useResolvedPrice} from './useResolvedPrice';

describe('Pricing hooks', () => {
  let stripe: any;
  let pricing: any;

  beforeEach(() => {
    pricing = mocks.mockPricing();
    stripe = mocks.mockStripe();
    stripe.initializePricing.mockResolvedValue(pricing);
  });

  const wrapper = ({children, stripeProp = stripe}: any) => (
    <PricingProvider
      stripe={stripeProp}
      options={{pricingPolicy: 'pricing_policy_123'}}
    >
      {children}
    </PricingProvider>
  );

  it.each([
    ['useResolvedPrice', () => useResolvedPrice('price_123')],
    ['useCurrencySelection', () => useCurrencySelection()],
    ['usePricingToken', () => usePricingToken()],
  ])('throws the hook-specific context error for %s', (hookName, useHook) => {
    expect(() => renderHook(useHook as any)).toThrow(
      `Could not find Pricing context. You need to wrap the part of your app that calls ${hookName}() in a <PricingProvider>.`
    );
  });

  it('reuses read requests during StrictMode effect replay', async () => {
    const context = {type: 'success' as const, pricing, changeVersion: 0};
    const strictWrapper = ({children}: {children: React.ReactNode}) => (
      <StrictMode>
        <PricingContext.Provider value={context}>
          {children}
        </PricingContext.Provider>
      </StrictMode>
    );
    const {result} = renderHook(
      () => ({
        price: useResolvedPrice('price_123'),
        currency: useCurrencySelection(),
      }),
      {wrapper: strictWrapper}
    );

    await waitFor(() => {
      expect(result.current.price.loading).toBe(false);
      expect(result.current.currency.loading).toBe(false);
    });
    expect(pricing.resolvePrice).toHaveBeenCalledTimes(1);
    expect(pricing.getAvailableCurrencies).toHaveBeenCalledTimes(1);
    expect(pricing.getSelectedCurrency).toHaveBeenCalledTimes(1);
  });

  describe('useResolvedPrice', () => {
    it('loads a price and retains its result reference on parent rerenders', async () => {
      const resolvedPrice = {
        currency: 'eur',
        unitAmount: {amount: '9.00', minorUnitsAmount: 900},
        unitAmountDecimal: {amount: '9.00', minorUnitsAmount: 900},
        minorUnitsAmountDivisor: 100,
      };
      pricing.resolvePrice.mockResolvedValue(resolvedPrice);

      const {result, rerender} = renderHook(
        () => useResolvedPrice('price_123'),
        {wrapper}
      );
      expect(result.current).toEqual({loading: true});
      await waitFor(() =>
        expect(result.current).toEqual({loading: false, data: resolvedPrice})
      );
      expect(pricing.resolvePrice).toHaveBeenCalledWith('price_123');

      const previousResult = result.current;
      rerender();
      expect(result.current).toBe(previousResult);
    });

    it('refreshes for price and Pricing change generations', async () => {
      const {result, rerender} = renderHook(
        ({price}: {price: string}) => useResolvedPrice(price),
        {wrapper, initialProps: {price: 'price_one'}}
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      rerender({price: 'price_two'});
      expect(result.current).toEqual({loading: true});
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(pricing.resolvePrice).toHaveBeenLastCalledWith('price_two');

      act(() => pricing.emitChange());
      expect(result.current).toEqual({loading: true});
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(pricing.resolvePrice).toHaveBeenCalledTimes(3);
    });

    it('ignores stale requests that resolve out of order', async () => {
      const first = makeDeferred<any>();
      const second = makeDeferred<any>();
      pricing.resolvePrice
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise);
      const {result, rerender} = renderHook(
        ({price}: {price: string}) => useResolvedPrice(price),
        {wrapper, initialProps: {price: 'price_one'}}
      );

      await act(async () => {});
      rerender({price: 'price_two'});
      const latest = {
        currency: 'eur',
        unitAmount: null,
        unitAmountDecimal: null,
        minorUnitsAmountDivisor: 100,
      };
      await act(() => second.resolve(latest));
      expect(result.current).toEqual({loading: false, data: latest});

      await act(() => first.resolve({...latest, currency: 'usd'}));
      expect(result.current).toEqual({loading: false, data: latest});
      expect(pricing.resolvePrice).toHaveBeenCalledTimes(2);
    });

    it('returns normalized resolution errors', async () => {
      pricing.resolvePrice.mockRejectedValue('unsupported price');
      const {result} = renderHook(() => useResolvedPrice('price_bad'), {
        wrapper,
      });
      await waitFor(() =>
        expect(result.current).toEqual({
          loading: false,
          error: new Error('unsupported price'),
        })
      );
    });
  });

  describe('useCurrencySelection', () => {
    it('reads selected currency after available currencies and ignores event data', async () => {
      const firstCurrencies = makeDeferred<any>();
      pricing.getAvailableCurrencies.mockReturnValueOnce(
        firstCurrencies.promise
      );
      const {result} = renderHook(() => useCurrencySelection(), {wrapper});

      await waitFor(() =>
        expect(pricing.getAvailableCurrencies).toHaveBeenCalledTimes(1)
      );
      expect(pricing.getSelectedCurrency).not.toHaveBeenCalled();

      await act(() => firstCurrencies.resolve([{currency: 'usd'}]));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.data?.selectedCurrency).toEqual({currency: 'usd'});

      pricing.getSelectedCurrency.mockResolvedValue({currency: 'jpy'});
      act(() => pricing.emitChange({selectedCurrency: {currency: 'eur'}}));
      await waitFor(() =>
        expect(result.current.data?.selectedCurrency).toEqual({currency: 'jpy'})
      );
      expect(pricing.getAvailableCurrencies).toHaveBeenCalledTimes(2);
      expect(pricing.getSelectedCurrency).toHaveBeenCalledTimes(2);
    });

    it('loads currency state, delegates the setter, and refreshes on change', async () => {
      const {result} = renderHook(() => useCurrencySelection(), {wrapper});
      expect(result.current.loading).toBe(true);
      expect(typeof result.current.setSelectedCurrency).toBe('function');
      await waitFor(() =>
        expect(result.current).toEqual({
          loading: false,
          data: {
            availableCurrencies: [{currency: 'usd'}, {currency: 'eur'}],
            selectedCurrency: {currency: 'usd'},
          },
          setSelectedCurrency: result.current.setSelectedCurrency,
        })
      );
      await expect(result.current.setSelectedCurrency('eur')).resolves.toBe(
        undefined
      );
      expect(pricing.setSelectedCurrency).toHaveBeenCalledWith('eur');

      act(() => pricing.emitChange({selectedCurrency: {currency: 'eur'}}));
      expect(result.current.loading).toBe(true);
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(pricing.getAvailableCurrencies).toHaveBeenCalledTimes(2);
        expect(pricing.getSelectedCurrency).toHaveBeenCalledTimes(2);
      });
    });

    it('ignores currency reads that resolve after a newer change', async () => {
      const first = makeDeferred<any>();
      const second = makeDeferred<any>();
      pricing.getSelectedCurrency
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise);
      const {result} = renderHook(() => useCurrencySelection(), {wrapper});
      await waitFor(() =>
        expect(pricing.getSelectedCurrency).toHaveBeenCalledTimes(1)
      );

      act(() => pricing.emitChange());
      await waitFor(() =>
        expect(pricing.getSelectedCurrency).toHaveBeenCalledTimes(2)
      );
      await act(() => second.resolve({currency: 'eur'}));
      expect(result.current.data?.selectedCurrency).toEqual({currency: 'eur'});

      await act(() => first.resolve({currency: 'usd'}));
      expect(result.current.data?.selectedCurrency).toEqual({currency: 'eur'});
    });

    it('rejects before initialization and preserves data after setter failure', async () => {
      const initialization = makeDeferred<any>();
      stripe.initializePricing.mockReturnValue(initialization.promise);
      const {result} = renderHook(() => useCurrencySelection(), {
        wrapper,
      });

      await expect(result.current.setSelectedCurrency('eur')).rejects.toThrow(
        /Pricing is not ready/
      );
      await act(() => initialization.resolve(pricing));
      await waitFor(() => expect(result.current.loading).toBe(false));
      const successfulResult = result.current;

      const failure = new Error('invalid currency');
      pricing.setSelectedCurrency.mockRejectedValue(failure);
      await expect(result.current.setSelectedCurrency('bad')).rejects.toBe(
        failure
      );
      expect(result.current).toBe(successfulResult);
    });

    it('surfaces read errors', async () => {
      const failure = new Error('currency read failed');
      pricing.getSelectedCurrency.mockRejectedValue(failure);
      const {result} = renderHook(() => useCurrencySelection(), {wrapper});
      await waitFor(() => expect(result.current.error).toBe(failure));
    });
  });

  describe('usePricingToken', () => {
    it('returns a stable callback and preserves SDK failures', async () => {
      const failure = new Error('token failed');
      const {result, rerender} = renderHook(() => usePricingToken(), {wrapper});
      const pendingCallback = result.current.createPricingToken;
      await act(async () => {
        await expect(pendingCallback()).rejects.toThrow(/Pricing is not ready/);
      });

      await waitFor(() =>
        expect(result.current.createPricingToken).not.toBe(pendingCallback)
      );
      const readyResult = result.current;
      rerender();
      expect(result.current).toBe(readyResult);
      await expect(result.current.createPricingToken()).resolves.toEqual({
        id: 'prctok_test',
      });

      pricing.createPricingToken.mockRejectedValue(failure);
      await expect(result.current.createPricingToken()).rejects.toBe(failure);
    });

    it('rejects with the provider initialization error', async () => {
      const failure = new Error('initialize failed');
      stripe.initializePricing.mockRejectedValue(failure);
      const {result} = renderHook(() => usePricingToken(), {
        wrapper,
      });
      const pendingCallback = result.current.createPricingToken;
      await waitFor(() =>
        expect(result.current.createPricingToken).not.toBe(pendingCallback)
      );
      await expect(result.current.createPricingToken()).rejects.toBe(failure);
    });
  });
});
