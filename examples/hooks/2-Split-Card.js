// @noflow

import React, {useState} from 'react';
import {loadStripe} from '@stripe/stripe-js';
import {
  CardNumberElement,
  CardCvcElement,
  CardExpiryElement,
  Elements,
  useElements,
  useStripe,
} from '../../src';

import {logEvent, Result, ErrorResult} from '../util';
import '../styles/common.css';

const ELEMENT_OPTIONS = {
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
  const elements = useElements();
  const stripe = useStripe();
  const [name, setName] = useState('');
  const [postal, setPostal] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      return;
    }

    const cardElement = elements.getElement(CardNumberElement);

    const payload = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name,
        address: {
          postal_code: postal,
        },
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
      <label htmlFor="cardNumber">Card Number</label>
      <CardNumberElement
        id="cardNumber"
        onBlur={logEvent('blur')}
        onChange={logEvent('change')}
        onFocus={logEvent('focus')}
        onReady={logEvent('ready')}
        options={ELEMENT_OPTIONS}
      />
      <label htmlFor="expiry">Card Expiration</label>
      <CardExpiryElement
        id="expiry"
        onBlur={logEvent('blur')}
        onChange={logEvent('change')}
        onFocus={logEvent('focus')}
        onReady={logEvent('ready')}
        options={ELEMENT_OPTIONS}
      />
      <label htmlFor="cvc">CVC</label>
      <CardCvcElement
        id="cvc"
        onBlur={logEvent('blur')}
        onChange={logEvent('change')}
        onFocus={logEvent('focus')}
        onReady={logEvent('ready')}
        options={ELEMENT_OPTIONS}
      />
      <label htmlFor="postal">Postal Code</label>
      <input
        id="postal"
        required
        placeholder="12345"
        value={postal}
        onChange={(e) => {
          setPostal(e.target.value);
        }}
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
