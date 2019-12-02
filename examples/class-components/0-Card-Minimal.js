// @noflow

import React from 'react';
import {CardElement, Elements, ElementsConsumer} from '../../src';
import '../styles/common.css';

const stripe = window.Stripe('pk_test_6pRNASCoBOKtIshFeQd4XMUh');

class MyCheckoutForm extends React.Component {
  createPaymentMethod = async (cardElement) => {
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
        )}
      </ElementsConsumer>
    );
  }
}

const App = () => {
  return (
    <Elements stripe={stripe}>
      <MyCheckoutForm />
    </Elements>
  );
};

export default App;
