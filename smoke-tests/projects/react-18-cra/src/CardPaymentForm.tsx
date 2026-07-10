import React from 'react';
import {CardElement, useStripe, useElements} from '@stripe/react-stripe-js';

export const CardPaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    const cardEl = elements.getElement(CardElement);
    if (cardEl) await stripe.createPaymentMethod({type: 'card', card: cardEl as any});
  };

  return (
    <form onSubmit={handleSubmit} data-testid="card-form">
      <CardElement id="card-element" />
      <button type="submit" disabled={!stripe}>Pay</button>
    </form>
  );
};
