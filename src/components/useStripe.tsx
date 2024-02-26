import * as stripeJs from '@stripe/stripe-js';
import {useElementsOrCustomCheckoutSdkContextWithUseCase} from './CustomCheckout';

/**
 * @docs https://stripe.com/docs/stripe-js/react#usestripe-hook
 */
export const useStripe = (): stripeJs.Stripe | null => {
  const {stripe} = useElementsOrCustomCheckoutSdkContextWithUseCase(
    'calls useStripe()'
  );
  return stripe;
};
