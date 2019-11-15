// @noflow

import React, {useState} from 'react';
import {IbanElement, Elements, useElements} from '../src';

import {logEvent, Result, ErrorResult} from './common/util';
import './common/styles.css';

const stripe = window.Stripe('pk_test_6pRNASCoBOKtIshFeQd4XMUh');

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

const Checkout = () => {
  const elements = useElements();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (ev) => {
    ev.preventDefault();

    const ibanElement = elements.getElement('iban');

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
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
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
