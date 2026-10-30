import React, {StrictMode} from 'react';
import {act, render, renderHook, waitFor} from '@testing-library/react';

import * as mocks from '../../test/mocks';
import makeDeferred from '../../test/makeDeferred';
import {Activity} from '../../test/Activity';
import {PricingProvider} from './PricingProvider';
import {useCurrencySelection} from './useCurrencySelection';
import {useResolvedPrice} from './useResolvedPrice';

describe('Currency selection', () => {
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

  it('requires PricingProvider', () => {
    expect(() => renderHook(() => useCurrencySelection())).toThrow(
      'Could not find Pricing context. You need to wrap the part of your app that calls useCurrencySelection() in a <PricingProvider>.'
    );
  });

  it.each(['throw', 'reject'])(
    'normalizes available-currency failures that %s',
    async (kind) => {
      const failure = {message: 'currencies unavailable'};
      if (kind === 'throw') {
        pricing.getAvailableCurrencies.mockImplementation(() => {
          throw failure;
        });
      } else {
        pricing.getAvailableCurrencies.mockRejectedValue(failure);
      }
      const {result} = renderHook(() => useCurrencySelection(), {wrapper});
      await waitFor(() =>
        expect(result.current.error).toEqual(
          new Error('currencies unavailable')
        )
      );
      expect(pricing.getSelectedCurrency).not.toHaveBeenCalled();
    }
  );

  it('rejects the setter with the provider initialization error', async () => {
    const failure = new Error('initialize failed');
    stripe.initializePricing.mockRejectedValue(failure);
    const {result} = renderHook(() => useCurrencySelection(), {wrapper});
    await waitFor(() => expect(result.current.error).toBe(failure));
    await expect(result.current.setSelectedCurrency('eur')).rejects.toBe(
      failure
    );
    expect(pricing.setSelectedCurrency).not.toHaveBeenCalled();
  });

  it('preserves the setter across rerenders and pricing change events', async () => {
    const {result, rerender} = renderHook(() => useCurrencySelection(), {
      wrapper,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    const ready = result.current;
    rerender();
    expect(result.current).toBe(ready);
    act(() => pricing.emitChange());
    expect(result.current.setSelectedCurrency).toBe(ready.setSelectedCurrency);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.setSelectedCurrency).toBe(ready.setSelectedCurrency);
  });

  it('refreshes both hooks and preserves the setter across effect reconnections', async () => {
    let currency = 'usd';
    pricing.getSelectedCurrency.mockImplementation(() =>
      Promise.resolve({currency})
    );
    pricing.resolvePrice.mockImplementation(() =>
      Promise.resolve({
        currency,
        unitAmount: null,
        unitAmountDecimal: null,
        minorUnitsAmountDivisor: 100,
      })
    );
    pricing.setSelectedCurrency.mockImplementation((next: string) => {
      currency = next;
      pricing.emitChange();
      return Promise.resolve();
    });
    let selection: ReturnType<typeof useCurrencySelection>;
    let price: ReturnType<typeof useResolvedPrice>;
    const getSelection = (): ReturnType<typeof useCurrencySelection> =>
      selection;
    const Consumer = () => {
      selection = useCurrencySelection();
      price = useResolvedPrice('price_123');
      return <p>{selection.data?.selectedCurrency.currency}</p>;
    };
    const tree = (mode: 'visible' | 'hidden') => (
      <StrictMode>
        <Activity mode={mode}>
          <PricingProvider stripe={stripe} options={{pricingPolicy: 'policy'}}>
            <Consumer />
          </PricingProvider>
        </Activity>
      </StrictMode>
    );
    const {rerender, unmount} = render(tree('visible'));
    await waitFor(() => {
      expect(selection.data?.selectedCurrency.currency).toBe('usd');
      expect(price.data?.currency).toBe('usd');
    });
    const setter = getSelection().setSelectedCurrency;

    for (const next of ['eur', 'usd']) {
      rerender(tree('hidden'));
      expect(pricing.changeListeners.size).toBe(0);
      await act(() => setter(next));
      rerender(tree('visible'));
      await waitFor(() => {
        expect(selection.data?.selectedCurrency.currency).toBe(next);
        expect(price.data?.currency).toBe(next);
      });
      expect(getSelection().setSelectedCurrency).toBe(setter);
      expect(pricing.changeListeners.size).toBe(1);
    }

    expect(stripe.initializePricing).toHaveBeenCalledTimes(1);
    expect(pricing.resolvePrice).toHaveBeenCalledTimes(3);
    expect(pricing.getAvailableCurrencies).toHaveBeenCalledTimes(3);
    expect(pricing.getSelectedCurrency).toHaveBeenCalledTimes(3);
    unmount();
    expect(pricing.changeListeners.size).toBe(0);
  });

  describe('useCurrencySelection', () => {
    it('reads selected currency after available currencies and refreshes on change', async () => {
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
      act(() => pricing.emitChange());
      await waitFor(() =>
        expect(result.current.data?.selectedCurrency).toEqual({currency: 'jpy'})
      );
      expect(pricing.getAvailableCurrencies).toHaveBeenCalledTimes(2);
      expect(pricing.getSelectedCurrency).toHaveBeenCalledTimes(2);
    });

    it('loads currency state and delegates the setter', async () => {
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
});
