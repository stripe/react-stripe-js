// @flow
import createElementComponent from './components/createElementComponent';
import {useElements, injectElements, Elements} from './components/Elements';

export {Elements, useElements, injectElements};
export const CardElement = createElementComponent('card');
export const CardNumberElement = createElementComponent('cardNumber');
export const CardExpiryElement = createElementComponent('cardExpiry');
export const CardCvcElement = createElementComponent('cardCvc');
export const IbanElement = createElementComponent('iban');
export const IdealBankElement = createElementComponent('idealBank');
export const PaymentRequestButtonElement = createElementComponent(
  'paymentRequestButton'
);
