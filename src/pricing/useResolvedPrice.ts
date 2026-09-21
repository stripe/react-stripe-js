import React from 'react';

import {normalizeError, usePricingContext} from './PricingContext';
import type {Pricing, ResolvedPrice, ResolvedPriceResult} from './types';

type Request = {
  pricing: Pricing;
  price: string;
  changeVersion: number;
  promise: Promise<ResolvedPrice>;
};

type RequestState =
  | {request: Request; result: {loading: false; data: ResolvedPrice}}
  | {request: Request; result: {loading: false; error: Error}};

const LOADING_RESULT: ResolvedPriceResult = {loading: true};

export const useResolvedPrice = (price: string): ResolvedPriceResult => {
  const context = usePricingContext('useResolvedPrice');
  const requestRef = React.useRef<Request | null>(null);
  const [requestState, setRequestState] = React.useState<RequestState | null>(
    null
  );

  const pricing = context.type === 'success' ? context.pricing : null;
  const changeVersion =
    context.type === 'success' ? context.changeVersion : null;

  React.useEffect(() => {
    if (!pricing || changeVersion === null) {
      return undefined;
    }

    let isActive = true;
    let request = requestRef.current;

    if (
      !request ||
      request.pricing !== pricing ||
      request.price !== price ||
      request.changeVersion !== changeVersion
    ) {
      let promise: Promise<ResolvedPrice>;

      try {
        promise = Promise.resolve(pricing.resolvePrice(price));
      } catch (error) {
        promise = Promise.reject(error);
      }

      request = {pricing, price, changeVersion, promise};
      requestRef.current = request;
    }

    const activeRequest = request as Request;
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
  }, [pricing, price, changeVersion]);

  return React.useMemo(() => {
    if (context.type === 'error') {
      return {loading: false, error: context.error};
    }

    const request = requestRef.current;
    if (
      context.type !== 'success' ||
      !request ||
      request.pricing !== context.pricing ||
      request.price !== price ||
      request.changeVersion !== context.changeVersion ||
      !requestState ||
      requestState.request !== request
    ) {
      return LOADING_RESULT;
    }

    return requestState.result;
  }, [context, price, requestState]);
};
