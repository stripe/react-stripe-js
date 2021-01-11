// This example shows you how to set up React Stripe.js and use Elements.
// Learn how to accept an EPS payment using the official Stripe docs.
// https://stripe.com/docs/payments/eps

import React from 'react';
import {loadStripe} from '@stripe/stripe-js';
import {EPSBankElement, Elements, ElementsConsumer} from '../../src';

import {logEvent, Result, ErrorResult} from '../util';
import '../styles/common.css';

const ELEMENT_OPTIONS = {
  classes: {
    base: 'StripeElementEPS',
    focus: 'StripeElementEPS--focus',
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

class CheckoutForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {name: '', errorMessage: null, paymentMethod: null};
  }

  handleSubmit = async (event) => {
    event.preventDefault();

    const {stripe, elements} = this.props;
    const {name} = this.state;

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      return;
    }

    const epsBankElement = elements.getElement(EPSBankElement);

    const payload = await stripe.createPaymentMethod({
      type: 'eps',
      eps: epsBankElement,
      billing_details: {
        name,
      },
    });

    if (payload.error) {
      console.log('[error]', payload.error);
      this.setState({
        errorMessage: payload.error.message,
        paymentMethod: null,
      });
    } else {
      console.log('[PaymentMethod]', payload.paymentMethod);
      this.setState({
        paymentMethod: payload.paymentMethod,
        errorMessage: null,
      });
    }
  };

  render() {
    const {errorMessage, paymentMethod, name} = this.state;
    const {stripe} = this.props;
    return (
      <form onSubmit={this.handleSubmit}>
        <label htmlFor="name">Full Name</label>
        <input
          id="name"
          required
          placeholder="Jenny Rosen"
          value={name}
          onChange={(event) => {
            this.setState({name: event.target.value});
          }}
        />
        <label htmlFor="eps">EPS Bank</label>
        <EPSBankElement
          id="eps"
          onBlur={logEvent('blur')}
          onChange={logEvent('change')}
          onFocus={logEvent('focus')}
          onReady={logEvent('ready')}
          options={ELEMENT_OPTIONS}
        />
        {errorMessage && <ErrorResult>{errorMessage}</ErrorResult>}
        {paymentMethod && (
          <Result>Got PaymentMethod: {paymentMethod.id}</Result>
        )}
        <button type="submit" disabled={!stripe}>
          Pay
        </button>
      </form>
    );
  }
}

const InjectedCheckoutForm = () => (
  <ElementsConsumer>
    {({stripe, elements}) => (
      <CheckoutForm stripe={stripe} elements={elements} />
    )}
  </ElementsConsumer>
);

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe('pk_test_6pRNASCoBOKtIshFeQd4XMUh');

const App = () => {
  return (
    <Elements stripe={stripePromise}>
      <InjectedCheckoutForm />
    </Elements>
  );
};

export default App;
