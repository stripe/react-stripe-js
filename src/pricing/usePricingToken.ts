import React from 'react';

import {usePricingContext} from './PricingContext';
import type {PricingToken, PricingTokenResult} from './types';

export const usePricingToken = (): PricingTokenResult => {
  const context = usePricingContext('usePricingToken');
  const pricing = context.type === 'success' ? context.pricing : null;
  const initializationError = context.type === 'error' ? context.error : null;

  const createPricingToken = React.useCallback((): Promise<PricingToken> => {
    if (initializationError) {
      return Promise.reject(initializationError);
    }

    if (!pricing) {
      return Promise.reject(
        new Error(
          'Pricing is not ready. Wait for PricingProvider to finish initializing before calling createPricingToken().'
        )
      );
    }

    try {
      return Promise.resolve(pricing.createPricingToken());
    } catch (error) {
      return Promise.reject(error);
    }
  }, [pricing, initializationError]);

  return React.useMemo(() => ({createPricingToken}), [createPricingToken]);
};
