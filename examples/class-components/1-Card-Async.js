// @noflow
/* eslint-disable max-classes-per-file, react/destructuring-assignment */

import React from 'react';
import {CardElement, Elements, ElementsConsumer} from '../../src';
import '../styles/common.css';

class MyCheckoutForm extends React.Component {
  handleSubmit = async (event) => {
    // Block native form submission.
    event.preventDefault();

    const {stripe, elements} = this.props;

    // If Stripe has not loaded do nothing.
    if (!stripe || !elements) {
      return;
    }

    // Get a reference to a mounted CardElement. Elements knows how
    // to find your CardElement because there can only ever be one of
    // each type of element.
    const cardElement = elements.getElement(CardElement);

    const {error, paymentMethod} = await stripe.createPaymentMethod({
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
      <form onSubmit={this.handleSubmit}>
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
        <button type="submit">Pay</button>
      </form>
    );
  }
}

const InjectedCheckoutForm = () => {
  return (
    <ElementsConsumer>
      {({elements, stripe}) => (
        <MyCheckoutForm elements={elements} stripe={stripe} />
      )}
    </ElementsConsumer>
  );
};

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      stripe: null,
    };
  }

  componentDidMount() {
    // componentDidMount is only called in browser environments,
    // so this will also work with server side rendering (SSR).

    // You can inject a script tag manually like this, or you can just
    // use the 'async' attribute on the Stripe.js v3 script tag.
    const stripeJs = document.createElement('script');
    stripeJs.src = 'https://js.stripe.com/v3/';
    stripeJs.async = true;
    stripeJs.onload = () => {
      this.setState({
        stripe: window.Stripe('pk_test_6pRNASCoBOKtIshFeQd4XMUh'),
      });
    };
    document.body.appendChild(stripeJs);
  }

  render() {
    const {stripe} = this.state;
    return (
      <Elements stripe={stripe}>
        <InjectedCheckoutForm />
      </Elements>
    );
  }
}

export default App;
