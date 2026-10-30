import React, {StrictMode} from 'react';
import {act, render, renderHook, waitFor} from '@testing-library/react';

import * as mocks from '../../test/mocks';
import makeDeferred from '../../test/makeDeferred';
import {Activity} from '../../test/Activity';
import {PricingProvider} from './PricingProvider';
import {usePricingContext} from './PricingContext';
import {useResolvedPrice} from './useResolvedPrice';
import type {PricingState} from './PricingContext';

describe('PricingProvider', () => {
  const defaultOptions = {pricingPolicy: 'pricing_policy_123'};
  let stripe: any;
  let pricing: any;
  let consoleWarn: jest.SpyInstance;

  beforeEach(() => {
    pricing = mocks.mockPricing();
    stripe = mocks.mockStripe();
    stripe.initializePricing.mockResolvedValue(pricing);
    consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarn.mockRestore();
  });

  const wrapper = ({
    children,
    stripeProp = stripe,
    options = defaultOptions,
  }: any) => (
    <PricingProvider stripe={stripeProp} options={options}>
      {children}
    </PricingProvider>
  );

  it('initializes a synchronous Stripe exactly once and cleans up its listener', async () => {
    const options = {...defaultOptions, detectedCurrencyOverride: 'eur'};
    const rendered = render(
      <StrictMode>
        <PricingProvider stripe={stripe} options={options}>
          <div />
        </PricingProvider>
      </StrictMode>
    );

    await waitFor(() => expect(pricing.on).toHaveBeenCalledTimes(1));
    expect(stripe.initializePricing).toHaveBeenCalledTimes(1);
    expect(stripe.initializePricing).toHaveBeenCalledWith(options);
    expect(stripe._registerWrapper).toHaveBeenCalledTimes(1);
    expect(stripe.registerAppInfo).toHaveBeenCalledTimes(1);

    rendered.unmount();
    expect(pricing.off).toHaveBeenCalledTimes(1);
    expect(pricing.off).toHaveBeenCalledWith(
      'change',
      pricing.on.mock.calls[0][1]
    );
  });

  it('supports promised Stripe and promised null values', async () => {
    const stripeDeferred = makeDeferred<any>();
    const {rerender} = render(
      <PricingProvider stripe={stripeDeferred.promise} options={defaultOptions}>
        <div />
      </PricingProvider>
    );

    expect(stripe.initializePricing).not.toHaveBeenCalled();
    await act(() => stripeDeferred.resolve(null));
    expect(stripe.initializePricing).not.toHaveBeenCalled();

    rerender(
      <PricingProvider
        stripe={Promise.resolve(stripe)}
        options={defaultOptions}
      >
        <div />
      </PricingProvider>
    );
    await waitFor(() =>
      expect(stripe.initializePricing).toHaveBeenCalledTimes(1)
    );
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it('allows options to change while waiting for null to become Stripe', async () => {
    const {rerender} = render(
      <PricingProvider
        stripe={null}
        options={{...defaultOptions, detectedCurrencyOverride: 'usd'}}
      >
        <div />
      </PricingProvider>
    );

    rerender(
      <PricingProvider
        stripe={stripe}
        options={{...defaultOptions, detectedCurrencyOverride: 'eur'}}
      >
        <div />
      </PricingProvider>
    );

    await waitFor(() => expect(pricing.on).toHaveBeenCalled());
    expect(stripe.initializePricing).toHaveBeenCalledWith({
      pricingPolicy: 'pricing_policy_123',
      detectedCurrencyOverride: 'eur',
    });
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it('uses the latest committed options while waiting for a Stripe promise', async () => {
    const stripeDeferred = makeDeferred<any>();
    const {rerender} = render(
      <PricingProvider
        stripe={stripeDeferred.promise}
        options={{...defaultOptions, detectedCurrencyOverride: 'usd'}}
      >
        <div />
      </PricingProvider>
    );

    rerender(
      <PricingProvider
        stripe={stripeDeferred.promise}
        options={{...defaultOptions, detectedCurrencyOverride: 'eur'}}
      >
        <div />
      </PricingProvider>
    );
    await act(() => stripeDeferred.resolve(stripe));

    expect(stripe.initializePricing).toHaveBeenCalledTimes(1);
    expect(stripe.initializePricing).toHaveBeenCalledWith({
      pricingPolicy: 'pricing_policy_123',
      detectedCurrencyOverride: 'eur',
    });
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it('warns only when immutable effective values change', async () => {
    const {rerender} = render(
      <PricingProvider
        stripe={stripe}
        options={{...defaultOptions, detectedCurrencyOverride: 'usd'}}
      >
        <div />
      </PricingProvider>
    );
    await waitFor(() => expect(pricing.on).toHaveBeenCalled());

    rerender(
      <PricingProvider
        stripe={stripe}
        options={{...defaultOptions, detectedCurrencyOverride: 'usd'}}
      >
        <div />
      </PricingProvider>
    );
    expect(consoleWarn).not.toHaveBeenCalled();

    const nextStripe = mocks.mockStripe();
    rerender(
      <PricingProvider
        stripe={nextStripe as any}
        options={{...defaultOptions, detectedCurrencyOverride: 'eur'}}
      >
        <div />
      </PricingProvider>
    );
    expect(consoleWarn).toHaveBeenCalledTimes(2);
    expect(nextStripe.initializePricing).not.toHaveBeenCalled();
    expect(pricing.on).toHaveBeenCalledTimes(1);
    expect(pricing.off).not.toHaveBeenCalled();
    expect(pricing.changeListeners.size).toBe(1);
  });

  it('warns if the pricing policy changes after initialization', async () => {
    const {rerender} = render(
      <PricingProvider stripe={stripe} options={defaultOptions}>
        <div />
      </PricingProvider>
    );
    await waitFor(() => expect(pricing.on).toHaveBeenCalled());

    rerender(
      <PricingProvider
        stripe={stripe}
        options={{pricingPolicy: 'pricing_policy_456'}}
      >
        <div />
      </PricingProvider>
    );

    expect(consoleWarn).toHaveBeenCalledWith(
      'Unsupported prop change on PricingProvider: You cannot change `options.pricingPolicy` after initialization has started.'
    );
    expect(stripe.initializePricing).toHaveBeenCalledTimes(1);
  });

  it('surfaces synchronous initialization throws as Error values', async () => {
    const failure = new Error('pricing initialization failed');
    stripe.initializePricing.mockImplementation(() => {
      throw failure;
    });

    const {result} = renderHook(() => usePricingContext('test'), {wrapper});
    expect(result.current).toEqual({type: 'loading'});

    await waitFor(() =>
      expect(result.current).toEqual({type: 'error', error: failure})
    );
  });

  it('reports missing Pricing beta support through context', async () => {
    stripe.initializePricing = undefined;
    const {result} = renderHook(() => usePricingContext('test'), {wrapper});

    await waitFor(() =>
      expect(result.current).toEqual({
        type: 'error',
        error: new Error(
          'PricingProvider requires a Stripe.js instance that supports initializePricing(). Pricing requires beta access.'
        ),
      })
    );
    expect(stripe._registerWrapper).not.toHaveBeenCalled();
    expect(pricing.on).not.toHaveBeenCalled();
  });

  it.each(['settled', 'pending'] as const)(
    'refreshes after effect reconnection with a %s previous request',
    async (previousRequest) => {
      const price = (currency: string) => ({
        currency,
        unitAmount: null,
        unitAmountDecimal: null,
        minorUnitsAmountDivisor: 100,
      });
      const pending = makeDeferred<ReturnType<typeof price>>();
      pricing.resolvePrice.mockResolvedValue(price('usd'));
      if (previousRequest === 'pending') {
        pricing.resolvePrice.mockReturnValueOnce(pending.promise);
      }
      let context: PricingState = {type: 'loading'};
      const getChangeVersion = () =>
        context.type === 'success' ? context.changeVersion : -1;
      let result: ReturnType<typeof useResolvedPrice> = {loading: true};
      const Consumer = () => {
        context = usePricingContext('test');
        result = useResolvedPrice('price_123');
        return <p>{result.data?.currency || 'Loading'}</p>;
      };
      const tree = (mode: 'visible' | 'hidden') => (
        <StrictMode>
          <Activity mode={mode}>
            <PricingProvider stripe={stripe} options={defaultOptions}>
              <Consumer />
            </PricingProvider>
          </Activity>
        </StrictMode>
      );
      const {rerender, unmount} = render(tree('visible'));
      await waitFor(() =>
        expect(pricing.resolvePrice).toHaveBeenCalledTimes(1)
      );
      if (previousRequest === 'settled') {
        await waitFor(() => expect(result.data?.currency).toBe('usd'));
      }
      const initialVersion = getChangeVersion();

      rerender(tree('hidden'));
      expect(pricing.changeListeners.size).toBe(0);
      pricing.resolvePrice.mockResolvedValue(price('eur'));
      act(() => pricing.emitChange());
      rerender(tree('visible'));
      await waitFor(() => expect(result.data?.currency).toBe('eur'));
      expect(getChangeVersion()).toBeGreaterThan(initialVersion);
      const reconnectedVersion = getChangeVersion();
      expect(pricing.resolvePrice).toHaveBeenCalledTimes(2);
      if (previousRequest === 'pending') {
        await act(() => pending.resolve(price('usd')));
        expect(result).toEqual({loading: false, data: price('eur')});
      }

      if (previousRequest === 'settled') {
        rerender(tree('hidden'));
        pricing.resolvePrice.mockResolvedValue(price('usd'));
        act(() => pricing.emitChange());
        rerender(tree('visible'));
        await waitFor(() => expect(result.data?.currency).toBe('usd'));
        expect(getChangeVersion()).toBeGreaterThan(reconnectedVersion);
        expect(pricing.resolvePrice).toHaveBeenCalledTimes(3);
      }
      expect(stripe.initializePricing).toHaveBeenCalledTimes(1);
      expect(pricing.changeListeners.size).toBe(1);
      unmount();
      expect(pricing.changeListeners.size).toBe(0);
    }
  );

  it('normalizes rejected Stripe promises and initialization failures', async () => {
    const stripeFailureWrapper = ({children}: any) => (
      <PricingProvider
        stripe={Promise.reject('stripe failed')}
        options={defaultOptions}
      >
        {children}
      </PricingProvider>
    );
    const stripeResult = renderHook(() => usePricingContext('test'), {
      wrapper: stripeFailureWrapper,
    });
    await waitFor(() =>
      expect(stripeResult.result.current).toEqual({
        type: 'error',
        error: new Error('stripe failed'),
      })
    );

    const initializationFailure = new Error('initialize failed');
    stripe.initializePricing.mockRejectedValue(initializationFailure);
    const initializationResult = renderHook(() => usePricingContext('test'), {
      wrapper,
    });
    await waitFor(() =>
      expect(initializationResult.result.current).toEqual({
        type: 'error',
        error: initializationFailure,
      })
    );
  });

  it('does not subscribe or update after unmount', async () => {
    const initialization = makeDeferred<any>();
    stripe.initializePricing.mockReturnValue(initialization.promise);
    const rendered = render(
      <PricingProvider stripe={stripe} options={defaultOptions}>
        <div />
      </PricingProvider>
    );

    rendered.unmount();
    await act(() => initialization.resolve(pricing));

    expect(pricing.on).not.toHaveBeenCalled();
    expect(pricing.off).not.toHaveBeenCalled();
  });

  it('rejects invalid Stripe props during render', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      expect(() =>
        render(
          <PricingProvider
            stripe={{invalid: true} as any}
            options={defaultOptions}
          >
            <div />
          </PricingProvider>
        )
      ).toThrow(/Invalid prop `stripe` supplied to `PricingProvider`/);
    } finally {
      consoleError.mockRestore();
    }
  });

  it('initializes a promised Stripe once under StrictMode', async () => {
    const pending = makeDeferred<any>();
    const {unmount} = render(
      <StrictMode>
        <PricingProvider stripe={pending.promise} options={defaultOptions}>
          <div />
        </PricingProvider>
      </StrictMode>
    );
    await act(() => pending.resolve(stripe));
    await waitFor(() => expect(pricing.on).toHaveBeenCalledTimes(1));
    expect(stripe.initializePricing).toHaveBeenCalledTimes(1);
    unmount();
    expect(pricing.off).toHaveBeenCalledTimes(1);
    expect(pricing.changeListeners.size).toBe(0);
  });

  it.each(['Stripe', 'initialization'])(
    'handles a rejected %s promise after unmount',
    async (kind) => {
      const pending = makeDeferred<any>();
      if (kind === 'initialization') {
        stripe.initializePricing.mockReturnValue(pending.promise);
      }
      const rendered = render(
        <PricingProvider
          stripe={kind === 'Stripe' ? pending.promise : stripe}
          options={defaultOptions}
        >
          <div />
        </PricingProvider>
      );
      rendered.unmount();
      await act(() => pending.reject(new Error('unmounted')));
      expect(pricing.on).not.toHaveBeenCalled();
      expect(pricing.off).not.toHaveBeenCalled();
    }
  );

  it('surfaces initialization rejection under StrictMode', async () => {
    const pending = makeDeferred<any>();
    const failure = new Error('initialize failed');
    stripe.initializePricing.mockReturnValue(pending.promise);
    const strictWrapper = ({children}: {children: React.ReactNode}) => (
      <StrictMode>
        <PricingProvider stripe={stripe} options={defaultOptions}>
          {children}
        </PricingProvider>
      </StrictMode>
    );
    const {result} = renderHook(() => usePricingContext('test'), {
      wrapper: strictWrapper,
    });
    await act(() => pending.reject(failure));
    expect(result.current).toEqual({type: 'error', error: failure});
    expect(stripe.initializePricing).toHaveBeenCalledTimes(1);
  });

  it('cleans up a partially registered listener when subscription throws', async () => {
    const failure = new Error('subscription failed');
    const subscribe = pricing.on.getMockImplementation();
    pricing.on.mockImplementation((event: string, listener: any) => {
      subscribe(event, listener);
      throw failure;
    });
    const {result} = renderHook(() => usePricingContext('test'), {wrapper});
    await waitFor(() =>
      expect(result.current).toEqual({type: 'error', error: failure})
    );
    expect(pricing.off).toHaveBeenCalledWith(
      'change',
      pricing.on.mock.calls[0][1]
    );
    expect(pricing.changeListeners.size).toBe(0);
    act(() => pricing.on.mock.calls[0][1]({}));
    expect(result.current).toEqual({type: 'error', error: failure});
  });

  it('ignores late change events and cleanup errors after unmount', async () => {
    const {result, unmount} = renderHook(() => usePricingContext('test'), {
      wrapper,
    });
    await waitFor(() => expect(result.current.type).toBe('success'));
    const previous = result.current;
    const unsubscribe = pricing.off.getMockImplementation();
    pricing.off.mockImplementation((event: string, listener: any) => {
      unsubscribe(event, listener);
      throw new Error('cleanup failed');
    });
    expect(unmount).not.toThrow();
    act(() => pricing.on.mock.calls[0][1]({}));
    expect(result.current).toBe(previous);
    expect(pricing.changeListeners.size).toBe(0);
  });
});
