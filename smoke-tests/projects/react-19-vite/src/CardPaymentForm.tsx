// smoke-tests/projects/react-19-vite/src/CardPaymentForm.tsx
import {CardElement, useStripe, useElements} from '@stripe/react-stripe-js';
import React, {useState} from 'react';

export const CardPaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;
    const {error, paymentMethod} = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement as any,
    });
    if (error) setErrorMsg(error.message ?? 'Unknown error');
  };

  return (
    <form onSubmit={handleSubmit} data-testid="card-form">
      <CardElement id="card-element" />
      {errorMsg && <p data-testid="card-error">{errorMsg}</p>}
      <button type="submit" disabled={!stripe}>Pay</button>
    </form>
  );
};
