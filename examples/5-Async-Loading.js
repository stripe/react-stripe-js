// @noflow

import React, {useState, useEffect} from 'react';
import {CardElement, Elements, useElements} from '../src';

import {logEvent, Result, ErrorResult} from './common/util';
import './common/styles.css';

// Load stripe globally, rather than in a hook or a some HOC.
// We only want to load and intantiate Stripe once for our entire app.
const stripePromise = new Promise((resolve) => {
  if (typeof window === 'undefined') {
    // We can also make this work with server side rendering (SSR) by
    // resolving to null when not in a browser environment.
    resolve(null);
  }

  // You can inject a script tag manually like this, or you can just
  // use the 'async' attribute on the Stripe.js v3 <script> tag.
  const stripeJs = document.createElement('script');
  stripeJs.src = 'https://js.stripe.com/v3/';
  stripeJs.async = true;
  stripeJs.onload = () => {
    // The setTimeout lets us pretend that Stripe.js took a long
    // time to load. Take it out of your production code!
    setTimeout(() => {
      resolve(window.Stripe('pk_test_6pRNASCoBOKtIshFeQd4XMUh'));
    }, 500);
  };
  if (document.body) {
    document.body.appendChild(stripeJs);
  }
});

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
  const [result, setResult] = useState(null);

  const handleSubmit = async (ev) => {
    ev.preventDefault();

    const cardElement = elements.getElement('card');
    const stripe = await stripePromise;
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
        options={ELEMENT_OPTIONS}
      />
      {result}
      <button type="submit">Pay</button>
    </form>
  );
};

const App = () => {
  const [stripe, setStripe] = useState(null);

  useEffect(() => {
    stripePromise.then(setStripe);
  }, []);

  return (
    <Elements stripe={stripe}>
      <Checkout />
    </Elements>
  );
};

export default App;
