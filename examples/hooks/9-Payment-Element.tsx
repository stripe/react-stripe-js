// This example shows you how to set up React Stripe.js and use Elements.
// Learn how to accept a payment using the official Stripe docs.
// https://stripe.com/docs/payments/accept-a-payment#web

import React, {ChangeEvent, FormEvent} from 'react';
import {loadStripe, Stripe, Appearance} from '@stripe/stripe-js';
import {PaymentElement, Elements, useElements, useStripe} from '../../src';

import '../styles/common.css';

const CheckoutForm = () => {
  const [status, setStatus] = React.useState<string>();
  const [loading, setLoading] = React.useState(false);
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event: ChangeEvent<HTMLFormElement>) => {
    // Block native form submission.
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      return;
    }

    setLoading(true);

    stripe
      .confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {return_url: window.location.href},
      })
      .then((res) => {
        setLoading(false);
        if (res.error) {
          console.error(res.error);
          setStatus(res.error.message);
        } else {
          setStatus(res.paymentIntent.status);
        }
      });
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" disabled={!stripe || loading}>
        {loading ? 'Processing...' : 'Pay'}
      </button>
      {status && <p>{status}</p>}
    </form>
  );
};

const THEMES = ['stripe', 'flat', 'none'] as const;

const App = () => {
  const [pk, setPK] = React.useState(
    window.sessionStorage.getItem('react-stripe-js-pk') || ''
  );
  const [clientSecret, setClientSecret] = React.useState<string | null>('');

  React.useEffect(() => {
    window.sessionStorage.setItem('react-stripe-js-pk', pk || '');
  }, [pk]);

  const [
    stripePromise,
    setStripePromise,
  ] = React.useState<null | Promise<Stripe | null>>();
  const [theme, setTheme] = React.useState<Appearance['theme']>('stripe');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setStripePromise(loadStripe(pk));
  };

  const handleThemeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value as Appearance['theme']);
  };

  const handleUnload = () => {
    setStripePromise(null);
    setClientSecret(null);
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <label>
          Intent client_secret
          <input
            value={clientSecret || undefined}
            onChange={(e) => setClientSecret(e.target.value)}
          />
        </label>
        <label>
          Publishable key{' '}
          <input value={pk} onChange={(e) => setPK(e.target.value)} />
        </label>
        <button style={{marginRight: 10}} type="submit">
          Load
        </button>
        <button type="button" onClick={handleUnload}>
          Unload
        </button>
        <label>
          Theme
          <select onChange={handleThemeChange}>
            {THEMES.map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        </label>
      </form>
      {stripePromise && clientSecret && (
        <Elements
          stripe={stripePromise}
          options={{clientSecret, appearance: {theme}}}
        >
          <CheckoutForm />
        </Elements>
      )}
    </>
  );
};

export default App;
