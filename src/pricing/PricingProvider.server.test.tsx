/**
 * @jest-environment node
 */

import React from 'react';
import {renderToString} from 'react-dom/server';

import * as mocks from '../../test/mocks';
import {PricingProvider} from './PricingProvider';
import {usePricingContext} from './PricingContext';
import {useResolvedPrice} from './useResolvedPrice';

const Consumer = () => {
  const context = usePricingContext('test');
  const price = useResolvedPrice('price_123');
  return (
    <p>{context.type === 'loading' && price.loading ? 'Loading' : 'Ready'}</p>
  );
};

describe('Pricing on the server', () => {
  it.each(['null', 'promised null', 'Stripe', 'promised Stripe'])(
    'renders loading without SDK effects with %s',
    (kind) => {
      const stripe = mocks.mockStripe();
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
    }
  );
});
