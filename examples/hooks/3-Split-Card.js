// @noflow

import React, {useState} from 'react';
import {
  CardNumberElement,
  CardCvcElement,
  CardExpiryElement,
  Elements,
  useElements,
} from '../../src';

import {logEvent, Result, ErrorResult} from '../util';
import '../styles/common.css';

const stripe = window.Stripe('pk_test_6pRNASCoBOKtIshFeQd4XMUh');

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

const Checkout = () => {
  const elements = useElements();
  const [name, setName] = useState('');
  const [postal, setPostal] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (ev) => {
    ev.preventDefault();

    const cardElement = elements.getElement('cardNumber');

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
      setResult(<ErrorResult>{payload.error.message}</ErrorResult>);
    } else {
      console.log('[PaymentMethod]', payload.paymentMethod);
      setResult(<Result>Got PaymentMethod: {payload.paymentMethod.id}</Result>);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="name">Full Name</label>
      <input
        id="name"
        required
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
        value={postal}
        onChange={(e) => {
          setPostal(e.target.value);
        }}
      />
      {result}
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
