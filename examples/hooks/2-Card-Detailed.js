// @noflow

import React, {useState} from 'react';
import {CardElement, Elements, useElements} from '../../src';

import {logEvent, Result, ErrorResult, useDynamicFontSize} from '../util';
import '../styles.css';

const stripe = window.Stripe('pk_test_6pRNASCoBOKtIshFeQd4XMUh');

const getOptions = (fontSize) => ({
  style: {
    base: {
      fontSize,
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
});

const Checkout = () => {
  const elements = useElements();
  const [name, setName] = useState('');
  const [result, setResult] = useState(null);
  const fontSize = useDynamicFontSize();

  const handleSubmit = async (ev) => {
    ev.preventDefault();

    const cardElement = elements.getElement('card');

    const payload = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name,
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
      <label htmlFor="card">Card details</label>
      <CardElement
        id="card"
        onBlur={logEvent('blur')}
        onChange={logEvent('change')}
        onFocus={logEvent('focus')}
        onReady={logEvent('ready')}
        options={getOptions(fontSize)}
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
