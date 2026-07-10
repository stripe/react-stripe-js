import {Elements} from '@stripe/react-stripe-js';
import {CheckoutForm} from './CheckoutForm';
export const App = ({stripe}: {stripe: any}) => (
  <Elements stripe={stripe}><CheckoutForm /></Elements>
);
