import React from 'react';
import {act, renderHook, waitFor} from '@testing-library/react';
import * as stripeJs from '@stripe/stripe-js';

import * as mocks from '../../test/mocks';
import makeDeferred from '../../test/makeDeferred';
import {PricingContext, PricingState} from './PricingContext';
import {PricingProvider} from './PricingProvider';
import {useResolvedPrice} from './useResolvedPrice';

describe('useResolvedPrice', () => {
  let mockPricing: any;
  let pricingState: PricingState;

  const price = 'price_123';
  const resolvedPrice: stripeJs.ResolvedPrice = {
    currency: 'usd',
    unitAmount: {amount: '$10.00', minorUnitsAmount: 1000},
    unitAmountDecimal: null,
    minorUnitsAmountDivisor: 100,
  };
  const updatedPrice: stripeJs.ResolvedPrice = {
    currency: 'eur',
    unitAmount: {amount: '€9.00', minorUnitsAmount: 900},
    unitAmountDecimal: null,
    minorUnitsAmountDivisor: 100,
  };

  const ContextWrapper = ({children}: React.PropsWithChildren) => (
    <PricingContext.Provider value={pricingState}>
      {children}
    </PricingContext.Provider>
  );

  beforeEach(() => {
    mockPricing = mocks.mockPricing();
    mockPricing.resolvePrice.mockResolvedValue(resolvedPrice);
    pricingState = {type: 'success', pricing: mockPricing, changeVersion: 0};
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('requires a PricingProvider and names the hook in the error', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useResolvedPrice(price))).toThrow(
      'Could not find Pricing context. You need to wrap the part of your app that calls useResolvedPrice() in a <PricingProvider>.'
    );
  });

  it('waits for pricing initialization and price resolution before returning data', async () => {
    pricingState = {type: 'loading'};
    const deferred = makeDeferred<stripeJs.ResolvedPrice>();
    mockPricing.resolvePrice.mockReturnValue(deferred.promise);
    const {result, rerender} = renderHook(() => useResolvedPrice(price), {
      wrapper: ContextWrapper,
    });

    expect(result.current).toEqual({loading: true});
    expect(mockPricing.resolvePrice).not.toHaveBeenCalled();

    pricingState = {type: 'success', pricing: mockPricing, changeVersion: 0};
    await act(async () => {
      rerender();
    });
    expect(mockPricing.resolvePrice).toHaveBeenCalledWith(price);
    expect(result.current).toEqual({loading: true});

    await act(() => deferred.resolve(resolvedPrice));
    expect(result.current).toEqual({loading: false, data: resolvedPrice});
  });

  it('reports provider initialization errors', () => {
    const error = new Error('Failed to initialize pricing');
    pricingState = {type: 'error', error};
    const {result} = renderHook(() => useResolvedPrice(price), {
      wrapper: ContextWrapper,
    });

    expect(result.current).toEqual({loading: false, error});
    expect(mockPricing.resolvePrice).not.toHaveBeenCalled();
  });

  it('reports price resolution errors', async () => {
    mockPricing.resolvePrice.mockRejectedValueOnce(
      new Error('Price was not found')
    );
    const {result} = renderHook(() => useResolvedPrice(price), {
      wrapper: ContextWrapper,
    });

    await waitFor(() =>
      expect(result.current).toEqual({
        loading: false,
        error: new Error('Price was not found'),
      })
    );
  });

  it('reports synchronous price resolution errors', () => {
    mockPricing.resolvePrice.mockImplementationOnce(() => {
      throw new Error('Price resolution threw');
    });
    const {result} = renderHook(() => useResolvedPrice(price), {
      wrapper: ContextWrapper,
    });

    return waitFor(() =>
      expect(result.current).toEqual({
        loading: false,
        error: new Error('Price resolution threw'),
      })
    );
  });

  it('reports synchronous refresh errors and recovers on retry', () => {
    const {result, rerender} = renderHook(() => useResolvedPrice(price), {
      wrapper: ContextWrapper,
    });

    return waitFor(() => expect(result.current.data).toBe(resolvedPrice))
      .then(() => {
        mockPricing.resolvePrice.mockImplementationOnce(() => {
          throw new Error('Refresh threw');
        });
        pricingState = {
          type: 'success',
          pricing: mockPricing,
          changeVersion: 1,
        };
        rerender();
        expect(result.current).toEqual({loading: true, data: resolvedPrice});

        return waitFor(() =>
          expect(result.current).toEqual({
            loading: false,
            error: new Error('Refresh threw'),
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
        expect(result.current).toEqual({loading: true});

        return waitFor(() =>
          expect(result.current).toEqual({loading: false, data: resolvedPrice})
        );
      });
  });

  it('returns loading while resolving a new price after a successful request', async () => {
    const {result, rerender} = renderHook(
      ({priceId}) => useResolvedPrice(priceId),
      {
        initialProps: {priceId: price},
        wrapper: ContextWrapper,
      }
    );
    await waitFor(() =>
      expect(result.current).toEqual({loading: false, data: resolvedPrice})
    );

    const deferred = makeDeferred<stripeJs.ResolvedPrice>();
    mockPricing.resolvePrice.mockReturnValue(deferred.promise);
    rerender({priceId: 'price_456'});
    expect(result.current).toEqual({loading: true});

    await waitFor(() =>
      expect(mockPricing.resolvePrice).toHaveBeenLastCalledWith('price_456')
    );

    await act(() => deferred.resolve(updatedPrice));
    expect(result.current).toEqual({loading: false, data: updatedPrice});
  });

  it('returns loading for a new price after the previous request failed', async () => {
    mockPricing.resolvePrice.mockRejectedValueOnce(
      new Error('Old price failed')
    );
    const {result, rerender} = renderHook(
      ({priceId}) => useResolvedPrice(priceId),
      {
        initialProps: {priceId: price},
        wrapper: ContextWrapper,
      }
    );
    await waitFor(() =>
      expect(result.current).toEqual({
        loading: false,
        error: new Error('Old price failed'),
      })
    );

    const deferred = makeDeferred<stripeJs.ResolvedPrice>();
    mockPricing.resolvePrice.mockReturnValue(deferred.promise);
    rerender({priceId: 'price_456'});
    expect(result.current).toEqual({loading: true});

    await act(() => deferred.reject(new Error('New price failed')));
    expect(result.current).toEqual({
      loading: false,
      error: new Error('New price failed'),
    });
  });

  it('does not request the price again on an unrelated rerender', async () => {
    const {result, rerender} = renderHook(() => useResolvedPrice(price), {
      wrapper: ContextWrapper,
    });
    await waitFor(() =>
      expect(result.current).toEqual({loading: false, data: resolvedPrice})
    );

    pricingState = {type: 'success', pricing: mockPricing, changeVersion: 0};
    rerender();
    await act(async () => {});

    expect(mockPricing.resolvePrice).toHaveBeenCalledTimes(1);
  });

  it('initializes and refreshes the resolved price through PricingProvider in StrictMode', async () => {
    const mockStripe: any = mocks.mockStripe();
    mockStripe.initializePricing.mockResolvedValue(mockPricing);
    const {result} = renderHook(() => useResolvedPrice(price), {
      reactStrictMode: true,
      wrapper: ({children}) => (
        <PricingProvider
          stripe={mockStripe}
          options={{pricingPolicy: 'pricing_policy_123'}}
        >
          {children}
        </PricingProvider>
      ),
    });
    await waitFor(() =>
      expect(result.current).toEqual({loading: false, data: resolvedPrice})
    );

    const refresh = makeDeferred<stripeJs.ResolvedPrice>();
    mockPricing.resolvePrice.mockReturnValueOnce(refresh.promise);
    act(() => mockPricing._emitChange());
    expect(result.current).toEqual({loading: true, data: resolvedPrice});

    await act(() => refresh.resolve(updatedPrice));
    expect(result.current).toEqual({loading: false, data: updatedPrice});
  });

  it('clears retained data on refresh failure and clears the error on retry', async () => {
    const {result, rerender} = renderHook(() => useResolvedPrice(price), {
      wrapper: ContextWrapper,
    });
    await waitFor(() => expect(result.current.data).toBe(resolvedPrice));

    const refresh = makeDeferred<stripeJs.ResolvedPrice>();
    mockPricing.resolvePrice.mockReturnValueOnce(refresh.promise);
    pricingState = {type: 'success', pricing: mockPricing, changeVersion: 1};
    rerender();
    expect(result.current).toEqual({loading: true, data: resolvedPrice});

    await act(() => refresh.reject(new Error('Refresh failed')));
    expect(result.current).toEqual({
      loading: false,
      error: new Error('Refresh failed'),
    });

    const retry = makeDeferred<stripeJs.ResolvedPrice>();
    mockPricing.resolvePrice.mockReturnValueOnce(retry.promise);
    pricingState = {type: 'success', pricing: mockPricing, changeVersion: 2};
    rerender();
    expect(result.current).toEqual({loading: true});

    await act(() => retry.resolve(updatedPrice));
    expect(result.current).toEqual({loading: false, data: updatedPrice});
  });

  it('marks data as loading in the first render after invalidation', async () => {
    const renderResult = jest.fn();
    const {rerender} = renderHook(
      () => {
        const result = useResolvedPrice(price);
        renderResult(result);
        return result;
      },
      {wrapper: ContextWrapper}
    );
    await waitFor(() =>
      expect(renderResult).toHaveBeenLastCalledWith({
        loading: false,
        data: resolvedPrice,
      })
    );

    const refresh = makeDeferred<stripeJs.ResolvedPrice>();
    mockPricing.resolvePrice.mockReturnValueOnce(refresh.promise);
    renderResult.mockClear();
    pricingState = {type: 'success', pricing: mockPricing, changeVersion: 1};
    rerender();
    expect(renderResult).toHaveBeenNthCalledWith(1, {
      loading: true,
      data: resolvedPrice,
    });
    await act(() => refresh.resolve(updatedPrice));
  });

  it('ignores a refresh completing after the consumer unmounts', async () => {
    const renderResult = jest.fn();
    const {rerender, unmount} = renderHook(
      () => {
        const result = useResolvedPrice(price);
        renderResult(result);
        return result;
      },
      {wrapper: ContextWrapper}
    );
    await waitFor(() =>
      expect(renderResult).toHaveBeenLastCalledWith({
        loading: false,
        data: resolvedPrice,
      })
    );

    const refresh = makeDeferred<stripeJs.ResolvedPrice>();
    mockPricing.resolvePrice.mockReturnValueOnce(refresh.promise);
    pricingState = {type: 'success', pricing: mockPricing, changeVersion: 1};
    rerender();
    unmount();
    renderResult.mockClear();
    await act(() => refresh.resolve(updatedPrice));
    expect(renderResult).not.toHaveBeenCalled();
  });

  it('keeps retained data when a stale refresh resolves while the latest refresh is pending', async () => {
    const {result, rerender} = renderHook(() => useResolvedPrice(price), {
      wrapper: ContextWrapper,
    });
    await waitFor(() => expect(result.current.data).toBe(resolvedPrice));

    const staleRefresh = makeDeferred<stripeJs.ResolvedPrice>();
    const latestRefresh = makeDeferred<stripeJs.ResolvedPrice>();
    mockPricing.resolvePrice
      .mockReturnValueOnce(staleRefresh.promise)
      .mockReturnValueOnce(latestRefresh.promise);
    pricingState = {type: 'success', pricing: mockPricing, changeVersion: 1};
    rerender();
    pricingState = {type: 'success', pricing: mockPricing, changeVersion: 2};
    rerender();

    await act(() => staleRefresh.resolve(updatedPrice));
    expect(result.current).toEqual({loading: true, data: resolvedPrice});

    await act(() => latestRefresh.resolve(updatedPrice));
    expect(result.current).toEqual({loading: false, data: updatedPrice});
  });

  it('keeps retained data when a stale refresh rejects while the latest refresh is pending', async () => {
    const {result, rerender} = renderHook(() => useResolvedPrice(price), {
      wrapper: ContextWrapper,
    });
    await waitFor(() => expect(result.current.data).toBe(resolvedPrice));

    const staleRefresh = makeDeferred<stripeJs.ResolvedPrice>();
    const latestRefresh = makeDeferred<stripeJs.ResolvedPrice>();
    mockPricing.resolvePrice
      .mockReturnValueOnce(staleRefresh.promise)
      .mockReturnValueOnce(latestRefresh.promise);
    pricingState = {type: 'success', pricing: mockPricing, changeVersion: 1};
    rerender();
    pricingState = {type: 'success', pricing: mockPricing, changeVersion: 2};
    rerender();

    await act(() => staleRefresh.reject(new Error('Stale refresh failed')));
    expect(result.current).toEqual({loading: true, data: resolvedPrice});

    await act(() => latestRefresh.resolve(updatedPrice));
    expect(result.current).toEqual({loading: false, data: updatedPrice});
  });

  it('clears retained data when the price changes during a refresh', async () => {
    const {result, rerender} = renderHook(
      ({priceId}) => useResolvedPrice(priceId),
      {initialProps: {priceId: price}, wrapper: ContextWrapper}
    );
    await waitFor(() => expect(result.current.data).toBe(resolvedPrice));

    const refresh = makeDeferred<stripeJs.ResolvedPrice>();
    const newPrice = makeDeferred<stripeJs.ResolvedPrice>();
    mockPricing.resolvePrice
      .mockReturnValueOnce(refresh.promise)
      .mockReturnValueOnce(newPrice.promise);
    pricingState = {type: 'success', pricing: mockPricing, changeVersion: 1};
    rerender({priceId: price});
    expect(result.current).toEqual({loading: true, data: resolvedPrice});

    rerender({priceId: 'price_456'});
    expect(result.current).toEqual({loading: true});
    await act(() => refresh.resolve(resolvedPrice));
    expect(result.current).toEqual({loading: true});

    await act(() => newPrice.resolve(updatedPrice));
    expect(result.current).toEqual({loading: false, data: updatedPrice});
  });

  it('clears retained data when the pricing instance changes', async () => {
    const {result, rerender} = renderHook(() => useResolvedPrice(price), {
      wrapper: ContextWrapper,
    });
    await waitFor(() => expect(result.current.data).toBe(resolvedPrice));

    const nextPricing: any = mocks.mockPricing();
    const nextPrice = makeDeferred<stripeJs.ResolvedPrice>();
    nextPricing.resolvePrice.mockReturnValue(nextPrice.promise);
    pricingState = {type: 'success', pricing: nextPricing, changeVersion: 0};
    rerender();
    expect(result.current).toEqual({loading: true});

    await act(() => nextPrice.resolve(updatedPrice));
    expect(result.current).toEqual({loading: false, data: updatedPrice});
  });

  it('ignores a stale price request that resolves after the current price resolves', async () => {
    const staleRequest = makeDeferred<stripeJs.ResolvedPrice>();
    const currentRequest = makeDeferred<stripeJs.ResolvedPrice>();
    mockPricing.resolvePrice
      .mockReturnValueOnce(staleRequest.promise)
      .mockReturnValueOnce(currentRequest.promise);
    const {result, rerender} = renderHook(
      ({priceId}) => useResolvedPrice(priceId),
      {initialProps: {priceId: price}, wrapper: ContextWrapper}
    );

    rerender({priceId: 'price_456'});
    await act(() => currentRequest.resolve(updatedPrice));
    expect(result.current).toEqual({loading: false, data: updatedPrice});

    await act(() => staleRequest.resolve(resolvedPrice));
    expect(result.current).toEqual({loading: false, data: updatedPrice});
  });

  it('ignores a stale price request that rejects after the current price resolves', async () => {
    const staleRequest = makeDeferred<stripeJs.ResolvedPrice>();
    const currentRequest = makeDeferred<stripeJs.ResolvedPrice>();
    mockPricing.resolvePrice
      .mockReturnValueOnce(staleRequest.promise)
      .mockReturnValueOnce(currentRequest.promise);
    const {result, rerender} = renderHook(
      ({priceId}) => useResolvedPrice(priceId),
      {initialProps: {priceId: price}, wrapper: ContextWrapper}
    );

    rerender({priceId: 'price_456'});
    await act(() => currentRequest.resolve(updatedPrice));
    expect(result.current).toEqual({loading: false, data: updatedPrice});

    await act(() =>
      staleRequest.reject(new Error('Stale price request failed'))
    );
    expect(result.current).toEqual({loading: false, data: updatedPrice});
  });

  it('stays loading if a stale price request resolves while the current price is pending', async () => {
    const staleRequest = makeDeferred<stripeJs.ResolvedPrice>();
    const currentRequest = makeDeferred<stripeJs.ResolvedPrice>();
    mockPricing.resolvePrice
      .mockReturnValueOnce(staleRequest.promise)
      .mockReturnValueOnce(currentRequest.promise);
    const {result, rerender} = renderHook(
      ({priceId}) => useResolvedPrice(priceId),
      {initialProps: {priceId: price}, wrapper: ContextWrapper}
    );

    rerender({priceId: 'price_456'});
    await act(() => staleRequest.resolve(resolvedPrice));
    expect(result.current).toEqual({loading: true});

    await act(() => currentRequest.resolve(updatedPrice));
    expect(result.current).toEqual({loading: false, data: updatedPrice});
  });

  it('stays loading if a stale price request rejects while the current price is pending', async () => {
    const staleRequest = makeDeferred<stripeJs.ResolvedPrice>();
    const currentRequest = makeDeferred<stripeJs.ResolvedPrice>();
    mockPricing.resolvePrice
      .mockReturnValueOnce(staleRequest.promise)
      .mockReturnValueOnce(currentRequest.promise);
    const {result, rerender} = renderHook(
      ({priceId}) => useResolvedPrice(priceId),
      {initialProps: {priceId: price}, wrapper: ContextWrapper}
    );

    rerender({priceId: 'price_456'});
    await act(() =>
      staleRequest.reject(new Error('Stale price request failed'))
    );
    expect(result.current).toEqual({loading: true});

    await act(() => currentRequest.resolve(updatedPrice));
    expect(result.current).toEqual({loading: false, data: updatedPrice});
  });

  describe('StrictMode effect replay', () => {
    it('ignores the first effect request and receives the replayed request result', async () => {
      const first = makeDeferred<stripeJs.ResolvedPrice>();
      const second = makeDeferred<stripeJs.ResolvedPrice>();
      mockPricing.resolvePrice
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise);
      const {result} = renderHook(() => useResolvedPrice(price), {
        reactStrictMode: true,
        wrapper: ContextWrapper,
      });

      await waitFor(() =>
        expect(mockPricing.resolvePrice).toHaveBeenCalledTimes(2)
      );
      await act(() => first.resolve(resolvedPrice));
      expect(result.current).toEqual({loading: true});

      await act(() => second.resolve(updatedPrice));
      expect(result.current).toEqual({loading: false, data: updatedPrice});
    });

    it('ignores the first effect rejection and reports the replayed request error', async () => {
      const first = makeDeferred<stripeJs.ResolvedPrice>();
      const second = makeDeferred<stripeJs.ResolvedPrice>();
      mockPricing.resolvePrice
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise);
      const {result} = renderHook(() => useResolvedPrice(price), {
        reactStrictMode: true,
        wrapper: ContextWrapper,
      });

      await act(() => first.reject(new Error('Discarded request failed')));
      expect(result.current).toEqual({loading: true});

      await act(() => second.reject(new Error('Price was not found')));
      expect(result.current).toEqual({
        loading: false,
        error: new Error('Price was not found'),
      });
    });
  });
});
