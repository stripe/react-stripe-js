// @noflow
/* eslint-disable max-classes-per-file, react/destructuring-assignment */

import React from 'react';
import {CardElement, Elements, ElementsConsumer} from '../../src';
import '../styles/common.css';

const waitForStripe = new Promise((resolve) => {
  if (typeof window === 'undefined') {
    // We can also make this work with server side rendering (SSR) by
    // resolving to null when not in a browser environment.
    resolve(null);
  }
 
  // You can inject a script tag manually like this, or you can just
  // use the 'async' attribute on the Stripe.js v3 <script> tag.
  const stripeJs = document.createElement('script');
  stripeJs.src = 'https://js.stripe.com/v3/';
  stripeJs.async = true;
  stripeJs.onload = () => {
    resolve(window.Stripe('pk_test_6pRNASCoBOKtIshFeQd4XMUh'));
  };

  document.body.appendChild(stripeJs);
});

const ELEMENT_OPTIONS = {
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
};

const MyCardForm = () => (
  <div>
    <label htmlFor="card">Card details</label>
    <CardElement id="card" options={ELEMENT_OPTIONS} />
  </div>
);

class MyCheckoutForm extends React.Component {
  createPaymentMethod = async (cardElement) => {
    const {error, paymentMethod} = this.props.stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      console.log('[error]', error);
    } else {
      console.log('[PaymentMethod]', paymentMethod);
    }
  };

  render() {
    return (
      <ElementsConsumer>
        {(elements) => (
          <form
            onSubmit={(event) => {
              // block native form submission
              event.preventDefault();

              // Get a reference to a mounted CardElement. Elements will know how
              // to find your CardElement since there can only ever be one of
              // each type of element.
              const cardElement = elements.getElement('card');

              this.createPaymentMethod(cardElement);
            }}
          >
            <MyCardForm />
            <button type="submit">Pay</button>
          </form>
        )}
      </ElementsConsumer>
    );
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {stripe: null};
  }

  componentDidMount() {
    waitForStripe.then((stripe) => {
      this.setState({stripe});
    });
  }

  render() {
    return (
      <Elements stripe={this.state.stripe}>
        {this.state.stripe ? (
          <MyCheckoutForm stripe={this.state.stripe} />
        ) : null}
      </Elements>
    );
  }
}

export default App;
