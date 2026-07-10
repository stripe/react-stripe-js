import {useEffect, useState} from 'react';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js';
import type {Stripe} from '@stripe/stripe-js';
import {createMockStripe} from '~/lib/stripeMocks';

export function EmbeddedCheckoutWidget() {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).__SMOKE_MOCK_STRIPE__) {
      setStripe(createMockStripe() as any);
    }
  }, []);
  return (
    <EmbeddedCheckoutProvider
      stripe={stripe}
      options={{clientSecret: 'cs_test_remix_123'}}
    >
      <EmbeddedCheckout data-testid="embedded-checkout" />
    </EmbeddedCheckoutProvider>
  );
}
