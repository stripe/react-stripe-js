// @flow
/* eslint-disable react/forbid-prop-types, react/require-default-props */
import React, {useContext, useMemo, useState} from 'react';
import PropTypes from 'prop-types';

import isEqual from '../utils/isEqual';
import usePrevious from '../utils/usePrevious';

type ElementContext =
  | {|
      tag: 'ready',
      elements: ElementsShape,
      stripe: StripeShape,
    |}
  | {|
      tag: 'loading',
    |};

const ElementsContext = React.createContext<?ElementContext>();

export const createElementsContext = (
  stripe: null | StripeShape,
  options: ?MixedObject
): ElementContext => {
  if (stripe === null) {
    return {tag: 'loading'};
  }

  return {
    tag: 'ready',
    stripe,
    elements: stripe.elements(options || {}),
  };
};

export const parseElementsContext = (
  ctx: ?ElementContext,
  useCase: string
): {|elements: ElementsShape | null, stripe: StripeShape | null|} => {
  if (!ctx) {
    throw new Error(
      `Could not find Elements context; You need to wrap the part of your app that ${useCase} in an <Elements> provider.`
    );
  }

  if (ctx.tag === 'loading') {
    return {stripe: null, elements: null};
  }

  const {stripe, elements} = ctx;

  return {stripe, elements};
};

// We are using types to enforce the `stripe` prop in this lib,
// but in a real integration `stripe` could be anything, so we need
// to do some sanity validation to prevent type errors.
const validateStripe = (maybeStripe: mixed): StripeShape | null => {
  if (maybeStripe === null) {
    return maybeStripe;
  }

  if (
    typeof maybeStripe === 'object' &&
    maybeStripe.elements &&
    maybeStripe.createSource &&
    maybeStripe.createToken &&
    maybeStripe.createPaymentMethod
  ) {
    return ((maybeStripe: any): StripeShape);
  }

  throw new Error(
    'Invalid prop `stripe` supplied to `Elements`. Please pass a valid Stripe object or null. ' +
      'You can obtain a Stripe object by calling `window.Stripe(...)` with your publishable key.'
  );
};

type Props = {|
  stripe: StripeShape | null,
  options?: MixedObject,
  children?: any,
|};

export const Elements = ({stripe: rawStripe, options, children}: Props) => {
  // We are using types to enforce the `stripe` prop in this lib,
  // but in a real integration, `stripe` could be anything, so we need
  // to do some sanity validation to prevent type errors.
  const stripe = useMemo(() => validateStripe(rawStripe), [rawStripe]);

  const [elements, setElements] = useState(() =>
    createElementsContext(stripe, options)
  );

  if (stripe !== null && elements.tag === 'loading') {
    setElements(createElementsContext(stripe, options));
  }

  const prevStripe = usePrevious(stripe);
  if (prevStripe != null && prevStripe !== stripe) {
    console.warn(
      'Unsupported prop change on Elements: You cannot change the `stripe` prop after setting it.'
    );
  }

  const prevOptions = usePrevious(options);
  if (prevStripe !== null && !isEqual(prevOptions, options)) {
    console.warn(
      'Unsupported prop change on Elements: You cannot change the `options` prop after setting the `stripe` prop.'
    );
  }

  return (
    <ElementsContext.Provider value={elements}>
      {children}
    </ElementsContext.Provider>
  );
};

Elements.propTypes = {
  stripe: PropTypes.any,
  children: PropTypes.node,
  options: PropTypes.object,
};

export const useElementsContextWithUseCase = (useCaseMessage: string) => {
  const ctx = useContext(ElementsContext);
  return parseElementsContext(ctx, useCaseMessage);
};

export const useElements = (): ElementsShape | null => {
  const {elements} = useElementsContextWithUseCase('calls useElements()');

  return elements;
};

export const useStripe = (): StripeShape | null => {
  const {stripe} = useElementsContextWithUseCase('calls useStripe()');

  return stripe;
};

export const ElementsConsumer = ({
  children,
}: {|
  children: ({|
    elements: ElementsShape | null,
    stripe: StripeShape | null,
  |}) => React$Node,
|}) => {
  const ctx = useElementsContextWithUseCase('mounts <ElementsConsumer>');
  return children(ctx);
};

ElementsConsumer.propTypes = {
  children: PropTypes.func.isRequired,
};
