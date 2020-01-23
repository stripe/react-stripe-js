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
    this.state = {paymentRequest: null, result: null};
  }

  async componentDidMount() {
    const {stripe} = this.props;

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
      const {id} = event.paymentMethod;
      this.setState({result: <Result>Got PaymentMethod: {id}</Result>});
      event.complete('success');
    });

    const canMakePaymentRes = await pr.canMakePayment();
    if (canMakePaymentRes) {
      this.setState({paymentRequest: pr});
    } else {
      this.setState({result: <NotAvailableResult />});
    }
  }

  render() {
    const {paymentRequest, result} = this.state;
    return (
      <form>
        {paymentRequest && (
          <PaymentRequestButtonElement
            onClick={(event) => {
              if (result) {
                event.preventDefault();
                this.setState({
                  result: (
                    <ErrorResult>
                      You can only use the PaymentRequest button once. Refresh
                      the page to start over.
                    </ErrorResult>
                  ),
                });
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
