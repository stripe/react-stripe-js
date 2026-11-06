import React from 'react';
import * as stripeJs from '@stripe/stripe-js';

import {usePricingContext} from './PricingContext';
import {PricingDataResult, useRequestOnChange} from './useRequestOnChange';
import {normalizeError} from './normalizeError';

export type CurrencySelectionResult = PricingDataResult<{
  availableCurrencies: stripeJs.CurrencyInfo[];
  selectedCurrency: stripeJs.CurrencyInfo;
}> & {
  setSelectedCurrency: (currency: string) => Promise<void>;
};

const getCurrencySelection = (pricing: stripeJs.Pricing) =>
  pricing.getAvailableCurrencies().then((availableCurrencies) =>
    pricing.getSelectedCurrency().then((selectedCurrency) => ({
      availableCurrencies,
      selectedCurrency,
    }))
  );

export const useCurrencySelection = (): CurrencySelectionResult => {
  const {pricingPromise} = usePricingContext('useCurrencySelection');
  const result = useRequestOnChange(
    'useCurrencySelection',
    getCurrencySelection
  );

  const setSelectedCurrency = React.useCallback(
    (currency: string) =>
      pricingPromise
        .then((pricing) => pricing.setSelectedCurrency(currency))
        .catch((error) => {
          throw normalizeError(error);
        }),
    [pricingPromise]
  );

  return {...result, setSelectedCurrency};
};
