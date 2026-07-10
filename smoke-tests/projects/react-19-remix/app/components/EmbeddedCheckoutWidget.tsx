import {useEffect, useState} from 'react';
import {EmbeddedCheckoutProvider, EmbeddedCheckout} from '@stripe/react-stripe-js';

export function EmbeddedCheckoutWidget() {
  const [stripe, setStripe] = useState<any>(null);
  useEffect(() => {
    const mock = (window as any).__SMOKE_MOCK_STRIPE__;
    if (mock) setStripe(mock);
  }, []);
  return (
    <EmbeddedCheckoutProvider stripe={stripe} options={{clientSecret: 'cs_test_remix_123'}}>
      <EmbeddedCheckout data-testid="embedded-checkout" />
    </EmbeddedCheckoutProvider>
  );
}
