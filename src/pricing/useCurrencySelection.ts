import React from 'react';

import {usePricingContext} from './PricingContext';
import {usePricingRequest} from './usePricingRequest';
import type {
  CurrencySelection,
  CurrencySelectionResult,
  Pricing,
} from './types';

const readCurrencySelection = async (
  pricing: Pricing
): Promise<CurrencySelection> => {
  // These getters can both refresh an expired quote. Run them in order.
  const availableCurrencies = await pricing.getAvailableCurrencies();
  const selectedCurrency = await pricing.getSelectedCurrency();
  return {availableCurrencies, selectedCurrency};
};

export const useCurrencySelection = (): CurrencySelectionResult => {
  const context = usePricingContext('useCurrencySelection');
  const result = usePricingRequest(context, undefined, readCurrencySelection);
  const pricing = context.type === 'success' ? context.pricing : null;
  const initializationError = context.type === 'error' ? context.error : null;

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

  return React.useMemo(
    () => ({...result, setSelectedCurrency}),
    [result, setSelectedCurrency]
  );
};
