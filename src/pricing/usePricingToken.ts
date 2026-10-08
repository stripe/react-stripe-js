import React from 'react';

import {usePricingContext} from './PricingContext';
import type {PricingToken, PricingTokenResult} from './types';

export const usePricingToken = (): PricingTokenResult => {
  const context = usePricingContext('usePricingToken');
  const pricing = context.type === 'success' ? context.pricing : null;
  const initializationError = context.type === 'error' ? context.error : null;

  const createPricingToken =
    React.useCallback(async (): Promise<PricingToken> => {
      if (initializationError) {
        throw initializationError;
      }

      if (!pricing) {
        throw new Error(
          'Pricing is not ready. Wait for PricingProvider to finish initializing before calling createPricingToken().'
        );
      }

      return pricing.createPricingToken();
    }, [pricing, initializationError]);

  return React.useMemo(() => ({createPricingToken}), [createPricingToken]);
};
