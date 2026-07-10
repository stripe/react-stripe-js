import {useState, useEffect} from 'react';
import {EmbeddedCheckoutProvider} from '@stripe/react-stripe-js';
import {EmbeddedCheckoutWidget} from '~/components/EmbeddedCheckoutWidget';

export default function EmbeddedCheckoutRoute() {
  const [stripe, setStripe] = useState<any>(null);

  useEffect(() => {
    const mock = (window as any).__SMOKE_MOCK_STRIPE__;
    if (mock) setStripe(mock);
  }, []);

  return (
    <EmbeddedCheckoutProvider
      stripe={stripe}
      options={{clientSecret: 'cs_test_mock'}}
    >
      <EmbeddedCheckoutWidget />
    </EmbeddedCheckoutProvider>
  );
}
