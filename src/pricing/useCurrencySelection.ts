import React from 'react';

import {normalizeError, usePricingContext} from './PricingContext';
import type {
  CurrencySelection,
  CurrencySelectionResult,
  Pricing,
  PricingDataResult,
} from './types';

type Request = {
  pricing: Pricing;
  changeVersion: number;
  promise: Promise<CurrencySelection>;
};

type RequestState = {
  request: Request;
  result: PricingDataResult<CurrencySelection>;
};

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

    let request = requestRef.current;
    if (
      !request ||
      request.pricing !== pricing ||
      request.changeVersion !== changeVersion
    ) {
      // These getters can both refresh an expired quote. Run them in order.
      const promise = (async (): Promise<CurrencySelection> => {
        const availableCurrencies = await pricing.getAvailableCurrencies();
        const selectedCurrency = await pricing.getSelectedCurrency();
        return {availableCurrencies, selectedCurrency};
      })();
      request = {pricing, changeVersion, promise};
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
  }, [pricing, changeVersion]);

  const setSelectedCurrency = React.useCallback(
    async (currency: string): Promise<void> => {
      if (initializationError) {
        throw initializationError;
      }
      if (!pricing) {
        throw new Error(
          'Pricing is not ready. Wait for PricingProvider to finish initializing before calling setSelectedCurrency().'
        );
      }

      await pricing.setSelectedCurrency(currency);
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
