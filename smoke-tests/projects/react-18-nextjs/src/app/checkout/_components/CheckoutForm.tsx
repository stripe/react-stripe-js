'use client';
import React from 'react';
import {PaymentElement, useStripe, useElements} from '@stripe/react-stripe-js';

export function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    await stripe.confirmPayment({elements, confirmParams: {return_url: '/'}, redirect: 'if_required'});
  };

  return (
    <form onSubmit={handleSubmit} data-testid="payment-form">
      <PaymentElement id="payment-element" />
      <button type="submit" disabled={!stripe} data-testid="submit-btn">
        {stripe ? 'Pay now' : 'Loading…'}
      </button>
    </form>
  );
}
