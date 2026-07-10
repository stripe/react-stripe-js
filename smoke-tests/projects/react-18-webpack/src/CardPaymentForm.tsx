import React, {useState} from 'react';
import {CardElement, useStripe, useElements} from '@stripe/react-stripe-js';

export const CardPaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [status, setStatus] = useState<'idle' | 'processing'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;
    setStatus('processing');
    await stripe.createPaymentMethod({type: 'card', card: cardElement});
    setStatus('idle');
  };

  return (
    <form onSubmit={handleSubmit} data-testid="card-payment-form">
      <CardElement />
      <button type="submit" disabled={!stripe || status === 'processing'} data-testid="card-submit-btn">
        {status === 'processing' ? 'Processing…' : 'Pay'}
      </button>
    </form>
  );
};
