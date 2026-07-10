'use client';
import React, {useEffect, useState} from 'react';
import {Elements} from '@stripe/react-stripe-js';
import {CheckoutForm} from './CheckoutForm';
import type {Stripe} from '@stripe/stripe-js';
import {createMockStripe} from '@/lib/stripeMocks';

export function CheckoutPageClient() {
  const [stripe, setStripe] = useState<Stripe | null>(null);

  useEffect(() => {
    // In real usage: loadStripe(process.env.NEXT_PUBLIC_STRIPE_PK!)
    // For smoke testing, use window-injected mock or the module mock
    const mockOrReal =
      typeof window !== 'undefined' && (window as any).__SMOKE_MOCK_STRIPE__
        ? createMockStripe()
        : null;
    setStripe(mockOrReal as any);
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
