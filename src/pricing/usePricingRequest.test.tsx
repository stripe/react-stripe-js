import React, {StrictMode} from 'react';
import {act, renderHook, waitFor} from '@testing-library/react';

import * as mocks from '../../test/mocks';
import makeDeferred from '../../test/makeDeferred';
import {PricingContext, usePricingContext} from './PricingContext';
import {PricingProvider} from './PricingProvider';
import {usePricingRequest} from './usePricingRequest';

describe('Pricing requests', () => {
  let pricing: any;
  let read: jest.Mock;

  beforeEach(() => {
    pricing = mocks.mockPricing();
    read = jest.fn().mockResolvedValue('value');
  });

  const wrapper = ({children}: {children: React.ReactNode}) => (
    <PricingContext.Provider
      value={{type: 'success', pricing, changeVersion: 0}}
    >
      {children}
    </PricingContext.Provider>
  );

  const useRequest = (key = 'one') =>
    usePricingRequest(usePricingContext('test'), key, read);

  it('reuses requests during StrictMode effect replay', async () => {
    const strictWrapper = ({children}: {children: React.ReactNode}) => (
      <StrictMode>{wrapper({children})}</StrictMode>
    );
    const {result} = renderHook(() => useRequest(), {wrapper: strictWrapper});

    await waitFor(() =>
      expect(result.current).toEqual({loading: false, data: 'value'})
    );
    expect(read).toHaveBeenCalledTimes(1);
  });

  it.each(['throw', 'reject'])(
    'normalizes read failures that %s',
    async (kind) => {
      const failure = {message: 'read failed'};
      if (kind === 'throw') {
        read.mockImplementation(() => {
          throw failure;
        });
      } else {
        read.mockRejectedValue(failure);
      }
      const {result} = renderHook(() => useRequest(), {wrapper});

      await waitFor(() =>
        expect(result.current).toEqual({
          loading: false,
          error: new Error('read failed'),
        })
      );
    }
  );

  it.each(['key', 'pricing', 'changeVersion', 'read'])(
    'shows loading immediately and refreshes when %s changes',
    async (input) => {
      let context = {type: 'success' as const, pricing, changeVersion: 0};
      const contextWrapper = ({children}: {children: React.ReactNode}) => (
        <PricingContext.Provider value={context}>
          {children}
        </PricingContext.Provider>
      );
      const {result, rerender} = renderHook(({key}) => useRequest(key), {
        wrapper: contextWrapper,
        initialProps: {key: 'one'},
      });
      await waitFor(() => expect(result.current.loading).toBe(false));
      const original = result.current;
      rerender({key: 'one'});
      expect(result.current).toBe(original);
      const originalRead = read;

      if (input === 'pricing') {
        context = {...context, pricing: mocks.mockPricing()};
      } else if (input === 'changeVersion') {
        context = {...context, changeVersion: 1};
      } else if (input === 'read') {
        read = jest.fn().mockResolvedValue('next');
      }
      rerender({key: input === 'key' ? 'two' : 'one'});
      expect(result.current).toEqual({loading: true});
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(read).toHaveBeenLastCalledWith(
        context.pricing,
        input === 'key' ? 'two' : 'one'
      );
      expect(originalRead).toHaveBeenCalledTimes(input === 'read' ? 1 : 2);
    }
  );

  it.each([
    ['key', 'resolve'],
    ['key', 'reject'],
    ['changeVersion', 'resolve'],
    ['changeVersion', 'reject'],
  ])('ignores stale %s requests that %s', async (input, settle) => {
    const pending = makeDeferred<string>();
    read.mockResolvedValue('latest').mockReturnValueOnce(pending.promise);
    let context = {type: 'success' as const, pricing, changeVersion: 0};
    const contextWrapper = ({children}: {children: React.ReactNode}) => (
      <PricingContext.Provider value={context}>
        {children}
      </PricingContext.Provider>
    );
    const {result, rerender} = renderHook(({key}) => useRequest(key), {
      wrapper: contextWrapper,
      initialProps: {key: 'one'},
    });
    await waitFor(() => expect(read).toHaveBeenCalledTimes(1));

    if (input === 'changeVersion') {
      context = {...context, changeVersion: 1};
    }
    rerender({key: input === 'key' ? 'two' : 'one'});
    await waitFor(() =>
      expect(result.current).toEqual({loading: false, data: 'latest'})
    );
    const latest = result.current;
    await act(() =>
      settle === 'resolve'
        ? pending.resolve('stale')
        : pending.reject(new Error('stale'))
    );
    expect(result.current).toBe(latest);
    expect(read).toHaveBeenCalledTimes(2);
  });

  it.each(['resolve', 'reject'])(
    'ignores requests that %s after unmount',
    async (settle) => {
      const pending = makeDeferred<string>();
      read.mockReturnValue(pending.promise);
      const {result, unmount} = renderHook(() => useRequest(), {wrapper});
      await waitFor(() => expect(read).toHaveBeenCalledTimes(1));
      const previous = result.current;

      unmount();
      await act(() =>
        settle === 'resolve'
          ? pending.resolve('unmounted')
          : pending.reject(new Error('unmounted'))
      );
      expect(result.current).toBe(previous);
    }
  );

  it('surfaces provider errors without attempting a read', async () => {
    const stripe = mocks.mockStripe();
    const failure = new Error('initialize failed');
    stripe.initializePricing.mockRejectedValue(failure);
    const providerWrapper = ({children}: {children: React.ReactNode}) => (
      <PricingProvider
        stripe={stripe as any}
        options={{pricingPolicy: 'policy'}}
      >
        {children}
      </PricingProvider>
    );
    const {result} = renderHook(() => useRequest(), {wrapper: providerWrapper});

    await waitFor(() =>
      expect(result.current).toEqual({loading: false, error: failure})
    );
    expect(read).not.toHaveBeenCalled();
  });
});
