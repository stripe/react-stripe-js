import React from 'react';
import * as stripeJs from '@stripe/stripe-js';

import {usePricingContext} from './PricingContext';
import {normalizeError} from './normalizeError';

export type PricingTokenResult = {
  createPricingToken: () => Promise<stripeJs.PricingToken>;
};

export const usePricingToken = (): PricingTokenResult => {
  const {pricingPromise} = usePricingContext('usePricingToken');

  const createPricingToken = React.useCallback(
    () =>
      pricingPromise
        .then((pricing) => pricing.createPricingToken())
        .catch((error) => {
          throw normalizeError(error);
        }),
    [pricingPromise]
  );

  return {createPricingToken};
};
