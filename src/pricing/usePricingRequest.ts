import React from 'react';

import {normalizeError} from './PricingContext';
import type {PricingState} from './PricingContext';
import type {Pricing, PricingDataResult} from './types';

type Request<T, Key extends string | undefined> = {
  pricing: Pricing;
  changeVersion: number;
  key: Key;
  promise: Promise<T>;
};

type RequestState<T, Key extends string | undefined> = {
  request: Request<T, Key>;
  result: PricingDataResult<T>;
};

const LOADING_RESULT = {loading: true} as const;

export const usePricingRequest = <T, Key extends string | undefined>(
  context: PricingState,
  key: Key,
  read: (pricing: Pricing, key: Key) => Promise<T>
): PricingDataResult<T> => {
  const requestRef = React.useRef<Request<T, Key> | null>(null);
  const [requestState, setRequestState] = React.useState<RequestState<
    T,
    Key
  > | null>(null);

  const pricing = context.type === 'success' ? context.pricing : null;
  const changeVersion =
    context.type === 'success' ? context.changeVersion : null;

  React.useEffect(() => {
    if (!pricing || changeVersion === null) {
      return undefined;
    }

    // Reuse this request when StrictMode replays the effect for the same inputs.
    let request = requestRef.current;
    if (
      !request ||
      request.pricing !== pricing ||
      request.changeVersion !== changeVersion ||
      request.key !== key
    ) {
      const promise = (async () => read(pricing, key))();
      request = {pricing, changeVersion, key, promise};
      requestRef.current = request;
    }

    let isActive = true;
    const activeRequest = request;
    activeRequest.promise.then(
      (data) => {
        if (isActive && requestRef.current === activeRequest) {
          setRequestState({
            request: activeRequest,
            result: {loading: false, data},
          });
        }
      },
      (error) => {
        if (isActive && requestRef.current === activeRequest) {
          setRequestState({
            request: activeRequest,
            result: {loading: false, error: normalizeError(error)},
          });
        }
      }
    );

    return () => {
      isActive = false;
    };
  }, [pricing, changeVersion, key, read]);

  if (context.type === 'error') {
    return {loading: false, error: context.error};
  }

  // Show loading as soon as inputs change, before the next effect starts.
  const request = requestRef.current;
  if (
    context.type !== 'success' ||
    !request ||
    request.pricing !== context.pricing ||
    request.changeVersion !== context.changeVersion ||
    request.key !== key ||
    !requestState ||
    requestState.request !== request
  ) {
    return LOADING_RESULT;
  }

  return requestState.result;
};
