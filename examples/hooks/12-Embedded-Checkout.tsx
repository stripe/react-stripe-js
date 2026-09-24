// This example shows you how to set up React Stripe.js and use
// Embedded Checkout.
// Learn how to accept a payment using the official Stripe docs.
// https://stripe.com/docs/payments/accept-a-payment#web

import type {SubmitEventHandler} from 'react';
import {useEffect, useState} from 'react';
import {loadStripe, Stripe} from '@stripe/stripe-js';
import {EmbeddedCheckoutProvider, EmbeddedCheckout} from '../../src';

import '../styles/common.css';

const App = () => {
  const [pk, setPK] = useState(
    window.sessionStorage.getItem('react-stripe-js-pk') || ''
  );
  const [clientSecret, setClientSecret] = useState(
    window.sessionStorage.getItem('react-stripe-js-embedded-client-secret') ||
      ''
  );

  useEffect(() => {
    window.sessionStorage.setItem('react-stripe-js-pk', pk || '');
  }, [pk]);
  useEffect(() => {
    window.sessionStorage.setItem(
      'react-stripe-js-embedded-client-secret',
      clientSecret || ''
    );
  }, [clientSecret]);

  const [stripePromise, setStripePromise] =
    useState<Promise<Stripe | null> | null>();

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    setStripePromise(loadStripe(pk));
  };

  const handleUnload = () => {
    setStripePromise(null);
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <label>
          CheckoutSession client_secret
          <input
            value={clientSecret}
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
      </form>
      {stripePromise && clientSecret && (
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{clientSecret}}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      )}
    </>
  );
};

export default App;
