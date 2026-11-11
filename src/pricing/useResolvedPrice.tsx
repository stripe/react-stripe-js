import React from 'react';

import * as stripeJs from '@stripe/stripe-js';
import {PricingDataResult, useRequestOnChange} from './useRequestOnChange';

export type ResolvedPriceResult = PricingDataResult<stripeJs.ResolvedPrice>;

export const useResolvedPrice = (price: string): ResolvedPriceResult => {
  const getResolvedPrice = React.useCallback(
    (pricing: stripeJs.Pricing) => pricing.resolvePrice(price),
    [price]
  );

  const result = useRequestOnChange('useResolvedPrice', getResolvedPrice);

  return result;
};
