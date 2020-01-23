// @flow
import createElementComponent from './components/createElementComponent';
import {
  useElements,
  useStripe,
  Elements,
  ElementsConsumer,
} from './components/Elements';

export {Elements, useElements, useStripe, ElementsConsumer};

const isServer = typeof window === 'undefined';

export const CardElement = createElementComponent('card', isServer);
export const CardNumberElement = createElementComponent('cardNumber', isServer);
export const CardExpiryElement = createElementComponent('cardExpiry', isServer);
export const CardCvcElement = createElementComponent('cardCvc', isServer);
export const IbanElement = createElementComponent('iban', isServer);
export const IdealBankElement = createElementComponent('idealBank', isServer);
export const PaymentRequestButtonElement = createElementComponent(
  'paymentRequestButton',
  isServer
);
