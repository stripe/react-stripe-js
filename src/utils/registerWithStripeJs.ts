import * as stripeJs from '@stripe/stripe-js';

export const registerWithStripeJs = (stripe: stripeJs.Stripe | null) => {
  if (
    !stripe ||
    !('_registerWrapper' in stripe) ||
    typeof stripe._registerWrapper !== 'function' ||
    typeof stripe.registerAppInfo !== 'function'
  ) {
    return;
  }

  stripe._registerWrapper({name: 'react-stripe-js', version: _VERSION});

  stripe.registerAppInfo({
    name: 'react-stripe-js',
    version: _VERSION,
    url: 'https://stripe.com/docs/stripe-js/react',
  });
};
