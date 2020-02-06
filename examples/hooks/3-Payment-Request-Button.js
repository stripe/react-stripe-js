import React, {useState, useEffect} from 'react';
import {loadStripe} from '@stripe/stripe-js';
import {PaymentRequestButtonElement, Elements, useStripe} from '../../src';

import {Result, ErrorResult} from '../util';
import '../styles/common.css';

const NotAvailableResult = () => (
  <Result>
    <p style={{textAlign: 'center'}}>
      PaymentRequest is not available in your browser.
    </p>
    {window.location.protocol !== 'https:' && (
      <p style={{textAlign: 'center'}}>
        Try using{' '}
        <a href="https://ngrok.com" target="_blank" rel="noopener noreferrer">
          ngrok
        </a>{' '}
        to view this demo over https.
      </p>
    )}
  </Result>
);

const ELEMENT_OPTIONS = {
  style: {
    paymentRequestButton: {
      type: 'buy',
      theme: 'dark',
    },
  },
};

const CheckoutForm = () => {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [notAvailable, setNotAvailable] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);

  useEffect(() => {
    if (!stripe) {
      // We can't create a PaymentRequest until Stripe.js loads.
      return;
    }

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: 'Demo total',
        amount: 100,
      },
    });

    pr.on('paymentmethod', async (event) => {
      setPaymentMethod(event.paymentMethod);
      event.complete('success');
    });

    pr.canMakePayment().then((canMakePaymentRes) => {
      if (canMakePaymentRes) {
        setPaymentRequest(pr);
      } else {
        setNotAvailable(true);
      }
    });
  }, [stripe]);

  return (
    <form>
      {paymentRequest && (
        <PaymentRequestButtonElement
          onClick={(event) => {
            if (paymentMethod) {
              event.preventDefault();
              setErrorMessage(
                'You can only use the PaymentRequest button once. Refresh the page to start over.'
              );
            }
          }}
          options={{
            ...ELEMENT_OPTIONS,
            paymentRequest,
          }}
        />
      )}
      {notAvailable && <NotAvailableResult />}
      {errorMessage && <ErrorResult>{errorMessage}</ErrorResult>}
      {paymentMethod && <Result>Got PaymentMethod: {paymentMethod.id}</Result>}
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
