// smoke-tests/projects/react-19-vite/src/App.tsx
import React from 'react';
import {Elements} from '@stripe/react-stripe-js';
import {CheckoutForm} from './CheckoutForm';

// In real usage: import {loadStripe} from '@stripe/stripe-js';
// const stripePromise = loadStripe(process.env.VITE_STRIPE_PK!);
// Here we accept a stripe prop for testability
interface AppProps {
  stripe: any;
}
export const App = ({stripe}: AppProps) => (
  <Elements stripe={stripe} options={{mode: 'payment', amount: 1099, currency: 'usd'}}>
    <CheckoutForm />
  </Elements>
);
