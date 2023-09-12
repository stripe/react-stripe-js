// This example shows you how to set up React Stripe.js and use
// Embedded Checkout.
// Learn how to accept a payment using the official Stripe docs.
// https://stripe.com/docs/payments/accept-a-payment#web

import React from 'react';
import {loadStripe} from '@stripe/stripe-js';
import {EmbeddedCheckoutProvider, EmbeddedCheckout} from '../../src';

import '../styles/common.css';

const App = () => {
  const [pk, setPK] = React.useState(
    window.sessionStorage.getItem('react-stripe-js-pk') || ''
  );
  const [clientSecret, setClientSecret] = React.useState(
    window.sessionStorage.getItem('react-stripe-js-embedded-client-secret') ||
      ''
  );

  React.useEffect(() => {
    window.sessionStorage.setItem('react-stripe-js-pk', pk || '');
  }, [pk]);
  React.useEffect(() => {
    window.sessionStorage.setItem(
      'react-stripe-js-embedded-client-secret',
      clientSecret || ''
    );
  }, [clientSecret]);

  const [stripePromise, setStripePromise] = React.useState();

  const handleSubmit = (e) => {
    e.preventDefault();
    setStripePromise(loadStripe(pk, {betas: ['embedded_checkout_beta_1']}));
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
