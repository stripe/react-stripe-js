// @noflow

import React from 'react';
import {loadStripe} from '@stripe/stripe-js';
import {IdealBankElement, Elements, ElementsConsumer} from '../../src';

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

class CheckoutForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {name: '', result: null};
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
      this.setState({result: <ErrorResult>payload.error.message</ErrorResult>});
    } else {
      console.log('[PaymentMethod]', payload.paymentMethod);
      this.setState({
        result: <Result>Got PaymentMethod: {payload.paymentMethod.id}</Result>,
      });
    }
  };

  render() {
    const {result, name} = this.state;
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

const stripePromise = loadStripe('pk_test_6pRNASCoBOKtIshFeQd4XMUh');

const App = () => {
  return (
    <Elements stripe={stripePromise}>
      <InjectedCheckoutForm />
    </Elements>
  );
};

export default App;
