// @noflow

import React, {useState} from 'react';
import {IdealBankElement, Elements, useElements, useStripe} from '../../src';

import {logEvent, Result, ErrorResult} from '../util';
import '../styles/common.css';

const ELEMENT_OPTIONS = {
  classes: {
    base: 'StripeElementIdeal',
    focus: 'StripeElementIdeal--focus',
  },
  style: {
    base: {
      padding: '10px 14px',
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
  const stripe = useStripe();
  const elements = useElements();
  const [name, setName] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (ev) => {
    ev.preventDefault();

    const idealBankElement = elements.getElement(IdealBankElement);

    const payload = await stripe.createPaymentMethod({
      type: 'ideal',
      ideal: idealBankElement,
      billing_details: {
        name,
      },
    });

    if (payload.error) {
      console.log('[error]', payload.error);
      setResult(<ErrorResult>payload.error.message</ErrorResult>);
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
      <label htmlFor="ideal">iDEAL Bank</label>
      <IdealBankElement
        id="ideal"
        onBlur={logEvent('blur')}
        onChange={logEvent('change')}
        onFocus={logEvent('focus')}
        onReady={logEvent('ready')}
        options={ELEMENT_OPTIONS}
      />
      {result}
      <button type="submit">Pay</button>
    </form>
  );
};

const stripe = window.Stripe('pk_test_6pRNASCoBOKtIshFeQd4XMUh');

const App = () => {
  return (
    <Elements stripe={stripe}>
      <Checkout />
    </Elements>
  );
};

export default App;
