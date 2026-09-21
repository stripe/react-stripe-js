import type {Stripe} from '@stripe/stripe-js';

export interface PricingProviderOptions {
  detectedCurrencyOverride?: string;
}

export interface PricingProviderProps {
  stripe: PromiseLike<Stripe | null> | Stripe | null;
  options?: PricingProviderOptions;
}

export interface Currency {
  currency: string;
}

export interface ResolvedPrice {
  currency: string;
  unitAmount: null | {amount: string; minorUnitsAmount: number};
  unitAmountDecimal: null | {amount: string; minorUnitsAmount: number};
  minorUnitsAmountDivisor: number;
}

export interface PricingToken {
  id: string;
}

export type PricingDataResult<T> =
  | {loading: true; data?: never; error?: never}
  | {loading: false; data: T; error?: never}
  | {loading: false; data?: never; error: Error};

export interface CurrencySelection {
  availableCurrencies: Currency[];
  selectedCurrency: Currency;
}

export type ResolvedPriceResult = PricingDataResult<ResolvedPrice>;

export type CurrencySelectionResult = PricingDataResult<CurrencySelection> & {
  setSelectedCurrency(currency: string): Promise<void>;
};

export interface PricingTokenResult {
  createPricingToken(): Promise<PricingToken>;
}

export interface PricingChangeEvent {
  selectedCurrency: Currency;
}

export interface Pricing {
  on(event: 'change', listener: (event: PricingChangeEvent) => void): void;
  off(event: 'change', listener: (event: PricingChangeEvent) => void): void;
  getAvailableCurrencies(): Promise<Currency[]>;
  getSelectedCurrency(): Promise<Currency>;
  setSelectedCurrency(currency: string): Promise<void>;
  resolvePrice(price: string): Promise<ResolvedPrice>;
  createPricingToken(): Promise<PricingToken>;
}
