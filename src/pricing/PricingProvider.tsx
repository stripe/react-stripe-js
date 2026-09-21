import {FunctionComponent, PropsWithChildren, ReactNode} from 'react';
import type {Stripe} from '@stripe/stripe-js';

import React from 'react';
import PropTypes from 'prop-types';

import {parseStripeProp} from '../utils/parseStripeProp';
import {registerWithStripeJs} from '../utils/registerWithStripeJs';
import {usePrevious} from '../utils/usePrevious';
import {normalizeError, PricingContext, PricingState} from './PricingContext';
import type {
  Pricing,
  PricingProviderOptions,
  PricingProviderProps,
} from './types';

interface PrivatePricingProviderProps {
  stripe: unknown;
  options?: PricingProviderOptions;
  children?: ReactNode;
}

type StripeWithPricing = Stripe & {
  __initializePricing(options?: PricingProviderOptions): Promise<Pricing>;
};

const INVALID_STRIPE_ERROR =
  'Invalid prop `stripe` supplied to `PricingProvider`. We recommend using the `loadStripe` utility from `@stripe/stripe-js`. See https://stripe.com/docs/stripe-js/react#elements-props-stripe for details.';

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
      // StrictMode can discard one of two derived promises during render.
      result.stripePromise.catch(() => {});
    }

    return result;
  }, [rawStripeProp]);

  const [state, setState] = React.useState<PricingState>({type: 'loading'});
  const initializationRef = React.useRef<Promise<Pricing> | null>(null);
  const optionsRef = React.useRef(options);
  const initialStripePropRef = React.useRef<unknown>(null);
  const initialCurrencyOverrideRef = React.useRef<string | undefined>(
    undefined
  );
  const detectedCurrencyOverride = options?.detectedCurrencyOverride;

  if (!initializationRef.current) {
    optionsRef.current = options;
  }

  React.useEffect(() => {
    let isActive = true;
    let subscribedPricing: Pricing | null = null;

    const handleChange = () => {
      if (!isActive) {
        return;
      }

      setState((current) => {
        if (current.type !== 'success') {
          return current;
        }

        return {...current, changeVersion: current.changeVersion + 1};
      });
    };

    const handleError = (error: unknown) => {
      if (isActive) {
        setState({type: 'error', error: normalizeError(error)});
      }
    };

    const attachToInitialization = (initialization: Promise<Pricing>) => {
      initialization.then((pricing) => {
        if (!isActive) {
          return;
        }

        try {
          subscribedPricing = pricing;
          pricing.on('change', handleChange);
          setState((current) => {
            if (current.type === 'success' && current.pricing === pricing) {
              return current;
            }

            return {type: 'success', pricing, changeVersion: 0};
          });
        } catch (error) {
          handleError(error);
        }
      }, handleError);
    };

    const initialize = (stripe: Stripe) => {
      if (!isActive) {
        return;
      }

      if (!initializationRef.current) {
        initialStripePropRef.current = rawStripeProp;
        initialCurrencyOverrideRef.current = detectedCurrencyOverride;
        setState({type: 'loading'});

        try {
          registerWithStripeJs(stripe);
          initializationRef.current = Promise.resolve(
            (stripe as StripeWithPricing).__initializePricing(
              optionsRef.current
            )
          );
        } catch (error) {
          initializationRef.current = Promise.reject(error);
        }
      }

      attachToInitialization(initializationRef.current);
    };

    if (initializationRef.current) {
      attachToInitialization(initializationRef.current);
    } else if (parsed.tag === 'async') {
      parsed.stripePromise.then((stripe) => {
        if (stripe) {
          initialize(stripe);
        }
      }, handleError);
    } else if (parsed.tag === 'sync') {
      initialize(parsed.stripe);
    }

    return () => {
      isActive = false;

      if (subscribedPricing) {
        try {
          subscribedPricing.off('change', handleChange);
        } catch (_) {
          // Cleanup errors must not mask an unmount or prop transition.
        }
      }
    };
  }, [parsed, rawStripeProp, detectedCurrencyOverride]);

  const previousStripeProp = usePrevious(rawStripeProp);
  React.useEffect(() => {
    if (
      initializationRef.current &&
      previousStripeProp !== rawStripeProp &&
      initialStripePropRef.current !== rawStripeProp
    ) {
      console.warn(
        'Unsupported prop change on PricingProvider: You cannot change the `stripe` prop after initialization has started.'
      );
    }
  }, [previousStripeProp, rawStripeProp]);

  const previousCurrencyOverride = usePrevious(detectedCurrencyOverride);
  React.useEffect(() => {
    if (
      initializationRef.current &&
      previousCurrencyOverride !== detectedCurrencyOverride &&
      initialCurrencyOverrideRef.current !== detectedCurrencyOverride
    ) {
      console.warn(
        'Unsupported prop change on PricingProvider: You cannot change `options.detectedCurrencyOverride` after initialization has started.'
      );
    }
  }, [previousCurrencyOverride, detectedCurrencyOverride]);

  const contextValue = React.useMemo(() => state, [state]);

  return (
    <PricingContext.Provider value={contextValue}>
      {children}
    </PricingContext.Provider>
  );
}) as FunctionComponent<PropsWithChildren<PricingProviderProps>>;

PricingProvider.propTypes = {
  stripe: PropTypes.any,
  options: PropTypes.shape({
    detectedCurrencyOverride: PropTypes.string,
  }),
} as PropTypes.ValidationMap<PricingProviderProps>;
