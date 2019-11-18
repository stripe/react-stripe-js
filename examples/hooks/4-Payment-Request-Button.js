// @noflow

import React, {useState, useEffect} from 'react';
import {PaymentRequestButtonElement, Elements} from '../../src';

import {logEvent, Result, ErrorResult} from '../util';
import '../styles/common.css';

const stripe = window.Stripe('pk_test_6pRNASCoBOKtIshFeQd4XMUh');

const ELEMENT_OPTIONS = {
  style: {
    paymentRequestButton: {
      type: 'buy',
      theme: 'dark',
    },
  },
};

const Checkout = () => {
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: 'Demo total',
        amount: 100,
      },
    });

    pr.on('paymentmethod', async (e) => {
      logEvent('[PaymentMethod]', e.paymentMethod);
      setResult(<Result>Got PaymentMethod: {e.paymentMethod.id}</Result>);
      e.complete('success');
    });

    pr.canMakePayment().then((canMakePaymentRes) => {
      if (canMakePaymentRes) {
        setPaymentRequest(pr);
      } else {
        setResult(
          <Result>
            <p style={{textAlign: 'center'}}>
              PaymentRequest is not available in your browser.{' '}
            </p>
            {window.location.protocol !== 'https:' && (
              <p style={{textAlign: 'center'}}>
                Try using{' '}
                <a
                  href="https://ngrok.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ngrok
                </a>{' '}
                to view this demo over https.
              </p>
            )}
          </Result>
        );
      }
    });
  }, []);

  return (
    <form>
      {paymentRequest && (
        <PaymentRequestButtonElement
          id="cardNumber"
          onBlur={logEvent('blur')}
          onChange={logEvent('change')}
          onFocus={logEvent('focus')}
          onReady={logEvent('ready')}
          onClick={(e) => {
            if (result) {
              e.preventDefault();
              setResult(
                <ErrorResult>
                  You can only use the PaymentRequest button once. Refresh the
                  page to start over.
                </ErrorResult>
              );
            }
          }}
          options={{
            ...ELEMENT_OPTIONS,
            paymentRequest,
          }}
        />
      )}
      {result}
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
