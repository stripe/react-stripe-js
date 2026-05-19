import * as stripeJs from '@stripe/stripe-js';

export const registerWithStripeJs = (stripe: stripeJs.Stripe | null) => {
  const candidate = stripe as
    | (stripeJs.Stripe & {
        _registerWrapper?: (wrapper: {name: string; version: string}) => void;
      })
    | null;

  if (!candidate || !candidate._registerWrapper || !candidate.registerAppInfo) {
    return;
  }

  candidate._registerWrapper({name: 'react-stripe-js', version: _VERSION});

  candidate.registerAppInfo({
    name: 'react-stripe-js',
    version: _VERSION,
    url: 'https://stripe.com/docs/stripe-js/react',
  });
};
