// smoke-tests/projects/react-18-vite/src/SplitCardForm.tsx
import {CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements} from '@stripe/react-stripe-js';
import React from 'react';

export const SplitCardForm = () => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    const numberEl = elements.getElement(CardNumberElement);
    if (numberEl) {
      await stripe.createPaymentMethod({type: 'card', card: numberEl as any});
    }
  };

  return (
    <form data-testid="split-card-form" onSubmit={handleSubmit}>
      <CardNumberElement id="card-number" />
      <CardExpiryElement id="card-expiry" />
      <CardCvcElement id="card-cvc" />
      <button type="submit" disabled={!stripe}>Submit</button>
    </form>
  );
};
