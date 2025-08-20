import * as stripeJs from '@stripe/stripe-js';
import {useElementsOrCheckoutSdkContextWithUseCase} from '../checkout/components/CheckoutProvider';

/**
 * @docs https://stripe.com/docs/stripe-js/react#usestripe-hook
 */
export const useStripe = (): stripeJs.Stripe | null => {
  const {stripe} = useElementsOrCheckoutSdkContextWithUseCase(
    'calls useStripe()'
  );
  return stripe;
};
