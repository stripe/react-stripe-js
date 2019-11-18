// @noflow

import React from 'react';
import {CardElement, Elements, useElements} from '../../src';

import '../styles/common.css';

const stripe = window.Stripe('pk_test_6pRNASCoBOKtIshFeQd4XMUh');

const ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

const MyCardField = () => (
  <div>
    <label htmlFor="card">Card details</label>
    <CardElement id="card" options={ELEMENT_OPTIONS} />
  </div>
);

const Checkout = () => {
  const elements = useElements();

  const handleSubmit = async (event) => {
    // block native form submission
    event.preventDefault();

    // Get a reference to a mounted CardElement. Elements will know how
    // to find your CardElement since there can only ever be one of
    // each type of element.
    const cardElement = elements.getElement('card');

    // Use your card Element with other Stripe.js APIs
    const {error, paymentMethod} = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      console.log('[error]', error);
    } else {
      console.log('[PaymentMethod]', paymentMethod);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <MyCardField />
      <button type="submit">Pay</button>
    </form>
  );
};

const App = () => {
  return (
    <Elements stripe={stripe}>
      <Checkout />
    </Elements>
  );
};

export default App;
