import React from 'react';
import {Elements} from '@stripe/react-stripe-js';
import {CheckoutForm} from './CheckoutForm';

export const App = ({stripe}: {stripe: any}) => (
  <Elements stripe={stripe} options={{mode: 'payment', amount: 1099, currency: 'usd'}}>
    <CheckoutForm />
  </Elements>
);
