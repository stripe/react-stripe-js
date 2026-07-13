// smoke-tests/projects/react-19-vite/src/App.tsx
import {
  Elements,
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
  PaymentElement,
  CardElement,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  AddressElement,
  ExpressCheckoutElement,
  LinkAuthenticationElement,
  PaymentMethodMessagingElement,
  IbanElement,
} from '@stripe/react-stripe-js';
import {
  CheckoutProvider,
  PaymentElement as CheckoutPaymentElement,
  PaymentFormElement,
  CurrencySelectorElement,
  BillingAddressElement,
  ShippingAddressElement,
} from '@stripe/react-stripe-js/checkout';

const ElementsSection = () => (
  <section data-testid="elements-section">
    <div data-testid="payment-element"><PaymentElement /></div>
    <div data-testid="card-element"><CardElement /></div>
    <div data-testid="split-card-number"><CardNumberElement /></div>
    <div data-testid="split-card-expiry"><CardExpiryElement /></div>
    <div data-testid="split-card-cvc"><CardCvcElement /></div>
    <div data-testid="address-billing">
      <AddressElement options={{mode: 'billing'}} />
    </div>
    <div data-testid="express-checkout">
      <ExpressCheckoutElement onConfirm={() => {}} />
    </div>
    <div data-testid="link-auth">
      <LinkAuthenticationElement />
    </div>
    <div data-testid="pmme">
      <PaymentMethodMessagingElement
        options={{amount: 1099, currency: 'usd', paymentMethodTypes: ['klarna'], countryCode: 'US'}}
      />
    </div>
    <div data-testid="iban">
      <IbanElement options={{supportedCountries: ['SEPA']}} />
    </div>
  </section>
);

const EmbeddedSection = ({stripe}: {stripe: any}) => (
  <section data-testid="embedded-section">
    <EmbeddedCheckoutProvider stripe={stripe} options={{clientSecret: 'cs_test_embedded'}}>
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  </section>
);

const CheckoutSection = ({stripe}: {stripe: any}) => (
  <section data-testid="checkout-section">
    <CheckoutProvider stripe={stripe} options={{clientSecret: 'cs_test_checkout'}}>
      <div data-testid="checkout-payment-form"><PaymentFormElement /></div>
      <div data-testid="checkout-payment"><CheckoutPaymentElement /></div>
      <div data-testid="checkout-currency"><CurrencySelectorElement /></div>
      <div data-testid="checkout-billing"><BillingAddressElement /></div>
      <div data-testid="checkout-shipping"><ShippingAddressElement /></div>
    </CheckoutProvider>
  </section>
);

export const App = ({stripe}: {stripe: any}) => (
  <div data-testid="app">
    <Elements stripe={stripe} options={{mode: 'payment', amount: 1099, currency: 'usd'}}>
      <ElementsSection />
    </Elements>
    <EmbeddedSection stripe={stripe} />
    <CheckoutSection stripe={stripe} />
  </div>
);
