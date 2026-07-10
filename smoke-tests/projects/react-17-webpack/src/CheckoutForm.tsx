import {useState} from 'react';
import {PaymentElement, useStripe, useElements} from '@stripe/react-stripe-js';

export const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [status, setStatus] = useState<'idle' | 'processing'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setStatus('processing');
    await stripe.confirmPayment({
      elements,
      confirmParams: {return_url: 'https://example.com/success'},
      redirect: 'if_required',
    });
    setStatus('idle');
  };

  return (
    <form onSubmit={handleSubmit} data-testid="checkout-form">
      <PaymentElement id="payment-element" />
      <button type="submit" disabled={!stripe || status === 'processing'} data-testid="submit-btn">
        {status === 'processing' ? 'Processing…' : 'Pay'}
      </button>
    </form>
  );
};
