import React from 'react';
import {act, renderHook, waitFor} from '@testing-library/react';

import * as mocks from '../../test/mocks';
import {PricingProvider} from './PricingProvider';
import {useResolvedPrice} from './useResolvedPrice';

describe('useResolvedPrice', () => {
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
    expect(() => renderHook(() => useResolvedPrice('price_123'))).toThrow(
      'Could not find Pricing context. You need to wrap the part of your app that calls useResolvedPrice() in a <PricingProvider>.'
    );
  });

  it('loads a price and retains its result reference on parent rerenders', async () => {
    const resolvedPrice = {
      currency: 'eur',
      unitAmount: {amount: '9.00', minorUnitsAmount: 900},
      unitAmountDecimal: {amount: '9.00', minorUnitsAmount: 900},
      minorUnitsAmountDivisor: 100,
    };
    pricing.resolvePrice.mockResolvedValue(resolvedPrice);

    const {result, rerender} = renderHook(() => useResolvedPrice('price_123'), {
      wrapper,
    });
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
});
