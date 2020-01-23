// @noflow

import React from 'react';
import {loadStripe} from '@stripe/stripe-js';
import {
  PaymentRequestButtonElement,
  Elements,
  ElementsConsumer,
} from '../../src';

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

class CheckoutForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      canMakePayment: false,
      hasCheckedAvailability: false,
      errorMessage: null,
    };
  }

  async componentDidUpdate() {
    const {stripe} = this.props;

    if (stripe && !this.paymentRequest) {
      // Create PaymentRequest after Stripe.js loads.
      this.createPaymentRequest(stripe);
    }
  }

  async createPaymentRequest(stripe) {
    this.paymentRequest = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: 'Demo total',
        amount: 100,
      },
    });

    this.paymentRequest.on('paymentmethod', async (event) => {
      this.setState({paymentMethod: event.paymentMethod});
      event.complete('success');
    });

    const canMakePaymentRes = await this.paymentRequest.canMakePayment();
    if (canMakePaymentRes) {
      this.setState({canMakePayment: true, hasCheckedAvailability: true});
    } else {
      this.setState({canMakePayment: false, hasCheckedAvailability: true});
    }
  }

  render() {
    const {
      canMakePayment,
      hasCheckedAvailability,
      errorMessage,
      paymentMethod,
    } = this.state;
    return (
      <form>
        {canMakePayment && (
          <PaymentRequestButtonElement
            onClick={(event) => {
              if (paymentMethod) {
                event.preventDefault();
                this.setState({
                  errorMessage:
                    'You can only use the PaymentRequest button once. Refresh the page to start over.',
                });
              }
            }}
            options={{
              ...ELEMENT_OPTIONS,
              paymentRequest: this.paymentRequest,
            }}
          />
        )}
        {!canMakePayment && hasCheckedAvailability && <NotAvailableResult />}
        {errorMessage && <ErrorResult>{errorMessage}</ErrorResult>}
        {paymentMethod && (
          <Result>Got PaymentMethod: {paymentMethod.id}</Result>
        )}
      </form>
    );
  }
}

const InjectedCheckoutForm = () => (
  <ElementsConsumer>
    {({stripe}) => <CheckoutForm stripe={stripe} />}
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
