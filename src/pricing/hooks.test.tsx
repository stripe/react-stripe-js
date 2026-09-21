import React from 'react';
import {act} from '@testing-library/react';
import {renderHook} from '@testing-library/react-hooks';

import * as mocks from '../../test/mocks';
import makeDeferred from '../../test/makeDeferred';
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
    stripe.__initializePricing.mockResolvedValue(pricing);
  });

  const wrapper = ({children, stripeProp = stripe}: any) => (
    <PricingProvider stripe={stripeProp}>{children}</PricingProvider>
  );

  it.each([
    ['useResolvedPrice', () => useResolvedPrice('price_123')],
    ['useCurrencySelection', () => useCurrencySelection()],
    ['usePricingToken', () => usePricingToken()],
  ])('throws the hook-specific context error for %s', (hookName, useHook) => {
    const {result} = renderHook(useHook as any);
    expect(result.error).toEqual(
      new Error(
        `Could not find Pricing context. You need to wrap the part of your app that calls ${hookName}() in a <PricingProvider>.`
      )
    );
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

      const {result, waitForNextUpdate, rerender} = renderHook(
        () => useResolvedPrice('price_123'),
        {wrapper}
      );
      expect(result.current).toEqual({loading: true});
      await waitForNextUpdate();
      expect(result.current).toEqual({loading: false, data: resolvedPrice});
      expect(pricing.resolvePrice).toHaveBeenCalledWith('price_123');

      const previousResult = result.current;
      rerender();
      expect(result.current).toBe(previousResult);
    });

    it('refreshes for price and Pricing change generations', async () => {
      const {result, waitForNextUpdate, rerender} = renderHook(
        ({price}) => useResolvedPrice(price),
        {wrapper, initialProps: {price: 'price_one'}}
      );
      await waitForNextUpdate();

      rerender({price: 'price_two'});
      expect(result.current).toEqual({loading: true});
      await waitForNextUpdate();
      expect(pricing.resolvePrice).toHaveBeenLastCalledWith('price_two');

      act(() => pricing.emitChange());
      expect(result.current).toEqual({loading: true});
      await waitForNextUpdate();
      expect(pricing.resolvePrice).toHaveBeenCalledTimes(3);
    });

    it('ignores stale requests that resolve out of order', async () => {
      const first = makeDeferred<any>();
      const second = makeDeferred<any>();
      pricing.resolvePrice
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise);
      const {result, rerender, waitForNextUpdate} = renderHook(
        ({price}) => useResolvedPrice(price),
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
      void waitForNextUpdate;
    });

    it('returns normalized resolution errors', async () => {
      pricing.resolvePrice.mockRejectedValue('unsupported price');
      const {result, waitForNextUpdate} = renderHook(
        () => useResolvedPrice('price_bad'),
        {wrapper}
      );
      await waitForNextUpdate();
      expect(result.current).toEqual({
        loading: false,
        error: new Error('unsupported price'),
      });
    });
  });

  describe('useCurrencySelection', () => {
    it('loads currency state, delegates the setter, and refreshes on change', async () => {
      const {result, waitForNextUpdate} = renderHook(
        () => useCurrencySelection(),
        {wrapper}
      );
      expect(result.current.loading).toBe(true);
      expect(typeof result.current.setSelectedCurrency).toBe('function');
      await waitForNextUpdate();

      expect(result.current).toEqual({
        loading: false,
        data: {
          availableCurrencies: [{currency: 'usd'}, {currency: 'eur'}],
          selectedCurrency: {currency: 'usd'},
        },
        setSelectedCurrency: result.current.setSelectedCurrency,
      });
      await expect(result.current.setSelectedCurrency('eur')).resolves.toBe(
        undefined
      );
      expect(pricing.setSelectedCurrency).toHaveBeenCalledWith('eur');

      act(() => pricing.emitChange({selectedCurrency: {currency: 'eur'}}));
      expect(result.current.loading).toBe(true);
      await waitForNextUpdate();
      expect(pricing.getAvailableCurrencies).toHaveBeenCalledTimes(2);
      expect(pricing.getSelectedCurrency).toHaveBeenCalledTimes(2);
    });

    it('rejects before initialization and preserves data after setter failure', async () => {
      const initialization = makeDeferred<any>();
      stripe.__initializePricing.mockReturnValue(initialization.promise);
      const {result, waitFor} = renderHook(() => useCurrencySelection(), {
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
      const {result, waitForNextUpdate} = renderHook(
        () => useCurrencySelection(),
        {wrapper}
      );
      await waitForNextUpdate();
      expect(result.current.error).toBe(failure);
    });
  });

  describe('usePricingToken', () => {
    it('returns a stable callback and preserves SDK failures', async () => {
      const failure = new Error('token failed');
      const {result, waitForNextUpdate, rerender} = renderHook(
        () => usePricingToken(),
        {wrapper}
      );
      const pendingCallback = result.current.createPricingToken;
      await expect(pendingCallback()).rejects.toThrow(/Pricing is not ready/);

      await waitForNextUpdate();
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
      stripe.__initializePricing.mockRejectedValue(failure);
      const {result, waitForNextUpdate} = renderHook(() => usePricingToken(), {
        wrapper,
      });
      await waitForNextUpdate();
      await expect(result.current.createPricingToken()).rejects.toBe(failure);
    });
  });
});
