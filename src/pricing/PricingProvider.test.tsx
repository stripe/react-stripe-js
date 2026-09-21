import React, {StrictMode} from 'react';
import {act, render, renderHook, waitFor} from '@testing-library/react';

import * as mocks from '../../test/mocks';
import makeDeferred from '../../test/makeDeferred';
import {PricingProvider} from './PricingProvider';
import {useResolvedPrice} from './useResolvedPrice';

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

    const {result} = renderHook(() => useResolvedPrice('price_123'), {wrapper});
    expect(result.current).toEqual({loading: true});

    await waitFor(() =>
      expect(result.current).toEqual({loading: false, error: failure})
    );
  });

  it('normalizes rejected Stripe promises and initialization failures', async () => {
    const stripeFailureWrapper = ({children}: any) => (
      <PricingProvider
        stripe={Promise.reject('stripe failed')}
        options={defaultOptions}
      >
        {children}
      </PricingProvider>
    );
    const stripeResult = renderHook(() => useResolvedPrice('price_123'), {
      wrapper: stripeFailureWrapper,
    });
    await waitFor(() =>
      expect(stripeResult.result.current).toEqual({
        loading: false,
        error: new Error('stripe failed'),
      })
    );

    const initializationFailure = new Error('initialize failed');
    stripe.initializePricing.mockRejectedValue(initializationFailure);
    const initializationResult = renderHook(
      () => useResolvedPrice('price_123'),
      {wrapper}
    );
    await waitFor(() =>
      expect(initializationResult.result.current).toEqual({
        loading: false,
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
});
