import React from 'react';
import type {Stripe} from '@stripe/stripe-js';

import {PricingProvider} from './PricingProvider';
import {useResolvedPrice} from './useResolvedPrice';
import {useCurrencySelection} from './useCurrencySelection';
import type {
  CurrencySelection,
  CurrencySelectionResult,
  ResolvedPrice,
  ResolvedPriceResult,
} from './types';

const assertProviderTypes = (
  stripe: Stripe,
  stripePromise: Promise<Stripe | null>
) => {
  <PricingProvider stripe={stripe} options={{pricingPolicy: 'policy'}}>
    <div />
  </PricingProvider>;
  <PricingProvider
    stripe={stripePromise}
    options={{pricingPolicy: 'policy', detectedCurrencyOverride: 'eur'}}
  />;
  <PricingProvider stripe={null} options={{pricingPolicy: 'policy'}} />;
  // @ts-expect-error A pricing policy is required.
  <PricingProvider stripe={null} options={{}} />;
  // @ts-expect-error Stripe must be a Stripe object, promise, or null.
  <PricingProvider stripe="pk_test" options={{pricingPolicy: 'policy'}} />;
};

const useAssertPriceTypes = () => {
  const result: ResolvedPriceResult = useResolvedPrice('price_123');
  // @ts-expect-error A price ID must be a string.
  useResolvedPrice(123);
  if (result.loading) {
    const data: undefined = result.data;
    const error: undefined = result.error;
    return [data, error];
  }
  if (result.error) {
    const error: Error = result.error;
    const data: undefined = result.data;
    return [data, error];
  }
  const data: ResolvedPrice = result.data;
  // @ts-expect-error A loading result cannot carry resolved data.
  const invalid: ResolvedPriceResult = {loading: true, data};
  return [data, invalid];
};

const useAssertCurrencyTypes = () => {
  const result: CurrencySelectionResult = useCurrencySelection();
  const change: Promise<void> = result.setSelectedCurrency('eur');
  // @ts-expect-error A currency must be a string.
  result.setSelectedCurrency(123);
  if (result.loading) {
    const data: undefined = result.data;
    return [change, data];
  }
  if (result.error) {
    const error: Error = result.error;
    return [change, error];
  }
  const data: CurrencySelection = result.data;
  return [change, data];
};

test('pricing contract type assertions compile', () => {
  expect(assertProviderTypes).toBeDefined();
  expect(useAssertPriceTypes).toBeDefined();
  expect(useAssertCurrencyTypes).toBeDefined();
});
