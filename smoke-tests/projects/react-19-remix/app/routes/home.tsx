import {Link} from 'react-router';

export default function Home() {
  return (
    <main>
      <h1>Stripe Smoke Test — React 19 + React Router v7</h1>
      <Link to="/checkout">Checkout</Link>
      <Link to="/embedded-checkout">Embedded Checkout</Link>
    </main>
  );
}
