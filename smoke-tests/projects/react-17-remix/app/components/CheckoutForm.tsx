import {useState} from 'react';
import {PaymentElement, useStripe, useElements} from '@stripe/react-stripe-js';

export function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [status, setStatus] = useState<string>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setStatus('processing');
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {return_url: window.location.href},
      redirect: 'if_required',
    } as any);
    if ((result as any).error) {
      setStatus('error');
    } else {
      setStatus('success');
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="checkout-form">
      <PaymentElement />
      <button type="submit" disabled={!stripe} data-testid="submit-button">
        Pay
      </button>
      <div data-testid="payment-status">{status}</div>
    </form>
  );
}
