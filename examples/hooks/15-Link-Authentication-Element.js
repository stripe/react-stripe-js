// This example shows you how to set up React Stripe.js and use the
// Link Authentication Element with deferred intent configuration.
// Learn more in the official Stripe docs:
// https://stripe.com/docs/payments/link/save-and-reuse

import React, {useState} from 'react';
import {loadStripe} from '@stripe/stripe-js';
import {LinkAuthenticationElement, Elements, PaymentElement} from '../../src';

import {ErrorResult} from '../util';
import '../styles/common.css';

const ELEMENTS_OPTIONS = {
  mode: 'payment',
  amount: 1099,
  currency: 'usd',
};

const CheckoutForm = () => {
  const [errorMessage, setErrorMessage] = useState(null);
  const [email, setEmail] = useState('demo@stripe.com');

  return (
    <form>
      <LinkAuthenticationElement
        id="link-authentication"
        on
        options={{
          defaultValues: {
            email: 'demo@stripe.com',
          },
        }}
        onChange={(event) => {
          if (event.complete) {
            setEmail(event.value.email);
          }
        }}
        onLoadError={(event) => {
          setErrorMessage(event.error.message);
        }}
      />
      <PaymentElement
        options={{
          defaultValues: {
            billingDetails: {
              email: email,
            },
          },
        }}
      />
      {errorMessage && <ErrorResult>{errorMessage}</ErrorResult>}
    </form>
  );
};

const App = () => {
  const [stripePromise] = useState(() => {
    return loadStripe('pk_test_6pRNASCoBOKtIshFeQd4XMUh');
  });
  return (
    <Elements stripe={stripePromise} options={ELEMENTS_OPTIONS}>
      <CheckoutForm />
    </Elements>
  );
};

export default App;
