// @flow
/* eslint-disable no-console, react/no-multi-comp */
import React, {useEffect, useState} from 'react';

import {CardElement, Elements, useElements} from '../../src/index';

// Load stripe globally, rather than in a hook or a some HOC.
// We only want to load and intantiate Stripe once for our entire app.

const stripePromise: Promise<StripeShape | null> = new Promise((resolve) => {
  if (typeof window === `undefined`) {
    // SSR safety. Resolve to null when not in a browser environment.
    resolve(null);
  }

  // You can inject a script tag manually like this,
  // or you can use the 'async' attribute on the Stripe.js v3 <script> tag.
  const stripeJs = document.createElement('script');
  stripeJs.src = 'https://js.stripe.com/v3/';
  stripeJs.async = true;
  stripeJs.onload = () => {
    // The setTimeout lets us pretend that Stripe.js took a long time to load
    // Take it out of your production code!
    setTimeout(() => {
      resolve(window.Stripe('pk_test_6pRNASCoBOKtIshFeQd4XMUh'));
    }, 500);
  };
  if (document.body) {
    document.body.appendChild(stripeJs);
  }
});

// Wrap our Stripe loading Promise in a convenient hook.
const useStripe = () => {
  const [stripe, setStripe] = useState(null);

  useEffect(() => {
    stripePromise.then(setStripe);
  }, []); // run effect only once

  return stripe;
};

const handleBlur = () => {
  console.log('[blur]');
};
const handleChange = (change) => {
  console.log('[change]', change);
};
const handleFocus = () => {
  console.log('[focus]');
};
const handleReady = () => {
  console.log('[ready]');
};

const CardForm = () => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (stripe && elements) {
      const cardElement = elements.getElement('card');
      if (cardElement) {
        stripe
          .createToken(cardElement)
          .then((payload) => console.log('[token]', payload));
      }
    } else {
      console.log('Form submitted before Stripe.js loaded.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="card">Card details</label>
      <CardElement
        id="card"
        onBlur={handleBlur}
        onChange={handleChange}
        onFocus={handleFocus}
        onReady={handleReady}
        options={{
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
        }}
      />
      <button type="submit" disabled={!stripe}>
        {!stripe ? 'loading...' : 'Pay'}
      </button>
    </form>
  );
};

const Checkout = () => {
  return (
    <div className="Checkout">
      <CardForm />
    </div>
  );
};

const App = () => {
  const stripe = useStripe();
  return (
    <Elements stripe={stripe}>
      <Checkout />
    </Elements>
  );
};

export default App;
