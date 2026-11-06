import {FunctionComponent, PropsWithChildren, ReactNode} from 'react';
import * as stripeJs from '@stripe/stripe-js';

import React from 'react';
import PropTypes from 'prop-types';

import {parseStripeProp} from '../utils/parseStripeProp';
import {PricingContext, PricingState} from './PricingContext';
import {registerWithStripeJs} from '../utils/registerWithStripeJs';
import {usePrevious} from '../utils/usePrevious';
import {normalizeError} from './normalizeError';

export interface PricingProviderProps {
  /**
   * A [Stripe object](https://stripe.com/docs/js/initializing) or a `Promise` resolving to a `Stripe` object.
   * The easiest way to initialize a `Stripe` object is with the the [Stripe.js wrapper module](https://github.com/stripe/stripe-js/blob/master/README.md#readme).
   * Once this prop has been set, it can not be changed.
   *
   * You can also pass in `null` or a `Promise` resolving to `null` if you are performing an initial server-side render or when generating a static site.
   */
  stripe: PromiseLike<stripeJs.Stripe | null> | stripeJs.Stripe | null;
  options: stripeJs.InitializePricingOptions;
}

interface PrivatePricingProviderProps {
  stripe: unknown;
  options: stripeJs.InitializePricingOptions;
  children?: ReactNode;
}

const INVALID_STRIPE_ERROR =
  'Invalid prop `stripe` supplied to `PricingProvider`. We recommend using the `loadStripe` utility from `@stripe/stripe-js`.';

export const PricingProvider: FunctionComponent<
  PropsWithChildren<PricingProviderProps>
> = (({
  stripe: rawStripeProp,
  options,
  children,
}: PrivatePricingProviderProps) => {
  const parsed = React.useMemo(() => {
    const result = parseStripeProp(rawStripeProp, INVALID_STRIPE_ERROR);
    if (result.tag === 'async') {
      // StrictMode can create two derived promises; only one reaches the effect.
      // Observe both so the discarded promise cannot reject unhandled. The
      // retained promise still rejects into the effect's error handler.
      result.stripePromise.catch(() => {});
    }
    return result;
  }, [rawStripeProp]);

  const [state, setState] = React.useState<PricingState>({type: 'loading'});
  const [stripe, setStripe] = React.useState<stripeJs.Stripe | null>(null);

  // We want to lock the options once initialization starts, so they can't be
  // changed. This acts as a signal as to whether initialization has been started.
  const initializedOptionsRef =
    React.useRef<stripeJs.InitializePricingOptions | null>(null);
  const isMountedRef = React.useRef(false);

  // Provide a ref to track whether the component is mounted to avoid
  // setting state on an unmounted component
  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialize the Pricing SDK once when the stripe prop becomes valid for the first time
  React.useEffect(() => {
    if (initializedOptionsRef.current) {
      return undefined;
    }

    let isCurrent = true;

    const handleError = (reason: unknown) => {
      if (isMountedRef.current) {
        const error = normalizeError(reason);
        setState({type: 'error', error});
      }
    };

    const initialize = ({stripe}: {stripe: stripeJs.Stripe}) => {
      if (isCurrent && !initializedOptionsRef.current) {
        initializedOptionsRef.current = options;

        stripe
          .initializePricing(options)
          .then((pricing) => {
            // Initialization may outlive this effect when options change or
            // StrictMode replays effects. Only an actual unmount discards it.
            if (isMountedRef.current) {
              setState({type: 'success', pricing, changeVersion: 0});
            }
          })
          .catch(handleError);
      }
    };

    if (parsed.tag === 'async') {
      parsed.stripePromise
        .then((stripe) => {
          if (!isCurrent) {
            return;
          }
          setStripe(stripe);
          // Allow a null Stripe instance for SSR; initialize only when set.
          if (stripe) {
            initialize({stripe});
          }
        })
        .catch((error) => {
          if (isCurrent) {
            handleError(error);
          }
        });
    } else if (parsed.tag === 'sync') {
      setStripe(parsed.stripe);
      try {
        initialize({stripe: parsed.stripe});
      } catch (error) {
        handleError(error);
      }
    }

    return () => {
      isCurrent = false;
    };
  }, [parsed, options]);

  // When the pricing instance is available, listen to changes so
  // that consumers of the PricingContext can react to updates
  const pricing = state.type === 'success' ? state.pricing : null;
  React.useEffect(() => {
    if (!pricing) {
      return undefined;
    }

    const handleChange = () => {
      setState((current) =>
        current.type === 'success'
          ? {...current, changeVersion: current.changeVersion + 1}
          : current
      );
    };

    pricing.on('change', handleChange);
    return () => {
      pricing.off('change', handleChange);
    };
  }, [pricing]);

  // Warn on changes to props
  const prevStripe = usePrevious(rawStripeProp);
  const prevOptions = usePrevious(options);
  React.useEffect(() => {
    if (prevStripe !== null && prevStripe !== rawStripeProp) {
      console.warn(
        'Unsupported prop change on PricingProvider. You cannot change the `stripe` prop after setting it.'
      );
    }

    // Options can change freely until the call to initializePricing. This
    // also allows options and stripe to become available in the same render.
    if (
      !initializedOptionsRef.current ||
      initializedOptionsRef.current === options
    ) {
      return;
    }

    if (prevOptions.pricingPolicy !== options.pricingPolicy) {
      console.warn(
        'Unsupported prop change on PricingProvider: You cannot change `options.pricingPolicy` after setting it.'
      );
    }

    if (
      prevOptions.detectedCurrencyOverride !== options.detectedCurrencyOverride
    ) {
      console.warn(
        'Unsupported prop change on PricingProvider: You cannot change `options.detectedCurrencyOverride` after setting it.'
      );
    }
  }, [prevStripe, rawStripeProp, prevOptions, options]);

  // Attach react-stripe-js version to stripe.js instance
  React.useEffect(() => {
    registerWithStripeJs(stripe);
  }, [stripe]);

  return (
    <PricingContext.Provider value={state}>{children}</PricingContext.Provider>
  );
}) as FunctionComponent<PropsWithChildren<PricingProviderProps>>;

PricingProvider.propTypes = {
  stripe: PropTypes.any,
  options: PropTypes.shape({
    pricingPolicy: PropTypes.string.isRequired,
    detectedCurrencyOverride: PropTypes.string,
  }).isRequired,
} as PropTypes.ValidationMap<PricingProviderProps>;
