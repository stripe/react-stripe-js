import React from 'react';
import {Elements} from '@stripe/react-stripe-js';
import {CheckoutForm} from './CheckoutForm';

interface AppProps {
  stripe: any;
}

export const App = ({stripe}: AppProps) => (
  <Elements stripe={stripe} options={{mode: 'payment', amount: 1099, currency: 'usd'}}>
    <CheckoutForm />
  </Elements>
);
