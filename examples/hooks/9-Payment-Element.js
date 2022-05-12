// This example shows you how to set up React Stripe.js and use Elements.
// Learn how to accept a payment using the official Stripe docs.
// https://stripe.com/docs/payments/accept-a-payment#web

import React from 'react';
import {loadStripe} from '@stripe/stripe-js';
import {PaymentElement, Elements, useElements, useStripe} from '../../src';

import '../styles/common.css';

const CheckoutForm = () => {
  const [status, setStatus] = React.useState();
  const [loading, setLoading] = React.useState(false);
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event) => {
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
  const [pk, setPK] = React.useState(
    window.sessionStorage.getItem('react-stripe-js-pk') || ''
  );
  const [sk, setSK] = React.useState(
    window.sessionStorage.getItem('react-stripe-js-sk') || ''
  );
  React.useEffect(() => {
    window.sessionStorage.setItem('react-stripe-js-pk', pk || '');
    window.sessionStorage.setItem('react-stripe-js-sk', sk || '');
  }, [pk, sk]);

  const [stripePromise, setStripePromise] = React.useState();
  const [clientSecret, setClientSecret] = React.useState();
  const [theme, setTheme] = React.useState('stripe');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Initialize Stripe.js
    setStripePromise(loadStripe(pk));

    // NOTE: THIS IS FOR DEMO PURPOSES ONLY.
    // YOUR SECRET KEY SHOULD ONLY BE USED IN A SECURE SERVER ENVIRONMENT.
    // IT SHOULD NOT BE EXPOSED TO USERS.
    fetch('https://api.stripe.com/v1/payment_intents', {
      headers: {
        accept: 'application/json',
        authorization: 'Bearer ' + sk,
        'content-type':
          'application/x-www-form-urlencoded, application/x-www-form-urlencoded',
      },
      body:
        'currency=usd&amount=2500&payment_method_types[0]=card&payment_method_types[1]=us_bank_account',
      method: 'POST',
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.client_secret) {
          setClientSecret(res.client_secret);
        } else {
          console.error(res);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  const handleUnload = () => {
    setStripePromise(null);
    setClientSecret(null);
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <label>
          Secret key{' '}
          <input
            autoComplete="off"
            type="password"
            value={sk}
            onChange={(e) => setSK(e.target.value)}
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
