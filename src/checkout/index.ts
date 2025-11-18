export {
  useCheckout,
  CheckoutProvider,
  StripeUseCheckoutResult,
  StripeCheckoutValue,
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
  PaymentFormElementComponent,
  ExpressCheckoutElementComponent,
  TaxIdElementComponent,
} from './types';

export const CurrencySelectorElement: CurrencySelectorElementComponent = createElementComponent(
  'currencySelector',
  isServer
);

export const PaymentElement: PaymentElementComponent = createElementComponent(
  'payment',
  isServer
);

export const PaymentFormElement: PaymentFormElementComponent = createElementComponent(
  'paymentForm',
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

const AddressElementBase = createElementComponent('address', isServer) as any;

export const BillingAddressElement: BillingAddressElementComponent = ((
  props
) => {
  const {options, ...rest} = props as any;
  const merged = {...options, mode: 'billing'};
  return React.createElement(AddressElementBase, {...rest, options: merged});
}) as BillingAddressElementComponent;

export const ShippingAddressElement: ShippingAddressElementComponent = ((
  props
) => {
  const {options, ...rest} = props as any;
  const merged = {...options, mode: 'shipping'};
  return React.createElement(AddressElementBase, {...rest, options: merged});
}) as ShippingAddressElementComponent;
