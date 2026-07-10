import {EmbeddedCheckoutWidget} from '~/components/EmbeddedCheckoutWidget';

export default function EmbeddedCheckoutRoute() {
  return (
    <main data-testid="embedded-checkout-page">
      <h1>Embedded Checkout</h1>
      <EmbeddedCheckoutWidget />
    </main>
  );
}
