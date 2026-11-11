/**
 * @jest-environment node
 */

import React from 'react';
import {renderToString} from 'react-dom/server';

import * as mocks from '../../test/mocks';
import {PricingProvider} from './PricingProvider';
import {usePricingContext} from './PricingContext';

describe('PricingProvider on the server', () => {
  it('remains loading and does not initialize pricing', () => {
    const mockStripe: any = mocks.mockStripe();
    const TestComponent = () => {
      const state = usePricingContext('usePricing').state;
      expect(state).toEqual({type: 'loading'});
      return <div>{state.type}</div>;
    };

    const result = renderToString(
      <PricingProvider
        stripe={mockStripe}
        options={{pricingPolicy: 'pricing_policy_123'}}
      >
        <TestComponent />
      </PricingProvider>
    );

    expect(result).toBe('<div>loading</div>');
    expect(mockStripe.initializePricing).not.toHaveBeenCalled();
  });
});
