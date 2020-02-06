import createElementComponent from './components/createElementComponent';
import {
  CardElementComponent,
  CardNumberElementComponent,
  CardExpiryElementComponent,
  CardCvcElementComponent,
  IbanElementComponent,
  IdealBankElementComponent,
  PaymentRequestButtonElementComponent,
} from './types';

export {
  useElements,
  useStripe,
  Elements,
  ElementsConsumer,
} from './components/Elements';

const isServer = typeof window === 'undefined';

/**
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */
export const CardElement: CardElementComponent = createElementComponent(
  'card',
  isServer
);

/**
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */
export const CardNumberElement: CardNumberElementComponent = createElementComponent(
  'cardNumber',
  isServer
);

/**
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */
export const CardExpiryElement: CardExpiryElementComponent = createElementComponent(
  'cardExpiry',
  isServer
);

/**
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */
export const CardCvcElement: CardCvcElementComponent = createElementComponent(
  'cardCvc',
  isServer
);

/**
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */
export const IbanElement: IbanElementComponent = createElementComponent(
  'iban',
  isServer
);

/**
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */
export const IdealBankElement: IdealBankElementComponent = createElementComponent(
  'idealBank',
  isServer
);

/**
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */
export const PaymentRequestButtonElement: PaymentRequestButtonElementComponent = createElementComponent(
  'paymentRequestButton',
  isServer
);
