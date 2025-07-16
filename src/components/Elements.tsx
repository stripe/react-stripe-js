// Must use `import *` or named imports for React's types
import {
  FunctionComponent,
  PropsWithChildren,
  ReactElement,
  ReactNode,
} from 'react';
import * as stripeJs from '@stripe/stripe-js';

import React from 'react';
import PropTypes from 'prop-types';

import {usePrevious} from '../utils/usePrevious';
import {
  extractAllowedOptionsUpdates,
  UnknownOptions,
} from '../utils/extractAllowedOptionsUpdates';
import {parseStripeProp} from '../utils/parseStripeProp';
import {registerWithStripeJs} from '../utils/registerWithStripeJs';

export interface ElementsContextValue {
  elements: stripeJs.StripeElements | null;
  stripe: stripeJs.Stripe | null;
}

export const ElementsContext = React.createContext<ElementsContextValue | null>(
  null
);
ElementsContext.displayName = 'ElementsContext';

export const parseElementsContext = (
  ctx: ElementsContextValue | null,
  useCase: string
): ElementsContextValue => {
  if (!ctx) {
    throw new Error(
      `Could not find Elements context; You need to wrap the part of your app that ${useCase} in an <Elements> provider.`
    );
  }

  return ctx;
};

interface ElementsProps {
  /**
   * A [Stripe object](https://stripe.com/docs/js/initializing) or a `Promise` resolving to a `Stripe` object.
   * The easiest way to initialize a `Stripe` object is with the the [Stripe.js wrapper module](https://github.com/stripe/stripe-js/blob/master/README.md#readme).
   * Once this prop has been set, it can not be changed.
   *
   * You can also pass in `null` or a `Promise` resolving to `null` if you are performing an initial server-side render or when generating a static site.
   */
  stripe: PromiseLike<stripeJs.Stripe | null> | stripeJs.Stripe | null;

  /**
   * Optional [Elements configuration options](https://stripe.com/docs/js/elements_object/create).
   * Once the stripe prop has been set, these options cannot be changed.
   */
  options?: stripeJs.StripeElementsOptions;
}

interface PrivateElementsProps {
  stripe: unknown;
  options?: UnknownOptions;
  children?: ReactNode;
}

/**
 * The `Elements` provider allows you to use [Element components](https://stripe.com/docs/stripe-js/react#element-components) and access the [Stripe object](https://stripe.com/docs/js/initializing) in any nested component.
 * Render an `Elements` provider at the root of your React app so that it is available everywhere you need it.
 *
 * To use the `Elements` provider, call `loadStripe` from `@stripe/stripe-js` with your publishable key.
 * The `loadStripe` function will asynchronously load the Stripe.js script and initialize a `Stripe` object.
 * Pass the returned `Promise` to `Elements`.
 *
 * @docs https://docs.stripe.com/sdks/stripejs-react?ui=elements#elements-provider
 */
export const Elements: FunctionComponent<PropsWithChildren<ElementsProps>> = (({
  stripe: rawStripeProp,
  options,
  children,
}: PrivateElementsProps) => {
  const parsed = React.useMemo(() => parseStripeProp(rawStripeProp), [
    rawStripeProp,
  ]);

  // For a sync stripe instance, initialize into context
  const [ctx, setContext] = React.useState<ElementsContextValue>(() => ({
    stripe: parsed.tag === 'sync' ? parsed.stripe : null,
    elements: parsed.tag === 'sync' ? parsed.stripe.elements(options) : null,
  }));

  React.useEffect(() => {
    let isMounted = true;

    const safeSetContext = (stripe: stripeJs.Stripe) => {
      setContext((ctx) => {
        // no-op if we already have a stripe instance (https://github.com/stripe/react-stripe-js/issues/296)
        if (ctx.stripe) return ctx;
        return {
          stripe,
          elements: stripe.elements(options),
        };
      });
    };

    // For an async stripePromise, store it in context once resolved
    if (parsed.tag === 'async' && !ctx.stripe) {
      parsed.stripePromise.then((stripe) => {
        if (stripe && isMounted) {
          // Only update Elements context if the component is still mounted
          // and stripe is not null. We allow stripe to be null to make
          // handling SSR easier.
          safeSetContext(stripe);
        }
      });
    } else if (parsed.tag === 'sync' && !ctx.stripe) {
      // Or, handle a sync stripe instance going from null -> populated
      safeSetContext(parsed.stripe);
    }

    return () => {
      isMounted = false;
    };
  }, [parsed, ctx, options]);

  // Warn on changes to stripe prop
  const prevStripe = usePrevious(rawStripeProp);
  React.useEffect(() => {
    if (prevStripe !== null && prevStripe !== rawStripeProp) {
      console.warn(
        'Unsupported prop change on Elements: You cannot change the `stripe` prop after setting it.'
      );
    }
  }, [prevStripe, rawStripeProp]);

  // Apply updates to elements when options prop has relevant changes
  const prevOptions = usePrevious(options);
  React.useEffect(() => {
    if (!ctx.elements) {
      return;
    }

    const updates = extractAllowedOptionsUpdates(options, prevOptions, [
      'clientSecret',
      'fonts',
    ]);

    if (updates) {
      ctx.elements.update(updates);
    }
  }, [options, prevOptions, ctx.elements]);

  // Attach react-stripe-js version to stripe.js instance
  React.useEffect(() => {
    registerWithStripeJs(ctx.stripe);
  }, [ctx.stripe]);

  return (
    <ElementsContext.Provider value={ctx}>{children}</ElementsContext.Provider>
  );
}) as FunctionComponent<PropsWithChildren<ElementsProps>>;

Elements.propTypes = {
  stripe: PropTypes.any,
  options: PropTypes.object as any,
};

export const useElementsContextWithUseCase = (
  useCaseMessage: string
): ElementsContextValue => {
  const ctx = React.useContext(ElementsContext);
  return parseElementsContext(ctx, useCaseMessage);
};

/**
 * @docs https://stripe.com/docs/stripe-js/react#useelements-hook
 */
export const useElements = (): stripeJs.StripeElements | null => {
  const {elements} = useElementsContextWithUseCase('calls useElements()');
  return elements;
};

interface ElementsConsumerProps {
  children: (props: ElementsContextValue) => ReactNode;
}

/**
 * @docs https://stripe.com/docs/stripe-js/react#elements-consumer
 */
export const ElementsConsumer: FunctionComponent<ElementsConsumerProps> = ({
  children,
}) => {
  const ctx = useElementsContextWithUseCase('mounts <ElementsConsumer>');

  // Assert to satisfy the busted React.FC return type (it should be ReactNode)
  return children(ctx) as ReactElement | null;
};

ElementsConsumer.propTypes = {
  children: PropTypes.func.isRequired,
};
