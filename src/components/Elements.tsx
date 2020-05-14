// Must use `import *` or named imports for React's types
import {FunctionComponent, ReactElement, ReactNode} from 'react';
import * as stripeJs from '@stripe/stripe-js';

import React from 'react';
import PropTypes from 'prop-types';

import {isEqual} from '../utils/isEqual';
import {usePromiseResolver} from '../utils/usePromiseResolver';
import {isStripe} from '../utils/guards';

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

interface ElementsContextValue {
  elements: stripeJs.StripeElements | null;
  stripe: stripeJs.Stripe | null;
}

const ElementsContext = React.createContext<ElementsContextValue | null>(null);
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

const createElementsContext = (stripe: stripeJs.Stripe | null, options?: stripeJs.StripeElementsOptions) => {
  const elements = stripe ? stripe.elements(options) : null
  return {
    stripe,
    elements
  }
}

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
  options?: stripeJs.StripeElementsOptions;
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
 * @docs https://stripe.com/docs/stripe-js/react#elements-provider
 */
export const Elements: FunctionComponent<ElementsProps> = (props: PrivateElementsProps) => {
  const { children } = props

  if (props.stripe === undefined) throw new Error(INVALID_STRIPE_ERROR);

  const [inputs, setInputs] = React.useState({ rawStripe: props.stripe, options: props.options })
  React.useEffect(() => {
    const { rawStripe, options } = inputs
    const { stripe: nextRawStripe, options: nextOptions } = props

    const canUpdate = rawStripe === null
    const hasRawStripeChanged = rawStripe !== nextRawStripe
    const hasOptionsChanged = !isEqual(options, nextOptions)

    if (hasRawStripeChanged && !canUpdate) {
      console.warn(
        'Unsupported prop change on Elements: You cannot change the `stripe` prop after setting it.'
      );
    }

    if (hasOptionsChanged && !canUpdate) {
      console.warn(
        'Unsupported prop change on Elements: You cannot change the `options` prop after setting the `stripe` prop.'
      );
    }

    const nextInputs = { rawStripe: nextRawStripe, options: nextOptions }
    if (hasRawStripeChanged && canUpdate) setInputs(nextInputs)
  }, [inputs, props])

  const [maybeStripe = null] = usePromiseResolver(inputs.rawStripe)
  const resolvedStripe = validateStripe(maybeStripe)
  const [ctx, setContext] = React.useState(() => createElementsContext(resolvedStripe, inputs.options));

  const shouldInitialize = resolvedStripe !== null && ctx.stripe === null
  React.useEffect(() => {
    if (shouldInitialize) setContext(createElementsContext(resolvedStripe, inputs.options))
  }, [shouldInitialize, resolvedStripe, inputs.options])

  React.useEffect(() => {
    const anyStripe: any = ctx.stripe;

    if (!anyStripe || !anyStripe._registerWrapper) {
      return;
    }

    anyStripe._registerWrapper({name: 'react-stripe-js', version: _VERSION});
  }, [ctx.stripe]);

  return (
    <ElementsContext.Provider value={ctx}>{children}</ElementsContext.Provider>
  );
};

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

/**
 * @docs https://stripe.com/docs/stripe-js/react#usestripe-hook
 */
export const useStripe = (): stripeJs.Stripe | null => {
  const {stripe} = useElementsContextWithUseCase('calls useStripe()');
  return stripe;
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
