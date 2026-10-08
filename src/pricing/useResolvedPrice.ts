import {usePricingContext} from './PricingContext';
import {usePricingRequest} from './usePricingRequest';
import type {Pricing, ResolvedPriceResult} from './types';

const readResolvedPrice = (pricing: Pricing, price: string) =>
  pricing.resolvePrice(price);

export const useResolvedPrice = (price: string): ResolvedPriceResult => {
  const context = usePricingContext('useResolvedPrice');
  return usePricingRequest(context, price, readResolvedPrice);
};
