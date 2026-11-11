import React from 'react';

import * as stripeJs from '@stripe/stripe-js';
import {usePricingContext} from './PricingContext';
import {normalizeError} from './normalizeError';

export type PricingDataResult<T> =
  | {loading: true; data?: T; error?: never}
  | {loading: false; data: T; error?: never}
  | {loading: false; data?: never; error: Error};

type Request<T> = (pricing: stripeJs.Pricing) => Promise<T>;

// There are a couple of hooks that need to automatically refresh data whenever the
// pricing object emits a change event (e.g. useResolvedPrice, useCurrencySelection).
// This hook manages that lifecyle, and ensures loading/error state reflects the
// state of those data requests.
export const useRequestOnChange = <T,>(
  hookName: string,
  request: Request<T>
): PricingDataResult<T> => {
  const {state: context} = usePricingContext(hookName);
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

    let isActive = true;

    Promise.resolve()
      .then(() => request(pricing))
      .then(
        (data) => {
          // Ignore results if the hook has since been unmounted
          if (isActive) {
            const result: PricingDataResult<T> = {loading: false, data};
            setState({pricing, changeVersion, request, result});
          }
        },
        (error) => {
          if (isActive) {
            // Ignore results if the hook has since been unmounted
            const result: PricingDataResult<T> = {
              loading: false,
              error: normalizeError(error),
            };
            setState({pricing, changeVersion, request, result});
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

  // If we still don't have a valid state for the current pricing and request, show loading
  // Also show loading if the request function has changed (e.g. new price id specified in useResolvedPrice)
  if (!state || state.pricing !== pricing || state.request !== request) {
    return {loading: true};
  }

  // On the initial render, we want to show `loading: true` with no data. But
  // once we have some data, we'll keep exposing it, even if stale, while the new
  // data loads in.
  if (state.changeVersion !== changeVersion) {
    return state.result.data === undefined
      ? {loading: true}
      : {loading: true, data: state.result.data};
  }

  return state.result;
};
