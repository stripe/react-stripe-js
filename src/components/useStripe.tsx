import * as stripeJs from '@stripe/stripe-js';
import {useElementsOrCheckoutContextWithUseCase} from '../checkout/components/CheckoutContext';

/**
 * @docs https://stripe.com/docs/stripe-js/react#usestripe-hook
 */
export const useStripe = (): stripeJs.Stripe | null => {
  const {stripe} = useElementsOrCheckoutContextWithUseCase('calls useStripe()');
  return stripe;
};
