import type {Stripe} from '@stripe/stripe-js';

export interface PricingProviderOptions {
  /** The pricing policy to initialize. Immutable once initialization starts. */
  pricingPolicy: string;
  /** Overrides currency detection. Immutable once initialization starts. */
  detectedCurrencyOverride?: string;
}

export interface PricingProviderProps {
  /**
   * A Stripe.js instance with Pricing beta access, or a promise resolving to one.
   * Pass null or a promise resolving to null for server rendering.
   * Once initialization starts, remount the provider to change this instance.
   */
  stripe: PromiseLike<Stripe | null> | Stripe | null;
  /** Options may change while waiting for Stripe, but not after initialization starts. */
  options: PricingProviderOptions;
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

export type PricingDataResult<T> =
  | {loading: true; data?: never; error?: never}
  | {loading: false; data: T; error?: never}
  | {loading: false; data?: never; error: Error};

export type ResolvedPriceResult = PricingDataResult<ResolvedPrice>;

export interface CurrencySelection {
  availableCurrencies: Currency[];
  selectedCurrency: Currency;
}

export type CurrencySelectionResult = PricingDataResult<CurrencySelection> & {
  setSelectedCurrency(currency: string): Promise<void>;
};

export type PricingChangeEvent = Record<string, never>;

// Temporary bridge for the Pricing beta API until @stripe/stripe-js publishes
// its types. Mirror the consumed surface of types/stripe-js/pricing.d.ts in
// stripe-js; change events invalidate reads and do not contain pricing data.
export interface Pricing {
  on(event: 'change', listener: (event: PricingChangeEvent) => void): void;
  off(event: 'change', listener: (event: PricingChangeEvent) => void): void;
  getAvailableCurrencies(): Promise<Currency[]>;
  getSelectedCurrency(): Promise<Currency>;
  setSelectedCurrency(currency: string): Promise<void>;
  resolvePrice(price: string): Promise<ResolvedPrice>;
}
