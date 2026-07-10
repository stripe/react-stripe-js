'use client';
import React, {useEffect, useState} from 'react';
import {EmbeddedCheckoutProvider, EmbeddedCheckout} from '@stripe/react-stripe-js';
import type {Stripe} from '@stripe/stripe-js';
import {createMockStripe} from '@/lib/stripeMocks';

export function EmbeddedCheckoutPageClient() {
  const [stripe, setStripe] = useState<Stripe | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).__SMOKE_MOCK_STRIPE__) {
      setStripe(createMockStripe() as any);
    }
  }, []);

  return (
    <main data-testid="embedded-checkout-page">
      <EmbeddedCheckoutProvider
        stripe={stripe}
        options={{clientSecret: 'cs_test_embedded_123'}}
      >
        <EmbeddedCheckout id="embedded-checkout" />
      </EmbeddedCheckoutProvider>
    </main>
  );
}
