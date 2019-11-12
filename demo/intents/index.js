// @flow
/* eslint-disable no-console, react/no-multi-comp */
import React, {useState, useEffect} from 'react';
import {render} from 'react-dom';

import {CardElement, Elements, useElements} from '../../src/index';

import api from './api';
import useDynamicFontSize from '../useDynamicFontSize';

const stripe = window.Stripe('pk_test_6pRNASCoBOKtIshFeQd4XMUh');

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

const createOptions = (fontSize: string, padding: ?string) => {
  return {
    style: {
      base: {
        fontSize,
        color: '#424770',
        letterSpacing: '0.025em',
        fontFamily: 'Source Code Pro, monospace',
        '::placeholder': {
          color: '#aab7c4',
        },
        ...(padding ? {padding} : {}),
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };
};

const CreatePaymentMethod = ({fontSize}: {fontSize: string}) => {
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const elements = useElements();

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (stripe && elements) {
      const cardElement = elements.getElement('card');
      if (cardElement) {
        setProcessing(true);
        stripe
          .createPaymentMethod({type: 'card', card: cardElement})
          .then((payload) => {
            setProcessing(false);
            if (payload.error) {
              setError(
                `Failed to create PaymentMethod: ${String(
                  payload.error.message
                )}`
              );
              console.log('[error]', payload.error);
            } else {
              setMessage(
                `Created PaymentMethod: ${String(payload.paymentMethod.id)}`
              );
              console.log('[paymentMethod]', payload.paymentMethod);
            }
          });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        stripe.createPaymentMethod
        <CardElement
          onBlur={handleBlur}
          onChange={handleChange}
          onFocus={handleFocus}
          onReady={handleReady}
          options={createOptions(fontSize)}
        />
      </label>
      {error && <div className="error">{error}</div>}
      {message && <div className="message">{message}</div>}
      <button type="submit" disabled={processing}>
        {processing ? 'Processing…' : 'Create'}
      </button>
    </form>
  );
};

const ConfirmCardPayment = ({fontSize}: {fontSize: string}) => {
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState(null);
  const [error, setError] = useState(null);
  const [disabled, setDisabled] = useState(true);
  const [succeeded, setSucceeded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api
      .createPaymentIntent({
        amount: 1099,
        currency: 'usd',
        payment_method_types: ['card'],
      })
      .then((cs) => {
        setClientSecret(cs);
        setDisabled(false);
      })
      .catch((err) => {
        setError(err.messag);
      });
  }, []);

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (stripe && elements && clientSecret) {
      const cardElement = elements.getElement('card');
      setDisabled(true);
      setProcessing(true);
      stripe
        .confirmCardPayment(clientSecret, {
          payment_method: {card: cardElement},
        })
        .then((payload) => {
          if (payload.error) {
            setError(`Charge failed: ${payload.error.message}`);
            setDisabled(false);
            console.log('[error]', payload.error);
          } else {
            setMessage(
              `Charge succeeded! PaymentIntent is in state: ${String(
                payload.paymentIntent.status
              )}`
            );
            setSucceeded(true);

            console.log('[PaymentIntent]', payload.paymentIntent);
          }
        });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        stripe.confirmCardPayment
        <CardElement
          onBlur={handleBlur}
          onChange={handleChange}
          onFocus={handleFocus}
          onReady={handleReady}
          options={createOptions(fontSize)}
        />
      </label>
      {error && <div className="error">{error}</div>}
      {message && <div className="message">{message}</div>}
      {!succeeded && (
        <button type="submit" disabled={disabled}>
          {processing ? 'Processing…' : 'Pay'}
        </button>
      )}
    </form>
  );
};

const ConfirmCardSetup = ({fontSize}: {fontSize: string}) => {
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState(null);
  const [error, setError] = useState(null);
  const [disabled, setDisabled] = useState(true);
  const [succeeded, setSucceeded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api
      .createSetupIntent({
        payment_method_types: ['card'],
      })
      .then((cs) => {
        setClientSecret(cs);
        setDisabled(false);
      })
      .catch((err) => {
        setError(err.messag);
      });
  }, []);

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (stripe && elements && clientSecret) {
      const cardElement = elements.getElement('card');
      setDisabled(true);
      setProcessing(true);
      stripe
        .confirmCardSetup(clientSecret, {
          payment_method: {card: cardElement},
        })
        .then((payload) => {
          if (payload.error) {
            setError(`Setup failed: ${payload.error.message}`);
            setDisabled(false);
            console.log('[error]', payload.error);
          } else {
            setMessage(
              `Setup succeeded! SetupIntent is in state: ${String(
                payload.paymentIntent.status
              )}`
            );
            setSucceeded(true);

            console.log('[SetupIntent]', payload.paymentIntent);
          }
        });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        stripe.confirmCardSetup
        <CardElement
          onBlur={handleBlur}
          onChange={handleChange}
          onFocus={handleFocus}
          onReady={handleReady}
          options={createOptions(fontSize)}
        />
      </label>
      {error && <div className="error">{error}</div>}
      {message && <div className="message">{message}</div>}
      {!succeeded && (
        <button type="submit" disabled={disabled}>
          {processing ? 'Processing…' : 'Setup Card'}
        </button>
      )}
    </form>
  );
};

const App = () => {
  const elementFontSize = useDynamicFontSize();

  return (
    <div className="Checkout">
      <h1>React Stripe Elements with Payment Intents</h1>
      <Elements stripe={stripe}>
        <CreatePaymentMethod fontSize={elementFontSize} />
      </Elements>
      <Elements stripe={stripe}>
        <ConfirmCardPayment fontSize={elementFontSize} />
      </Elements>
      <Elements stripe={stripe}>
        <ConfirmCardSetup fontSize={elementFontSize} />
      </Elements>
    </div>
  );
};

const appElement = document.querySelector('.App');
if (appElement) {
  render(<App />, appElement);
} else {
  console.error(
    'We could not find an HTML element with a class name of "App" in the DOM. Please make sure you copy index.html as well for this demo to work.'
  );
}
