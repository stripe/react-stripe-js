// @noflow

import React from 'react';
import {CardElement, Elements, useElements, useStripe} from '../../src';
import '../styles/common.css';

const MyCheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event) => {
    // Block native form submission.
    event.preventDefault();

    // If Stripe has not loaded do nothing.
    if (!stripe || !elements) {
      return;
    }

    // Get a reference to a mounted CardElement. Elements will know how
    // to find your CardElement since there can only ever be one of
    // each type of element.
    const cardElement = elements.getElement(CardElement);

    // Use your card Element with other Stripe.js APIs
    const {error, paymentMethod} = stripe.createPaymentMethod({
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
      <CardElement
        options={{
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
        }}
      />
      <button type="submit" disabled={!stripe}>
        Pay
      </button>
    </form>
  );
};

const stripePromise = new Promise((resolve) => {
  if (typeof window === 'undefined') {
    // We can also make this work with server side rendering (SSR) by
    // resolving to null when not in a browser environment.
    resolve(null);
  }

  // You can inject a script tag manually like this, or you can just
  // use the 'async' attribute on the Stripe.js v3 script tag.
  const stripeJs = document.createElement('script');
  stripeJs.src = 'https://js.stripe.com/v3/';
  stripeJs.async = true;
  stripeJs.onload = () => {
    resolve(window.Stripe('pk_test_6pRNASCoBOKtIshFeQd4XMUh'));
  };
  document.body.appendChild(stripeJs);
});

const App = () => {
  return (
    <Elements stripe={stripePromise}>
      <MyCheckoutForm />
    </Elements>
  );
};

export default App;
