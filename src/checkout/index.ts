export {
  useCheckout,
  CheckoutProvider,
  CheckoutState,
} from './components/CheckoutProvider';
export type {
  CurrencySelectorElementProps,
  CurrencySelectorElementComponent,
} from './types';
import createElementComponent from '../components/createElementComponent';
import {isServer} from '../utils/isServer';
import type {CurrencySelectorElementComponent} from './types';

/**
 * Requires beta access:
 * Contact [Stripe support](https://support.stripe.com/) for more information.
 */
export const CurrencySelectorElement: CurrencySelectorElementComponent = createElementComponent(
  'currencySelector',
  isServer
);