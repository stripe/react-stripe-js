export const registerWithStripeJs = (stripe: any) => {
  if (!stripe || !stripe._registerWrapper || !stripe.registerAppInfo) {
    return;
  }

  stripe._registerWrapper({name: 'react-stripe-js', version: _VERSION});

  stripe.registerAppInfo({
    name: 'react-stripe-js',
    version: _VERSION,
    url: 'https://stripe.com/docs/stripe-js/react',
  });
};
