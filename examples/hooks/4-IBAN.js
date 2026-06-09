// This example shows you how to set up React Stripe.js and use Elements.
// Learn how to accept a SEPA Debit payment using the official Stripe docs.
// https://stripe.com/docs/payments/sepa-debit/accept-a-payment

import React, {useState} from 'react';
import {loadStripe} from '@stripe/stripe-js';
import {IbanElement, Elements, useElements, useStripe} from '../../src';

import {logEvent, Result, ErrorResult} from '../util';
import '../styles/common.css';

const ELEMENT_OPTIONS = {
  supportedCountries: ['SEPA'],
  style: {
    base: {
      fontSize: '18px',
      color: '#424770',
      letterSpacing: '0.025em',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      return;
    }

    const ibanElement = elements.getElement(IbanElement);

    if (ibanElement == null) {
      return;
    }

    const payload = await stripe.createPaymentMethod({
      type: 'sepa_debit',
      sepa_debit: ibanElement,
      billing_details: {
        name,
        email,
      },
    });

    if (payload.error) {
      console.log('[error]', payload.error);
      setErrorMessage(payload.error.message);
      setPaymentMethod(null);
    } else {
      console.log('[PaymentMethod]', payload.paymentMethod);
      setPaymentMethod(payload.paymentMethod);
      setErrorMessage(null);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="name">Full Name</label>
      <input
        id="name"
        required
        placeholder="Jenny Rosen"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
        }}
      />
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        placeholder="jenny@example.com"
        required
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
        }}
      />
      <label htmlFor="iban">Bank Account</label>
      <IbanElement
        id="iban"
        onBlur={logEvent('blur')}
        onChange={logEvent('change')}
        onFocus={logEvent('focus')}
        onReady={logEvent('ready')}
        options={ELEMENT_OPTIONS}
      />
      {errorMessage && <ErrorResult>{errorMessage}</ErrorResult>}
      {paymentMethod && <Result>Got PaymentMethod: {paymentMethod.id}</Result>}
      <button type="submit" disabled={!stripe}>
        Pay
      </button>
    </form>
  );
};

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe('pk_test_6pRNASCoBOKtIshFeQd4XMUh');

const App = () => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
};

export default App;
