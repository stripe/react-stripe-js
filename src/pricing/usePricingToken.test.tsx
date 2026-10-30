import React from 'react';
import {act, renderHook, waitFor} from '@testing-library/react';

import * as mocks from '../../test/mocks';
import {PricingProvider} from './PricingProvider';
import {usePricingToken} from './usePricingToken';

describe('Pricing tokens', () => {
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
    expect(() => renderHook(() => usePricingToken())).toThrow(
      'Could not find Pricing context. You need to wrap the part of your app that calls usePricingToken() in a <PricingProvider>.'
    );
  });

  it('creates tokens only on demand and preserves its result across pricing changes', async () => {
    const {result, rerender} = renderHook(() => usePricingToken(), {wrapper});
    const pending = result.current.createPricingToken;
    await waitFor(() =>
      expect(result.current.createPricingToken).not.toBe(pending)
    );
    const ready = result.current;
    await act(async () => {
      rerender();
      pricing.emitChange();
    });
    expect(result.current).toBe(ready);
    expect(pricing.createPricingToken).not.toHaveBeenCalled();
    expect(pricing.getAvailableCurrencies).not.toHaveBeenCalled();
    expect(pricing.resolvePrice).not.toHaveBeenCalled();
    await expect(result.current.createPricingToken()).resolves.toEqual({
      id: 'prctok_test',
    });
    expect(pricing.createPricingToken).toHaveBeenCalledTimes(1);
  });

  it('preserves synchronous SDK failures', async () => {
    const failure = new Error('token unavailable');
    pricing.createPricingToken.mockImplementation(() => {
      throw failure;
    });
    const {result} = renderHook(() => usePricingToken(), {wrapper});
    const pending = result.current.createPricingToken;
    await waitFor(() =>
      expect(result.current.createPricingToken).not.toBe(pending)
    );
    await expect(result.current.createPricingToken()).rejects.toBe(failure);
  });

  describe('usePricingToken', () => {
    it('rejects before initialization and preserves SDK rejections', async () => {
      const failure = new Error('token failed');
      const {result} = renderHook(() => usePricingToken(), {wrapper});
      const pendingCallback = result.current.createPricingToken;
      await act(async () => {
        await expect(pendingCallback()).rejects.toThrow(/Pricing is not ready/);
      });

      await waitFor(() =>
        expect(result.current.createPricingToken).not.toBe(pendingCallback)
      );
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
