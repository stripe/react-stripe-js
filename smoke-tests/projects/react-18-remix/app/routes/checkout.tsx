import {useEffect, useState} from 'react';
import {Elements} from '@stripe/react-stripe-js';
import type {Stripe} from '@stripe/stripe-js';
import {CheckoutForm} from '~/components/CheckoutForm';
import {createMockStripe} from '~/lib/stripeMocks';

export default function CheckoutRoute() {
  const [stripe, setStripe] = useState<Stripe | null>(null);

  useEffect(() => {
    // In production: setStripe(await loadStripe(ENV.STRIPE_PK))
    // In smoke tests: use injected mock
    if (typeof window !== 'undefined' && (window as any).__SMOKE_MOCK_STRIPE__) {
      setStripe(createMockStripe() as any);
    }
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
