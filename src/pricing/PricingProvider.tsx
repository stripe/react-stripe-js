import {FunctionComponent, PropsWithChildren, ReactNode} from 'react';
import type {Stripe} from '@stripe/stripe-js';

import React from 'react';
import PropTypes from 'prop-types';

import {parseStripeProp} from '../utils/parseStripeProp';
import {registerWithStripeJs} from '../utils/registerWithStripeJs';
import {normalizeError, PricingContext, PricingState} from './PricingContext';
import type {
  Pricing,
  PricingProviderOptions,
  PricingProviderProps,
} from './types';

interface PrivatePricingProviderProps {
  stripe: unknown;
  options: PricingProviderOptions;
  children?: ReactNode;
}

type StripeWithPricing = Stripe & {
  initializePricing(options: PricingProviderOptions): Promise<Pricing>;
};

type ImmutableProps = {
  stripe: unknown;
  pricingPolicy: string;
  detectedCurrencyOverride?: string;
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
  const [initializedPricing, setInitializedPricing] =
    React.useState<Pricing | null>(null);
  const initializationRef = React.useRef<Promise<Pricing> | null>(null);
  const initialPropsRef = React.useRef<ImmutableProps | null>(null);
  const pricingPolicy = options.pricingPolicy;
  const detectedCurrencyOverride = options.detectedCurrencyOverride;
  const previousPropsRef = React.useRef<ImmutableProps>({
    stripe: rawStripeProp,
    pricingPolicy,
    detectedCurrencyOverride,
  });

  React.useEffect(() => {
    let isActive = true;

    if (!initializationRef.current) {
      setState((current) =>
        current.type === 'loading' ? current : {type: 'loading'}
      );
    }

    const startInitialization = (stripe: Stripe): Promise<Pricing> => {
      if (!initializationRef.current) {
        initialPropsRef.current = {
          stripe: rawStripeProp,
          pricingPolicy,
          detectedCurrencyOverride,
        };
        initializationRef.current = (async () => {
          registerWithStripeJs(stripe);
          return (stripe as StripeWithPricing).initializePricing(options);
        })();
      }

      return initializationRef.current;
    };

    const loadPricing = async () => {
      try {
        let initialization = initializationRef.current;
        if (!initialization) {
          const stripe =
            parsed.tag === 'async'
              ? await parsed.stripePromise
              : parsed.tag === 'sync'
              ? parsed.stripe
              : null;

          if (!isActive || !stripe) {
            return;
          }

          initialization = startInitialization(stripe);
        }

        const pricing = await initialization;
        if (isActive) {
          setInitializedPricing(pricing);
        }
      } catch (error) {
        if (isActive) {
          setState({type: 'error', error: normalizeError(error)});
        }
      }
    };

    loadPricing();

    return () => {
      isActive = false;
    };
  }, [parsed, rawStripeProp, options, pricingPolicy, detectedCurrencyOverride]);

  React.useEffect(() => {
    if (!initializedPricing) {
      return undefined;
    }

    let isActive = true;
    const handleChange = () => {
      if (isActive) {
        setState((current) =>
          current.type === 'success' && current.pricing === initializedPricing
            ? {...current, changeVersion: current.changeVersion + 1}
            : current
        );
      }
    };

    try {
      initializedPricing.on('change', handleChange);
      setState({
        type: 'success',
        pricing: initializedPricing,
        changeVersion: 0,
      });
    } catch (error) {
      setState({type: 'error', error: normalizeError(error)});
      return undefined;
    }

    return () => {
      isActive = false;
      initializedPricing.off('change', handleChange);
    };
  }, [initializedPricing]);

  React.useEffect(() => {
    const previous = previousPropsRef.current;
    const initial = initialPropsRef.current;
    previousPropsRef.current = {
      stripe: rawStripeProp,
      pricingPolicy,
      detectedCurrencyOverride,
    };

    if (!initial) {
      return;
    }

    if (previous.stripe !== rawStripeProp && initial.stripe !== rawStripeProp) {
      console.warn(
        'Unsupported prop change on PricingProvider: You cannot change the `stripe` prop after initialization has started.'
      );
    }
    if (
      previous.pricingPolicy !== pricingPolicy &&
      initial.pricingPolicy !== pricingPolicy
    ) {
      console.warn(
        'Unsupported prop change on PricingProvider: You cannot change `options.pricingPolicy` after initialization has started.'
      );
    }
    if (
      previous.detectedCurrencyOverride !== detectedCurrencyOverride &&
      initial.detectedCurrencyOverride !== detectedCurrencyOverride
    ) {
      console.warn(
        'Unsupported prop change on PricingProvider: You cannot change `options.detectedCurrencyOverride` after initialization has started.'
      );
    }
  }, [rawStripeProp, pricingPolicy, detectedCurrencyOverride]);

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
