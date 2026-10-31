/**
 * @jest-environment node
 */

import React from 'react';
import {renderToString} from 'react-dom/server';

import * as mocks from '../../test/mocks';
import {
  PricingProvider,
  useResolvedPrice,
  useCurrencySelection,
  usePricingToken,
} from '.';
import {usePricingContext} from './PricingContext';

const Consumer = () => {
  const context = usePricingContext('test');
  const price = useResolvedPrice('price_123');
  const currency = useCurrencySelection();
  const token = usePricingToken();
  expect(typeof currency.setSelectedCurrency).toBe('function');
  expect(typeof token.createPricingToken).toBe('function');
  return (
    <p>
      {context.type === 'loading' && price.loading && currency.loading
        ? 'Loading'
        : 'Ready'}
    </p>
  );
};

describe('Pricing on the server', () => {
  it.each(['null', 'promised null', 'Stripe', 'promised Stripe'])(
    'renders loading without SDK effects with %s',
    (kind) => {
      const stripe = mocks.mockStripe();
      const pricing = mocks.mockPricing();
      stripe.initializePricing.mockResolvedValue(pricing);
      const value = kind.endsWith('Stripe') ? stripe : null;
      const stripeProp = kind.startsWith('promised')
        ? Promise.resolve(value)
        : value;
      const html = renderToString(
        <PricingProvider
          stripe={stripeProp as any}
          options={{pricingPolicy: 'policy_123'}}
        >
          <Consumer />
        </PricingProvider>
      );
      expect(html).toBe('<p>Loading</p>');
      expect(stripe.initializePricing).not.toHaveBeenCalled();
      expect(stripe._registerWrapper).not.toHaveBeenCalled();
      expect(stripe.registerAppInfo).not.toHaveBeenCalled();
      expect(pricing.on).not.toHaveBeenCalled();
      expect(pricing.resolvePrice).not.toHaveBeenCalled();
      expect(pricing.getAvailableCurrencies).not.toHaveBeenCalled();
      expect(pricing.getSelectedCurrency).not.toHaveBeenCalled();
      expect(pricing.setSelectedCurrency).not.toHaveBeenCalled();
      expect(pricing.createPricingToken).not.toHaveBeenCalled();
    }
  );
});
