import React, {StrictMode} from 'react';
import {act, render, waitFor} from '@testing-library/react';
import {renderHook} from '@testing-library/react-hooks';

import * as mocks from '../../test/mocks';
import makeDeferred from '../../test/makeDeferred';
import {PricingProvider} from './PricingProvider';
import {useResolvedPrice} from './useResolvedPrice';

describe('PricingProvider', () => {
  let stripe: any;
  let pricing: any;
  let consoleWarn: jest.SpyInstance;

  beforeEach(() => {
    pricing = mocks.mockPricing();
    stripe = mocks.mockStripe();
    stripe.__initializePricing.mockResolvedValue(pricing);
    consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarn.mockRestore();
  });

  const wrapper = ({children, stripeProp = stripe, options}: any) => (
    <PricingProvider stripe={stripeProp} options={options}>
      {children}
    </PricingProvider>
  );

  it('initializes a synchronous Stripe exactly once and cleans up its listener', async () => {
    const options = {detectedCurrencyOverride: 'eur'};
    const rendered = render(
      <StrictMode>
        <PricingProvider stripe={stripe} options={options}>
          <div />
        </PricingProvider>
      </StrictMode>
    );

    await waitFor(() => expect(pricing.on).toHaveBeenCalledTimes(1));
    expect(stripe.__initializePricing).toHaveBeenCalledTimes(1);
    expect(stripe.__initializePricing).toHaveBeenCalledWith(options);
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
      <PricingProvider stripe={stripeDeferred.promise}>
        <div />
      </PricingProvider>
    );

    expect(stripe.__initializePricing).not.toHaveBeenCalled();
    await act(() => stripeDeferred.resolve(null));
    expect(stripe.__initializePricing).not.toHaveBeenCalled();

    rerender(
      <PricingProvider stripe={Promise.resolve(stripe)}>
        <div />
      </PricingProvider>
    );
    await waitFor(() =>
      expect(stripe.__initializePricing).toHaveBeenCalledTimes(1)
    );
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it('allows options to change while waiting for null to become Stripe', async () => {
    const {rerender} = render(
      <PricingProvider
        stripe={null}
        options={{detectedCurrencyOverride: 'usd'}}
      >
        <div />
      </PricingProvider>
    );

    rerender(
      <PricingProvider
        stripe={stripe}
        options={{detectedCurrencyOverride: 'eur'}}
      >
        <div />
      </PricingProvider>
    );

    await waitFor(() => expect(pricing.on).toHaveBeenCalled());
    expect(stripe.__initializePricing).toHaveBeenCalledWith({
      detectedCurrencyOverride: 'eur',
    });
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it('warns only when immutable effective values change', async () => {
    const {rerender} = render(
      <PricingProvider
        stripe={stripe}
        options={{detectedCurrencyOverride: 'usd'}}
      >
        <div />
      </PricingProvider>
    );
    await waitFor(() => expect(pricing.on).toHaveBeenCalled());

    rerender(
      <PricingProvider
        stripe={stripe}
        options={{detectedCurrencyOverride: 'usd'}}
      >
        <div />
      </PricingProvider>
    );
    expect(consoleWarn).not.toHaveBeenCalled();

    const nextStripe = mocks.mockStripe();
    rerender(
      <PricingProvider
        stripe={nextStripe as any}
        options={{detectedCurrencyOverride: 'eur'}}
      >
        <div />
      </PricingProvider>
    );
    expect(consoleWarn).toHaveBeenCalledTimes(2);
    expect(nextStripe.__initializePricing).not.toHaveBeenCalled();
  });

  it('surfaces synchronous initialization throws as Error values', async () => {
    const failure = new Error('pricing initialization failed');
    stripe.__initializePricing.mockImplementation(() => {
      throw failure;
    });

    const {result, waitForNextUpdate} = renderHook(
      () => useResolvedPrice('price_123'),
      {wrapper}
    );
    expect(result.current).toEqual({loading: true});

    await waitForNextUpdate();
    expect(result.current).toEqual({loading: false, error: failure});
  });

  it('normalizes rejected Stripe promises and initialization failures', async () => {
    const stripeFailureWrapper = ({children}: any) => (
      <PricingProvider stripe={Promise.reject('stripe failed')}>
        {children}
      </PricingProvider>
    );
    const stripeResult = renderHook(() => useResolvedPrice('price_123'), {
      wrapper: stripeFailureWrapper,
    });
    await stripeResult.waitForNextUpdate();
    expect(stripeResult.result.current).toEqual({
      loading: false,
      error: new Error('stripe failed'),
    });

    const initializationFailure = new Error('initialize failed');
    stripe.__initializePricing.mockRejectedValue(initializationFailure);
    const initializationResult = renderHook(
      () => useResolvedPrice('price_123'),
      {wrapper}
    );
    await initializationResult.waitForNextUpdate();
    expect(initializationResult.result.current).toEqual({
      loading: false,
      error: initializationFailure,
    });
  });

  it('does not subscribe or update after unmount', async () => {
    const initialization = makeDeferred<any>();
    stripe.__initializePricing.mockReturnValue(initialization.promise);
    const rendered = render(
      <PricingProvider stripe={stripe}>
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
          <PricingProvider stripe={{invalid: true} as any}>
            <div />
          </PricingProvider>
        )
      ).toThrow(/Invalid prop `stripe` supplied to `PricingProvider`/);
    } finally {
      consoleError.mockRestore();
    }
  });
});
