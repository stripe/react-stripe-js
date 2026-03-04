import createElementComponent from './components/createElementComponent';
import {
  AuBankAccountElementComponent,
  CardElementComponent,
  CardNumberElementComponent,
  CardExpiryElementComponent,
  CardCvcElementComponent,
  ExpressCheckoutElementComponent,
  IbanElementComponent,
  LinkAuthenticationElementComponent,
  PaymentElementComponent,
  PaymentRequestButtonElementComponent,
  ShippingAddressElementComponent,
  AddressElementComponent,
  PaymentMethodMessagingElementComponent,
  TaxIdElementComponent,
  IssuingCardNumberDisplayElementComponent,
  IssuingCardCvcDisplayElementComponent,
  IssuingCardExpiryDisplayElementComponent,
  IssuingCardPinDisplayElementComponent,
  IssuingCardCopyButtonElementComponent,
} from './types';
import {isServer} from './utils/isServer';

export * from './types';

export {useElements, Elements, ElementsConsumer} from './components/Elements';

export {EmbeddedCheckout} from './components/EmbeddedCheckout';
export {EmbeddedCheckoutProvider} from './components/EmbeddedCheckoutProvider';
export {FinancialAccountDisclosure} from './components/FinancialAccountDisclosure';
export {IssuingDisclosure} from './components/IssuingDisclosure';
export {useStripe} from './components/useStripe';

/**
 * Requires beta access:
 * Contact [Stripe support](https://support.stripe.com/) for more information.
 *
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */
export const AuBankAccountElement: AuBankAccountElementComponent = createElementComponent(
  'auBankAccount',
  isServer
);

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

export const PaymentElement: PaymentElementComponent = createElementComponent(
  'payment',
  isServer
);

/**
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */
export const ExpressCheckoutElement: ExpressCheckoutElementComponent = createElementComponent(
  'expressCheckout',
  isServer
);

/**
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */
export const PaymentRequestButtonElement: PaymentRequestButtonElementComponent = createElementComponent(
  'paymentRequestButton',
  isServer
);

/**
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */
export const LinkAuthenticationElement: LinkAuthenticationElementComponent = createElementComponent(
  'linkAuthentication',
  isServer
);

/**
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */
export const AddressElement: AddressElementComponent = createElementComponent(
  'address',
  isServer
);

/**
 * @deprecated
 * Use `AddressElement` instead.
 *
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */
export const ShippingAddressElement: ShippingAddressElementComponent = createElementComponent(
  'shippingAddress',
  isServer
);

/**
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */
export const PaymentMethodMessagingElement: PaymentMethodMessagingElementComponent = createElementComponent(
  'paymentMethodMessaging',
  isServer
);

/**
 * Requires beta access:
 * Contact [Stripe support](https://support.stripe.com/) for more information.
 */
export const TaxIdElement: TaxIdElementComponent = createElementComponent(
  'taxId',
  isServer
);

/**
 * Display the card number (PAN) for virtual Issuing cards.
 * Requires ephemeral key authentication.
 * @docs https://stripe.com/docs/issuing/elements
 */
export const IssuingCardNumberDisplayElement: IssuingCardNumberDisplayElementComponent = createElementComponent(
  'issuingCardNumberDisplay' as any,
  isServer
);

/**
 * Display the CVC for virtual Issuing cards.
 * Requires ephemeral key authentication.
 * @docs https://stripe.com/docs/issuing/elements
 */
export const IssuingCardCvcDisplayElement: IssuingCardCvcDisplayElementComponent = createElementComponent(
  'issuingCardCvcDisplay' as any,
  isServer
);

/**
 * Display the expiry date for Issuing cards.
 * Requires ephemeral key authentication.
 * @docs https://stripe.com/docs/issuing/elements
 */
export const IssuingCardExpiryDisplayElement: IssuingCardExpiryDisplayElementComponent = createElementComponent(
  'issuingCardExpiryDisplay' as any,
  isServer
);

/**
 * Display the PIN for Issuing cards.
 * Requires ephemeral key authentication and two-factor authentication.
 * @docs https://stripe.com/docs/issuing/elements
 */
export const IssuingCardPinDisplayElement: IssuingCardPinDisplayElementComponent = createElementComponent(
  'issuingCardPinDisplay' as any,
  isServer
);

/**
 * A transparent copy-to-clipboard button for Issuing card data.
 * Can copy card number, CVC, expiry, or PIN to clipboard.
 * @docs https://stripe.com/docs/issuing/elements
 */
export const IssuingCardCopyButtonElement: IssuingCardCopyButtonElementComponent = createElementComponent(
  'issuingCardCopyButton' as any,
  isServer
);
