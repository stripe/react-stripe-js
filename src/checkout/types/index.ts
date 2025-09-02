import {FunctionComponent} from 'react';
import * as stripeJs from '@stripe/stripe-js';
import {StripeError} from '@stripe/stripe-js';
import {
  ElementProps,
  PaymentElementProps as RootPaymentElementProps,
  ExpressCheckoutElementProps as RootExpressCheckoutElementProps,
} from '../../types';

export interface CurrencySelectorElementProps extends ElementProps {
  /**
   * Triggered when the Element is fully rendered and can accept imperative `element.focus()` calls.
   * Called with a reference to the underlying [Element instance](https://stripe.com/docs/js/element).
   */
  onReady?: (element: stripeJs.StripeCurrencySelectorElement) => any;

  /**
   * Triggered when the escape key is pressed within the Element.
   */
  onEscape?: () => any;

  /**
   * Triggered when the Element fails to load.
   */
  onLoadError?: (event: {
    elementType: 'currencySelector';
    error: StripeError;
  }) => any;

  /**
   * Triggered when the [loader](https://stripe.com/docs/js/elements_object/create#stripe_elements-options-loader) UI is mounted to the DOM and ready to be displayed.
   */
  onLoaderStart?: (event: {elementType: 'currencySelector'}) => any;
}

export type CurrencySelectorElementComponent = FunctionComponent<
  CurrencySelectorElementProps
>;

export interface BillingAddressElementProps extends ElementProps {
  options?: stripeJs.StripeCheckoutAddressElementOptions;
  onReady?: (element: stripeJs.StripeAddressElement) => any;
  onEscape?: () => any;
  onLoadError?: (event: {elementType: 'address'; error: StripeError}) => any;
  onLoaderStart?: (event: {elementType: 'address'}) => any;
}

export type BillingAddressElementComponent = FunctionComponent<
  BillingAddressElementProps
>;

export interface ShippingAddressElementProps extends ElementProps {
  options?: stripeJs.StripeCheckoutAddressElementOptions;
  onReady?: (element: stripeJs.StripeAddressElement) => any;
  onEscape?: () => any;
  onLoadError?: (event: {elementType: 'address'; error: StripeError}) => any;
  onLoaderStart?: (event: {elementType: 'address'}) => any;
}

export type ShippingAddressElementComponent = FunctionComponent<
  ShippingAddressElementProps
>;

export type PaymentElementProps = Omit<RootPaymentElementProps, 'options'> & {
  options?: stripeJs.StripeCheckoutPaymentElementOptions;
};

export type PaymentElementComponent = FunctionComponent<PaymentElementProps>;

export type ExpressCheckoutElementProps = Omit<
  RootExpressCheckoutElementProps,
  | 'options'
  | 'onClick'
  | 'onCancel'
  | 'onShippingAddressChange'
  | 'onShippingRateChange'
> & {options?: stripeJs.StripeCheckoutExpressCheckoutElementOptions};

export type ExpressCheckoutElementComponent = FunctionComponent<
  ExpressCheckoutElementProps
>;

export interface TaxIdElementProps extends ElementProps {
  options: stripeJs.StripeTaxIdElementOptions;
  onChange?: (event: stripeJs.StripeTaxIdElementChangeEvent) => any;
  onReady?: (element: stripeJs.StripeTaxIdElement) => any;
  onEscape?: () => any;
  onLoadError?: (event: {elementType: 'taxId'; error: StripeError}) => any;
  onLoaderStart?: (event: {elementType: 'taxId'}) => any;
}

export type TaxIdElementComponent = FunctionComponent<TaxIdElementProps>;
