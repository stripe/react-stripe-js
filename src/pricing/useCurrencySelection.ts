import React from 'react';

import {normalizeError, usePricingContext} from './PricingContext';
import type {
  CurrencySelection,
  CurrencySelectionResult,
  Pricing,
} from './types';

type Request = {
  pricing: Pricing;
  changeVersion: number;
  promise: Promise<CurrencySelection>;
};

type RequestState =
  | {request: Request; result: {loading: false; data: CurrencySelection}}
  | {request: Request; result: {loading: false; error: Error}};

export const useCurrencySelection = (): CurrencySelectionResult => {
  const context = usePricingContext('useCurrencySelection');
  const requestRef = React.useRef<Request | null>(null);
  const [requestState, setRequestState] = React.useState<RequestState | null>(
    null
  );

  const pricing = context.type === 'success' ? context.pricing : null;
  const initializationError = context.type === 'error' ? context.error : null;
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
      request.changeVersion !== changeVersion
    ) {
      let promise: Promise<CurrencySelection>;

      try {
        promise = Promise.all([
          pricing.getAvailableCurrencies(),
          pricing.getSelectedCurrency(),
        ]).then(([availableCurrencies, selectedCurrency]) => ({
          availableCurrencies,
          selectedCurrency,
        }));
      } catch (error) {
        promise = Promise.reject(error);
      }

      request = {pricing, changeVersion, promise};
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
  }, [pricing, changeVersion]);

  const setSelectedCurrency = React.useCallback(
    (currency: string): Promise<void> => {
      if (initializationError) {
        return Promise.reject(initializationError);
      }

      if (!pricing) {
        return Promise.reject(
          new Error(
            'Pricing is not ready. Wait for PricingProvider to finish initializing before calling setSelectedCurrency().'
          )
        );
      }

      try {
        return Promise.resolve(pricing.setSelectedCurrency(currency));
      } catch (error) {
        return Promise.reject(error);
      }
    },
    [pricing, initializationError]
  );

  return React.useMemo(() => {
    if (context.type === 'error') {
      return {
        loading: false,
        error: context.error,
        setSelectedCurrency,
      };
    }

    const request = requestRef.current;
    if (
      context.type !== 'success' ||
      !request ||
      request.pricing !== context.pricing ||
      request.changeVersion !== context.changeVersion ||
      !requestState ||
      requestState.request !== request
    ) {
      return {loading: true, setSelectedCurrency};
    }

    return {...requestState.result, setSelectedCurrency};
  }, [context, requestState, setSelectedCurrency]);
};
