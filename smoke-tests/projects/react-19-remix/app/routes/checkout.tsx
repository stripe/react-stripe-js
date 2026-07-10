import {useEffect, useState} from 'react';
import {Elements} from '@stripe/react-stripe-js';
import {CheckoutForm} from '~/components/CheckoutForm';

export default function CheckoutRoute() {
  const [stripe, setStripe] = useState<any>(null);

  useEffect(() => {
    const mock = (window as any).__SMOKE_MOCK_STRIPE__;
    if (mock) setStripe(mock);
  }, []);

  return (
    <main data-testid="checkout-page">
      <h1>Checkout</h1>
      <Elements stripe={stripe} options={{mode: 'payment', amount: 1099, currency: 'usd'}}>
        <CheckoutForm />
      </Elements>
    </main>
  );
}
