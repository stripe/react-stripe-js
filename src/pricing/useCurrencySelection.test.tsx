import React from 'react';
import {act, renderHook, waitFor} from '@testing-library/react';
import * as stripeJs from '@stripe/stripe-js';

import * as mocks from '../../test/mocks';
import makeDeferred from '../../test/makeDeferred';
import {PricingContext, PricingState} from './PricingContext';
import {PricingProvider} from './PricingProvider';
import {useCurrencySelection} from './useCurrencySelection';

describe('useCurrencySelection', () => {
  let mockStripe: any;
  let mockPricing: any;
  let pricingState: PricingState;
  let pricingPromise: Promise<stripeJs.Pricing>;
  const availableCurrencies = [{currency: 'usd'}, {currency: 'eur'}];
  const selectedCurrency = {currency: 'usd'};
  const data = {availableCurrencies, selectedCurrency};
  const options = {pricingPolicy: 'pricing_policy_123'};

  const ContextWrapper = ({children}: React.PropsWithChildren) => (
    <PricingContext.Provider value={{state: pricingState, pricingPromise}}>
      {children}
    </PricingContext.Provider>
  );

  const ProviderWrapper = ({children}: React.PropsWithChildren) => (
    <PricingProvider stripe={mockStripe} options={options}>
      {children}
    </PricingProvider>
  );

  beforeEach(() => {
    mockStripe = mocks.mockStripe();
    mockPricing = mocks.mockPricing();
    mockPricing.getAvailableCurrencies.mockResolvedValue(availableCurrencies);
    mockPricing.getSelectedCurrency.mockResolvedValue(selectedCurrency);
    mockPricing.setSelectedCurrency.mockResolvedValue(undefined);
    mockStripe.initializePricing.mockResolvedValue(mockPricing);
    pricingState = {type: 'success', pricing: mockPricing, changeVersion: 0};
    pricingPromise = Promise.resolve(mockPricing);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('requires a PricingProvider and names the hook in the error', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useCurrencySelection())).toThrow(
      'Could not find Pricing context. You need to wrap the part of your app that calls useCurrencySelection() in a <PricingProvider>.'
    );
  });

  it('waits for initialization and both currency reads before returning data', async () => {
    const initialized = makeDeferred<stripeJs.Pricing>();
    mockStripe.initializePricing.mockReturnValue(initialized.promise);
    const available = makeDeferred<stripeJs.CurrencyInfo[]>();
    const selected = makeDeferred<stripeJs.CurrencyInfo>();
    mockPricing.getAvailableCurrencies.mockReturnValue(available.promise);
    mockPricing.getSelectedCurrency.mockReturnValue(selected.promise);
    const {result} = renderHook(() => useCurrencySelection(), {
      wrapper: ProviderWrapper,
    });

    expect(result.current).toEqual({
      loading: true,
      setSelectedCurrency: expect.any(Function),
    });
    expect(mockPricing.getAvailableCurrencies).not.toHaveBeenCalled();
    expect(mockPricing.getSelectedCurrency).not.toHaveBeenCalled();

    await act(() => initialized.resolve(mockPricing));
    expect(mockPricing.getAvailableCurrencies).toHaveBeenCalledTimes(1);

    await act(() => available.resolve(availableCurrencies));
    expect(mockPricing.getSelectedCurrency).toHaveBeenCalledTimes(1);
    expect(result.current.loading).toBe(true);
    await act(() => selected.resolve(selectedCurrency));
    expect(result.current).toEqual({
      loading: false,
      data,
      setSelectedCurrency: expect.any(Function),
    });
  });

  it('waits for initialization before forwarding a currency change', async () => {
    const initialized = makeDeferred<stripeJs.Pricing>();
    mockStripe.initializePricing.mockReturnValue(initialized.promise);
    const {result} = renderHook(() => useCurrencySelection(), {
      wrapper: ProviderWrapper,
    });
    const pending = result.current.setSelectedCurrency('eur');
    const settled = jest.fn();
    pending.then(settled, settled);
    await act(async () => {});
    expect(settled).not.toHaveBeenCalled();
    expect(mockPricing.setSelectedCurrency).not.toHaveBeenCalled();

    await act(() => initialized.resolve(mockPricing));

    await expect(pending).resolves.toBeUndefined();
    expect(mockPricing.setSelectedCurrency).toHaveBeenCalledTimes(1);
    expect(mockPricing.setSelectedCurrency).toHaveBeenCalledWith('eur');
  });

  it('forwards concurrent currency changes and waits for each SDK result independently', async () => {
    const change = makeDeferred<void>();
    mockPricing.setSelectedCurrency.mockReturnValueOnce(change.promise);
    const {result} = renderHook(() => useCurrencySelection(), {
      wrapper: ContextWrapper,
    });
    await waitFor(() => expect(result.current).toMatchObject({data}));

    const setSelectedCurrency = result.current.setSelectedCurrency;
    const first = setSelectedCurrency('eur');
    const second = setSelectedCurrency('usd');
    const settled = jest.fn();
    first.then(settled, settled);

    await expect(second).resolves.toBeUndefined();
    expect(mockPricing.setSelectedCurrency).toHaveBeenCalledTimes(2);
    expect(mockPricing.setSelectedCurrency).toHaveBeenNthCalledWith(1, 'eur');
    expect(mockPricing.setSelectedCurrency).toHaveBeenNthCalledWith(2, 'usd');
    expect(settled).not.toHaveBeenCalled();

    await change.resolve(undefined);
    await expect(first).resolves.toBeUndefined();
    expect(settled).toHaveBeenCalledTimes(1);
  });

  it('rejects waiting calls when initialization fails', async () => {
    const initialized = makeDeferred<stripeJs.Pricing>();
    mockStripe.initializePricing.mockReturnValue(initialized.promise);
    const {result} = renderHook(() => useCurrencySelection(), {
      wrapper: ProviderWrapper,
    });
    const rejected = expect(
      result.current.setSelectedCurrency('eur')
    ).rejects.toThrow('Initialization failed');

    await act(() => initialized.reject(new Error('Initialization failed')));
    await rejected;
    expect(mockPricing.setSelectedCurrency).not.toHaveBeenCalled();
  });

  it('preserves a pending call across StrictMode effect replay and executes it once', async () => {
    const initialized = makeDeferred<stripeJs.Pricing>();
    mockStripe.initializePricing.mockReturnValue(initialized.promise);
    let pending: Promise<void> | undefined;
    const {result} = renderHook(
      () => {
        const selection = useCurrencySelection();
        const {setSelectedCurrency} = selection;
        React.useEffect(() => {
          if (!pending) {
            pending = setSelectedCurrency('eur');
          }
        }, [setSelectedCurrency]);
        return selection;
      },
      {
        reactStrictMode: true,
        wrapper: ProviderWrapper,
      }
    );
    await act(async () => {});
    expect(result.current.loading).toBe(true);
    expect(mockPricing.setSelectedCurrency).not.toHaveBeenCalled();

    await act(() => initialized.resolve(mockPricing));
    await expect(pending).resolves.toBeUndefined();
    expect(mockPricing.setSelectedCurrency).toHaveBeenCalledTimes(1);
    expect(mockPricing.setSelectedCurrency).toHaveBeenCalledWith('eur');
    expect(mockStripe.initializePricing).toHaveBeenCalledTimes(1);
  });

  it('executes a pending currency change after its consumer unmounts while the provider stays mounted', async () => {
    const initialized = makeDeferred<stripeJs.Pricing>();
    mockStripe.initializePricing.mockReturnValue(initialized.promise);
    let showConsumer = true;
    const {result, rerender} = renderHook(() => useCurrencySelection(), {
      wrapper: ({children}) => (
        <ProviderWrapper>{showConsumer ? children : null}</ProviderWrapper>
      ),
    });
    const pending = result.current.setSelectedCurrency('eur');

    showConsumer = false;
    rerender();
    expect(mockPricing.setSelectedCurrency).not.toHaveBeenCalled();
    await act(() => initialized.resolve(mockPricing));

    await expect(pending).resolves.toBeUndefined();
    expect(mockPricing.setSelectedCurrency).toHaveBeenCalledTimes(1);
    expect(mockPricing.setSelectedCurrency).toHaveBeenCalledWith('eur');
  });

  it('reports provider initialization errors and rejects currency changes', async () => {
    const error = new Error('Initialization failed');
    pricingState = {type: 'error', error};
    pricingPromise = Promise.reject(new Error(error.message));
    pricingPromise.catch(() => {});
    const {result} = renderHook(() => useCurrencySelection(), {
      wrapper: ContextWrapper,
    });

    expect(result.current).toEqual({
      loading: false,
      error,
      setSelectedCurrency: expect.any(Function),
    });
    await expect(result.current.setSelectedCurrency('eur')).rejects.toThrow(
      error.message
    );
    expect(mockPricing.getAvailableCurrencies).not.toHaveBeenCalled();
    expect(mockPricing.getSelectedCurrency).not.toHaveBeenCalled();
    expect(mockPricing.setSelectedCurrency).not.toHaveBeenCalled();
  });

  it('reports errors from getAvailableCurrencies', async () => {
    const error = new Error(`getAvailableCurrencies failed`);
    mockPricing.getAvailableCurrencies.mockRejectedValueOnce(error);
    const {result} = renderHook(() => useCurrencySelection(), {
      wrapper: ContextWrapper,
    });

    await waitFor(() =>
      expect(result.current).toEqual({
        loading: false,
        error: new Error(error.message),
        setSelectedCurrency: expect.any(Function),
      })
    );
  });

  it('reports errors from getSelectedCurrency', async () => {
    const error = new Error(`getSelectedCurrency failed`);
    mockPricing.getSelectedCurrency.mockRejectedValueOnce(error);
    const {result} = renderHook(() => useCurrencySelection(), {
      wrapper: ContextWrapper,
    });

    await waitFor(() =>
      expect(result.current).toEqual({
        loading: false,
        error: new Error(error.message),
        setSelectedCurrency: expect.any(Function),
      })
    );
  });

  it('reports synchronous errors from getAvailableCurrencies', () => {
    const error = new Error(`getAvailableCurrencies threw`);
    mockPricing.getAvailableCurrencies.mockImplementationOnce(() => {
      throw error;
    });
    const {result} = renderHook(() => useCurrencySelection(), {
      wrapper: ContextWrapper,
    });

    return waitFor(() =>
      expect(result.current).toEqual({
        loading: false,
        error: new Error(error.message),
        setSelectedCurrency: expect.any(Function),
      })
    );
  });

  it('reports synchronous errors from getSelectedCurrency', () => {
    const error = new Error(`getSelectedCurrency threw`);
    mockPricing.getSelectedCurrency.mockImplementationOnce(() => {
      throw error;
    });
    const {result} = renderHook(() => useCurrencySelection(), {
      wrapper: ContextWrapper,
    });

    return waitFor(() =>
      expect(result.current).toEqual({
        loading: false,
        error: new Error(error.message),
        setSelectedCurrency: expect.any(Function),
      })
    );
  });

  it('reports synchronous refresh errors from getAvailableCurrencies and recovers on retry', () => {
    const {result, rerender} = renderHook(() => useCurrencySelection(), {
      wrapper: ContextWrapper,
    });
    const error = new Error(`getAvailableCurrencies threw during refresh`);

    return waitFor(() => expect(result.current).toMatchObject({data}))
      .then(() => {
        mockPricing.getAvailableCurrencies.mockImplementationOnce(() => {
          throw error;
        });
        pricingState = {
          type: 'success',
          pricing: mockPricing,
          changeVersion: 1,
        };
        rerender();
        expect(result.current).toMatchObject({loading: true, data});

        return waitFor(() =>
          expect(result.current).toEqual({
            loading: false,
            error: new Error(error.message),
            setSelectedCurrency: expect.any(Function),
          })
        );
      })
      .then(() => {
        pricingState = {
          type: 'success',
          pricing: mockPricing,
          changeVersion: 2,
        };
        rerender();
        expect(result.current).toEqual({
          loading: true,
          setSelectedCurrency: expect.any(Function),
        });

        return waitFor(() =>
          expect(result.current).toMatchObject({loading: false, data})
        );
      });
  });

  it('reports synchronous refresh errors from getSelectedCurrency and recovers on retry', () => {
    const {result, rerender} = renderHook(() => useCurrencySelection(), {
      wrapper: ContextWrapper,
    });
    const error = new Error(`getSelectedCurrency threw during refresh`);

    return waitFor(() => expect(result.current).toMatchObject({data}))
      .then(() => {
        mockPricing.getSelectedCurrency.mockImplementationOnce(() => {
          throw error;
        });
        pricingState = {
          type: 'success',
          pricing: mockPricing,
          changeVersion: 1,
        };
        rerender();
        expect(result.current).toMatchObject({loading: true, data});

        return waitFor(() =>
          expect(result.current).toEqual({
            loading: false,
            error: new Error(error.message),
            setSelectedCurrency: expect.any(Function),
          })
        );
      })
      .then(() => {
        pricingState = {
          type: 'success',
          pricing: mockPricing,
          changeVersion: 2,
        };
        rerender();
        expect(result.current).toEqual({
          loading: true,
          setSelectedCurrency: expect.any(Function),
        });

        return waitFor(() =>
          expect(result.current).toMatchObject({loading: false, data})
        );
      });
  });

  it('rejects synchronous currency selection errors and allows another attempt', () => {
    const error = new Error('Currency selection threw');
    mockPricing.setSelectedCurrency.mockImplementationOnce(() => {
      throw error;
    });
    const {result} = renderHook(() => useCurrencySelection(), {
      wrapper: ContextWrapper,
    });

    return waitFor(() => expect(result.current).toMatchObject({data}))
      .then(() =>
        expect(result.current.setSelectedCurrency('invalid')).rejects.toBe(
          error
        )
      )
      .then(() => {
        expect(result.current).toMatchObject({loading: false, data});
        return expect(
          result.current.setSelectedCurrency('eur')
        ).resolves.toBeUndefined();
      });
  });

  it('forwards currency changes and refreshes both reads on change events', async () => {
    const {result} = renderHook(() => useCurrencySelection(), {
      wrapper: ProviderWrapper,
    });
    await waitFor(() => expect(result.current).toMatchObject({data}));
    const previousData = result.current.data;
    const setSelectedCurrency = result.current.setSelectedCurrency;

    await expect(setSelectedCurrency('eur')).resolves.toBeUndefined();
    expect(mockPricing.setSelectedCurrency).toHaveBeenCalledWith('eur');
    expect(mockPricing.setSelectedCurrency).toHaveBeenCalledTimes(1);
    expect(result.current).toMatchObject({data});

    const updatedCurrencies = [{currency: 'eur'}];
    const selected = makeDeferred<stripeJs.CurrencyInfo>();
    mockPricing.getAvailableCurrencies.mockResolvedValue(updatedCurrencies);
    mockPricing.getSelectedCurrency.mockReturnValueOnce(selected.promise);
    act(() => mockPricing._emitChange());
    expect(result.current).toMatchObject({loading: true, data});
    expect(result.current.data).toBe(previousData);
    expect(result.current.setSelectedCurrency).toBe(setSelectedCurrency);

    await act(() => selected.resolve({currency: 'eur'}));
    expect(result.current).toMatchObject({
      loading: false,
      data: {
        availableCurrencies: updatedCurrencies,
        selectedCurrency: {currency: 'eur'},
      },
    });
    expect(mockPricing.getAvailableCurrencies).toHaveBeenCalledTimes(2);
    expect(mockPricing.getSelectedCurrency).toHaveBeenCalledTimes(2);
    expect(result.current.setSelectedCurrency).toBe(setSelectedCurrency);
  });

  it('clears retained data when getAvailableCurrencies fails during refresh and recovers on the next change', async () => {
    const {result, rerender} = renderHook(() => useCurrencySelection(), {
      wrapper: ContextWrapper,
    });
    await waitFor(() => expect(result.current).toMatchObject({data}));
    const previousData = result.current.data;
    const refresh = makeDeferred<never>();
    mockPricing.getAvailableCurrencies.mockReturnValueOnce(refresh.promise);
    pricingState = {type: 'success', pricing: mockPricing, changeVersion: 1};
    rerender();
    expect(result.current).toMatchObject({loading: true, data});
    expect(result.current.data).toBe(previousData);

    await act(() => refresh.reject(new Error('Currency refresh failed')));
    expect(result.current).toEqual({
      loading: false,
      error: new Error('Currency refresh failed'),
      setSelectedCurrency: expect.any(Function),
    });

    const retry = makeDeferred<stripeJs.CurrencyInfo>();
    mockPricing.getSelectedCurrency.mockReturnValueOnce(retry.promise);
    pricingState = {type: 'success', pricing: mockPricing, changeVersion: 2};
    rerender();
    expect(result.current).toEqual({
      loading: true,
      setSelectedCurrency: expect.any(Function),
    });

    await act(() => retry.resolve({currency: 'eur'}));
    expect(result.current).toMatchObject({
      loading: false,
      data: {availableCurrencies, selectedCurrency: {currency: 'eur'}},
    });
  });

  it('clears retained data when getSelectedCurrency fails during refresh and recovers on the next change', async () => {
    const {result, rerender} = renderHook(() => useCurrencySelection(), {
      wrapper: ContextWrapper,
    });
    await waitFor(() => expect(result.current).toMatchObject({data}));
    const previousData = result.current.data;
    const refresh = makeDeferred<never>();
    mockPricing.getSelectedCurrency.mockReturnValueOnce(refresh.promise);
    pricingState = {type: 'success', pricing: mockPricing, changeVersion: 1};
    rerender();
    expect(result.current).toMatchObject({loading: true, data});
    expect(result.current.data).toBe(previousData);

    await act(() => refresh.reject(new Error('Currency refresh failed')));
    expect(result.current).toEqual({
      loading: false,
      error: new Error('Currency refresh failed'),
      setSelectedCurrency: expect.any(Function),
    });

    const retry = makeDeferred<stripeJs.CurrencyInfo>();
    mockPricing.getSelectedCurrency.mockReturnValueOnce(retry.promise);
    pricingState = {type: 'success', pricing: mockPricing, changeVersion: 2};
    rerender();
    expect(result.current).toEqual({
      loading: true,
      setSelectedCurrency: expect.any(Function),
    });

    await act(() => retry.resolve({currency: 'eur'}));
    expect(result.current).toMatchObject({
      loading: false,
      data: {availableCurrencies, selectedCurrency: {currency: 'eur'}},
    });
  });

  it('propagates currency selection errors without replacing the displayed data', async () => {
    const error = new Error('Unsupported currency');
    mockPricing.setSelectedCurrency.mockRejectedValueOnce(error);
    const {result} = renderHook(() => useCurrencySelection(), {
      wrapper: ContextWrapper,
    });
    await waitFor(() => expect(result.current).toMatchObject({data}));

    await expect(result.current.setSelectedCurrency('invalid')).rejects.toBe(
      error
    );
    expect(result.current).toMatchObject({loading: false, data});
  });

  it('handles StrictMode replay without repeating currency reads on unrelated rerenders', async () => {
    const selected = makeDeferred<stripeJs.CurrencyInfo>();
    mockPricing.getSelectedCurrency.mockReturnValue(selected.promise);
    const {result, rerender} = renderHook(() => useCurrencySelection(), {
      reactStrictMode: true,
      wrapper: ContextWrapper,
    });
    expect(result.current.loading).toBe(true);
    await act(() => selected.resolve(selectedCurrency));
    expect(result.current).toMatchObject({loading: false, data});
    const setSelectedCurrency = result.current.setSelectedCurrency;

    pricingState = {type: 'success', pricing: mockPricing, changeVersion: 0};
    rerender();
    expect(mockPricing.getAvailableCurrencies).toHaveBeenCalledTimes(2);
    expect(mockPricing.getSelectedCurrency).toHaveBeenCalledTimes(2);
    expect(mockPricing.setSelectedCurrency).not.toHaveBeenCalled();
    expect(result.current.setSelectedCurrency).toBe(setSelectedCurrency);
  });

  it('keeps the latest currency data when an older response arrives afterward', async () => {
    const first = makeDeferred<stripeJs.CurrencyInfo>();
    const second = makeDeferred<stripeJs.CurrencyInfo>();
    mockPricing.getSelectedCurrency
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const {result, rerender} = renderHook(() => useCurrencySelection(), {
      wrapper: ContextWrapper,
    });

    pricingState = {type: 'success', pricing: mockPricing, changeVersion: 1};
    rerender();
    await act(() => second.resolve({currency: 'eur'}));
    expect(result.current).toMatchObject({
      loading: false,
      data: {availableCurrencies, selectedCurrency: {currency: 'eur'}},
    });

    await act(() => first.resolve(selectedCurrency));
    expect(result.current).toMatchObject({
      loading: false,
      data: {availableCurrencies, selectedCurrency: {currency: 'eur'}},
    });
  });
});
