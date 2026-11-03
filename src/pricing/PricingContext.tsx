import React from 'react';

import * as stripeJs from '@stripe/stripe-js';

export type PricingState =
  | {type: 'loading'}
  | {type: 'success'; pricing: stripeJs.Pricing; changeVersion: number}
  | {type: 'error'; error: Error};

export type PricingContextValue = {
  state: PricingState;
  pricingPromise: Promise<stripeJs.Pricing>;
};

export const PricingContext = React.createContext<PricingContextValue | null>(
  null
);
PricingContext.displayName = 'PricingContext';

export const usePricingContext = (hookName: string): PricingContextValue => {
  const context = React.useContext(PricingContext);

  if (!context) {
    throw new Error(
      `Could not find Pricing context. You need to wrap the part of your app that calls ${hookName}() in a <PricingProvider>.`
    );
  }

  return context;
};
