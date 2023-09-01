import * as stripeJs from '@stripe/stripe-js';
import {isStripe, isPromise} from '../utils/guards';

const INVALID_STRIPE_ERROR =
  'Invalid prop `stripe` supplied to `Elements`. We recommend using the `loadStripe` utility from `@stripe/stripe-js`. See https://stripe.com/docs/stripe-js/react#elements-props-stripe for details.';

// We are using types to enforce the `stripe` prop in this lib, but in a real
// integration `stripe` could be anything, so we need to do some sanity
// validation to prevent type errors.
const validateStripe = (maybeStripe: unknown): null | stripeJs.Stripe => {
  if (maybeStripe === null || isStripe(maybeStripe)) {
    return maybeStripe;
  }

  throw new Error(INVALID_STRIPE_ERROR);
};

type ParsedStripeProp =
  | {tag: 'empty'}
  | {tag: 'sync'; stripe: stripeJs.Stripe}
  | {tag: 'async'; stripePromise: Promise<stripeJs.Stripe | null>};

export const parseStripeProp = (raw: unknown): ParsedStripeProp => {
  if (isPromise(raw)) {
    return {
      tag: 'async',
      stripePromise: Promise.resolve(raw).then(validateStripe),
    };
  }

  const stripe = validateStripe(raw);

  if (stripe === null) {
    return {tag: 'empty'};
  }

  return {tag: 'sync', stripe};
};
