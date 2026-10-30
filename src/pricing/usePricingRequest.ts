import React from 'react';

import {normalizeError} from './PricingContext';
import type {PricingState} from './PricingContext';
import type {Pricing, PricingDataResult} from './types';

type RequestInputs<Key extends string | undefined> = {
  pricing: Pricing;
  changeVersion: number;
  key: Key;
  read: (pricing: Pricing, key: Key) => Promise<unknown>;
};

type Request<T, Key extends string | undefined> = RequestInputs<Key> & {
  promise: Promise<T>;
};

type RequestState<T, Key extends string | undefined> = {
  request: Request<T, Key>;
  result: PricingDataResult<T>;
};

const LOADING_RESULT = {loading: true} as const;

const hasSameInputs = <Key extends string | undefined>(
  request: RequestInputs<Key>,
  inputs: RequestInputs<Key>
) =>
  request.pricing === inputs.pricing &&
  request.changeVersion === inputs.changeVersion &&
  request.key === inputs.key &&
  request.read === inputs.read;

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
    const inputs = {pricing, changeVersion, key, read};
    if (!request || !hasSameInputs(request, inputs)) {
      const promise = Promise.resolve().then(() => read(pricing, key));
      request = {...inputs, promise};
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
    !hasSameInputs(request, {
      pricing: context.pricing,
      changeVersion: context.changeVersion,
      key,
      read,
    }) ||
    !requestState ||
    requestState.request !== request
  ) {
    return LOADING_RESULT;
  }

  return requestState.result;
};
