import {Link} from '@remix-run/react';

export default function Index() {
  return (
    <div>
      <h1>Stripe Smoke Test — React 17 + Remix v1</h1>
      <Link to="/checkout">Checkout</Link>
      <Link to="/embedded-checkout">Embedded Checkout</Link>
    </div>
  );
}
