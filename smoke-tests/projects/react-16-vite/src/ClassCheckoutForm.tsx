import React from 'react';
import {ElementsConsumer, CardElement} from '@stripe/react-stripe-js';
import type {Stripe, StripeElements} from '@stripe/stripe-js';

interface InjectedProps {
  stripe: Stripe | null;
  elements: StripeElements | null;
}

class CheckoutFormImpl extends React.Component<InjectedProps, {processing: boolean}> {
  state = {processing: false};

  handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const {stripe, elements} = this.props;
    if (!stripe || !elements) return;
    this.setState({processing: true});
    const cardEl = elements.getElement(CardElement);
    if (cardEl) {
      await stripe.createPaymentMethod({type: 'card', card: cardEl as any});
    }
    this.setState({processing: false});
  };

  render() {
    return (
      <form onSubmit={this.handleSubmit} data-testid="class-checkout">
        <CardElement />
        <button type="submit" disabled={this.state.processing}>Pay</button>
      </form>
    );
  }
}

export const ClassCheckoutForm = () => (
  <ElementsConsumer>
    {({stripe, elements}) => <CheckoutFormImpl stripe={stripe} elements={elements} />}
  </ElementsConsumer>
);
