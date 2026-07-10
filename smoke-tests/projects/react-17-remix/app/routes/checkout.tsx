import {useState, useEffect} from 'react';
import {Elements} from '@stripe/react-stripe-js';
import {CheckoutForm} from '~/components/CheckoutForm';

export default function CheckoutRoute() {
  const [stripe, setStripe] = useState<any>(null);

  useEffect(() => {
    const mock = (window as any).__SMOKE_MOCK_STRIPE__;
    if (mock) setStripe(mock);
  }, []);

  return (
    <Elements stripe={stripe}>
      <CheckoutForm />
    </Elements>
  );
}
