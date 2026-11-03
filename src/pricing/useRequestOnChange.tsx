import React from 'react';

import * as stripeJs from '@stripe/stripe-js';
import {usePricingContext} from './PricingContext';
import {normalizeError} from './normalizeError';

export type PricingDataResult<T> =
  | {loading: true; data?: T; error?: never}
  | {loading: false; data: T; error?: never}
  | {loading: false; data?: never; error: Error};

type Request<T> = (pricing: stripeJs.Pricing) => Promise<T>;

export const useRequestOnChange = <T,>(
  hookName: string,
  request: Request<T>
): PricingDataResult<T> => {
  const context = usePricingContext(hookName);
  const [state, setState] = React.useState<{
    pricing: stripeJs.Pricing;
    changeVersion: number;
    request: Request<T>;
    result: PricingDataResult<T>;
  } | null>(null);

  const pricing = context.type === 'success' ? context.pricing : null;
  const changeVersion =
    context.type === 'success' ? context.changeVersion : null;

  // Trigger a new request each time the pricing object, change version, or request function changes
  React.useEffect(() => {
    if (!pricing || changeVersion === null) {
      return undefined;
    }

    // Ignore results after cleanup, including during StrictMode effect replay.
    let isActive = true;
    Promise.resolve()
      .then(() => request(pricing))
      .then(
        (data) => {
          if (isActive) {
            setState({
              pricing,
              changeVersion,
              request,
              result: {loading: false, data},
            });
          }
        },
        (error) => {
          if (isActive) {
            setState({
              pricing,
              changeVersion,
              request,
              result: {loading: false, error: normalizeError(error)},
            });
          }
        }
      );

    return () => {
      isActive = false;
    };
  }, [pricing, changeVersion, request]);

  if (context.type === 'error') {
    return {
      loading: false,
      error: context.error,
    };
  }

  if (!state || state.pricing !== pricing || state.request !== request) {
    return {loading: true};
  }

  // Invalidation is visible in the first render, before the request effect
  // runs. Keep data only for the same request and pricing instance.
  if (state.changeVersion !== changeVersion) {
    return state.result.data === undefined
      ? {loading: true}
      : {loading: true, data: state.result.data};
  }

  return state.result;
};
