export {
  useCheckout,
  CheckoutProvider,
  CheckoutState,
} from './components/CheckoutProvider';
export * from './types';
import React from 'react';
import createElementComponent from '../components/createElementComponent';
import {isServer} from '../utils/isServer';
import {
  CurrencySelectorElementComponent,
  BillingAddressElementComponent,
  ShippingAddressElementComponent,
  PaymentElementComponent,
  ExpressCheckoutElementComponent,
  TaxIdElementComponent,
} from './types';

/**
 * Requires beta access:
 * Contact [Stripe support](https://support.stripe.com/) for more information.
 */
export const CurrencySelectorElement: CurrencySelectorElementComponent = createElementComponent(
  'currencySelector',
  isServer
);

export const PaymentElement: PaymentElementComponent = createElementComponent(
  'payment',
  isServer
);

export const ExpressCheckoutElement: ExpressCheckoutElementComponent = createElementComponent(
  'expressCheckout',
  isServer
);

export const TaxIdElement: TaxIdElementComponent = createElementComponent(
  'taxId',
  isServer
);

export const BillingAddressElement: BillingAddressElementComponent = ((
  props
) => {
  const Component = createElementComponent('address', isServer) as any;
  const {options, ...rest} = props as any;
  const merged = {...options, mode: 'billing'};
  return React.createElement(Component, {...rest, options: merged});
}) as BillingAddressElementComponent;

export const ShippingAddressElement: ShippingAddressElementComponent = ((
  props
) => {
  const Component = createElementComponent('address', isServer) as any;
  const {options, ...rest} = props as any;
  const merged = {...options, mode: 'shipping'};
  return React.createElement(Component, {...rest, options: merged});
}) as ShippingAddressElementComponent;
