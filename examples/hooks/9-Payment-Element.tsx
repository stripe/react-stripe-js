// This example shows you how to set up React Stripe.js and use Elements.
// Learn how to accept a payment using the official Stripe docs.
// https://stripe.com/docs/payments/accept-a-payment#web

import type {ChangeEventHandler, SubmitEventHandler} from 'react';
import {useEffect, useState} from 'react';
import {Appearance, loadStripe, Stripe} from '@stripe/stripe-js';
import {PaymentElement, Elements, useElements, useStripe} from '../../src';

import '../styles/common.css';

const CheckoutForm = () => {
  const [status, setStatus] = useState<string>();
  const [loading, setLoading] = useState(false);
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
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

const THEMES = ['stripe', 'flat', 'none'];

const App = () => {
  const [pk, setPK] = useState(
    window.sessionStorage.getItem('react-stripe-js-pk') || ''
  );
  const [clientSecret, setClientSecret] = useState<string | null>('');

  useEffect(() => {
    window.sessionStorage.setItem('react-stripe-js-pk', pk || '');
  }, [pk]);

  const [stripePromise, setStripePromise] =
    useState<Promise<Stripe | null> | null>();
  const [theme, setTheme] = useState<Appearance['theme']>('stripe');

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    setStripePromise(loadStripe(pk));
  };

  const handleThemeChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    setTheme(e.target.value as any);
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
            value={clientSecret || ''}
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
