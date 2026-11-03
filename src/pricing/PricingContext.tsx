import React from 'react';

import * as stripeJs from '@stripe/stripe-js';

export type PricingState =
  | {type: 'loading'}
  | {type: 'success'; pricing: stripeJs.Pricing; changeVersion: number}
  | {type: 'error'; error: Error};

export const PricingContext = React.createContext<PricingState | null>(null);
PricingContext.displayName = 'PricingContext';

export const usePricingContext = (hookName: string): PricingState => {
  const context = React.useContext(PricingContext);

  if (!context) {
    throw new Error(
      `Could not find Pricing context. You need to wrap the part of your app that calls ${hookName}() in a <PricingProvider>.`
    );
  }

  return context;
};
