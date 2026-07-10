// smoke-tests/projects/react-19-vite/src/CheckoutForm.tsx
import {PaymentElement, useStripe, useElements} from '@stripe/react-stripe-js';
import React, {useState} from 'react';

export const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setStatus('processing');
    const {error} = await stripe.confirmPayment({
      elements,
      confirmParams: {return_url: 'https://example.com/success'},
      redirect: 'if_required',
    });
    setStatus(error ? 'error' : 'success');
  };

  return (
    <form onSubmit={handleSubmit} data-testid="checkout-form">
      <PaymentElement id="payment-element" />
      <button type="submit" disabled={!stripe || status === 'processing'}>
        {status === 'processing' ? 'Processing…' : 'Pay now'}
      </button>
      {status === 'success' && <p data-testid="success-msg">Payment successful</p>}
      {status === 'error' && <p data-testid="error-msg">Payment failed</p>}
    </form>
  );
};
