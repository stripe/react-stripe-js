import {EmbeddedCheckout} from '@stripe/react-stripe-js';

export function EmbeddedCheckoutWidget() {
  return (
    <div data-testid="embedded-checkout-container">
      <EmbeddedCheckout />
    </div>
  );
}
