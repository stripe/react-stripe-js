// @flow
/* eslint-disable no-console, react/no-multi-comp */
import React, {useState, useEffect} from 'react';
import {render} from 'react-dom';

import {
  CardElement,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  PaymentRequestButtonElement,
  IbanElement,
  IdealBankElement,
  Elements,
  useElements,
} from '../../src/index';
import useDynamicFontSize from '../useDynamicFontSize';

const stripe = window.Stripe('pk_test_6pRNASCoBOKtIshFeQd4XMUh');

const handleBlur = () => {
  console.log('[blur]');
};
const handleChange = (change) => {
  console.log('[change]', change);
};
const handleClick = () => {
  console.log('[click]');
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

const CardForm = ({fontSize}: {fontSize: string}) => {
  const elements = useElements();

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (stripe && elements) {
      const cardNumber = elements.getElement('card');
      if (cardNumber) {
        stripe
          .createToken(cardNumber)
          .then((payload) => console.log('[token]', payload));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Card details
        <CardElement
          onBlur={handleBlur}
          onChange={handleChange}
          onFocus={handleFocus}
          onReady={handleReady}
          options={createOptions(fontSize)}
        />
      </label>
      <button type="submit">Pay</button>
    </form>
  );
};

const SplitForm = ({fontSize}: {fontSize: string}) => {
  const elements = useElements();

  const handleSubmit = (ev) => {
    if (stripe && elements) {
      ev.preventDefault();
      const cardNumber = elements.getElement('cardNumber');
      if (cardNumber) {
        stripe
          .createToken(cardNumber)
          .then((payload) => console.log('[token]', payload));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Card number
        <CardNumberElement
          onBlur={handleBlur}
          onChange={handleChange}
          onFocus={handleFocus}
          onReady={handleReady}
          options={createOptions(fontSize)}
        />
      </label>
      <label>
        Expiration date
        <CardExpiryElement
          onBlur={handleBlur}
          onChange={handleChange}
          onFocus={handleFocus}
          onReady={handleReady}
          options={createOptions(fontSize)}
        />
      </label>
      <label>
        CVC
        <CardCvcElement
          onBlur={handleBlur}
          onChange={handleChange}
          onFocus={handleFocus}
          onReady={handleReady}
          options={createOptions(fontSize)}
        />
      </label>
      <button type="submit">Pay</button>
    </form>
  );
};

const PaymentRequestForm = () => {
  const [paymentRequest, setPaymentRequest] = useState(null);

  useEffect(() => {
    if (stripe) {
      const pr = stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: {
          label: 'Demo total',
          amount: 1000,
        },
      });

      pr.on('token', ({complete, token, ...data}) => {
        console.log('Received Stripe token: ', token);
        console.log('Received customer information: ', data);
        complete('success');
      });

      pr.canMakePayment().then((res) => {
        if (res) {
          setPaymentRequest(pr);
        }
      });
    }
  }, []);

  return paymentRequest ? (
    <form>
      <PaymentRequestButtonElement
        className="PaymentRequestButton"
        onBlur={handleBlur}
        onClick={handleClick}
        onFocus={handleFocus}
        onReady={handleReady}
        options={{
          paymentRequest,
          style: {
            paymentRequestButton: {
              theme: 'dark',
              height: '64px',
              type: 'donate',
            },
          },
        }}
      />
    </form>
  ) : null;
};

const IbanForm = ({fontSize}: {fontSize: string}) => {
  const elements = useElements();

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (stripe && elements) {
      const iban = elements.getElement('iban');
      if (iban) {
        stripe
          .createPaymentMethod({
            type: 'sepa_debit',
            sepa_debit: iban,
            billing_details: {
              name: ev.target.name.value,
              email: ev.target.email.value,
            },
          })
          .then((payload) => console.log('[paymentMethod]', payload));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Name
        <input name="name" type="text" placeholder="Jane Doe" required />
      </label>
      <label>
        Email
        <input
          name="email"
          type="email"
          placeholder="jane.doe@example.com"
          required
        />
      </label>
      <label>
        IBAN
        <IbanElement
          onBlur={handleBlur}
          onChange={handleChange}
          onFocus={handleFocus}
          onReady={handleReady}
          options={{
            supportedCountries: ['SEPA'],
            ...createOptions(fontSize),
          }}
        />
      </label>
      <button type="submit">Pay</button>
    </form>
  );
};

const IdealBankForm = ({fontSize}: {fontSize: string}) => {
  const elements = useElements();

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (stripe && elements) {
      const idealBankElement = elements.getElement('idealBank');
      if (idealBankElement) {
        stripe
          .createPaymentMethod({
            type: 'ideal',
            ideal: idealBankElement,
            billing_details: {
              name: ev.target.name.value,
            },
          })
          .then((payload) => console.log('[paymentMethod]', payload));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Name
        <input name="name" type="text" placeholder="Jane Doe" required />
      </label>
      <label>
        iDEAL Bank
        <IdealBankElement
          className="IdealBankElement"
          onBlur={handleBlur}
          onChange={handleChange}
          onFocus={handleFocus}
          onReady={handleReady}
          options={createOptions(fontSize, '10px 14px')}
        />
      </label>
      <button type="submit">Pay</button>
    </form>
  );
};

const App = () => {
  const elementFontSize = useDynamicFontSize();

  return (
    <div className="Checkout">
      <h1>Available Elements</h1>
      <Elements stripe={stripe}>
        <CardForm fontSize={elementFontSize} />
      </Elements>
      <Elements stripe={stripe}>
        <SplitForm fontSize={elementFontSize} />
      </Elements>
      <Elements stripe={stripe}>
        <PaymentRequestForm />
      </Elements>
      <Elements stripe={stripe}>
        <IbanForm fontSize={elementFontSize} />
      </Elements>
      <Elements stripe={stripe}>
        <IdealBankForm fontSize={elementFontSize} />
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
