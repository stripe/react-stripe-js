// @flow
/* eslint-disable react/forbid-prop-types */
import React, {useContext, useMemo, useState, useEffect} from 'react';
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

const parseStripeProp = (
  raw: mixed
):
  | {|tag: 'sync', value: StripeShape | null|}
  | {|tag: 'async', value: Promise<StripeShape | null>|} => {
  if (
    typeof raw === 'object' &&
    raw !== null &&
    raw.then &&
    typeof raw.then === 'function'
  ) {
    // We know this is a Promise, but Flow does not.
    return {tag: 'async', value: (raw: any).then(validateStripe)};
  }

  return {tag: 'sync', value: validateStripe(raw)};
};

type Props = {|
  stripe: Promise<StripeShape | null> | StripeShape | null,
  options?: MixedObject,
  children?: any,
|};

export const Elements = ({stripe: rawStripeProp, options, children}: Props) => {
  const prevStripeProp = usePrevious(rawStripeProp);
  const prevOptionsProp = usePrevious(options);

  if (prevStripeProp != null && prevStripeProp !== rawStripeProp) {
    console.warn(
      'Unsupported prop change on Elements: You cannot change the `stripe` prop after setting it.'
    );
  }

  if (prevStripeProp !== null && !isEqual(prevOptionsProp, options)) {
    console.warn(
      'Unsupported prop change on Elements: You cannot change the `options` prop after setting the `stripe` prop.'
    );
  }

  const parsedStripeProp = useMemo(() => parseStripeProp(rawStripeProp), [
    rawStripeProp,
  ]);

  const [elements, setElements] = useState(() => {
    return parsedStripeProp.tag === 'sync'
      ? createElementsContext(parsedStripeProp.value, options)
      : createElementsContext(null, options);
  });

  // Handle user controlled async setting of the Stripe prop.
  if (
    parsedStripeProp.tag === 'sync' &&
    parsedStripeProp.value !== null &&
    elements.tag === 'loading'
  ) {
    setElements(createElementsContext(parsedStripeProp.value, options));
  }

  // Handle when the stripe prop is a Promise.
  useEffect(() => {
    if (parsedStripeProp.tag === 'async') {
      Promise.resolve(parsedStripeProp.value).then((resolvedStripe) => {
        // We allow the `stripe` prop to resolve to be null to make SSR easier.
        // In a server environment the Stripe loading module will resolve to null.
        if (resolvedStripe !== null && elements.tag === 'loading') {
          const ctx = createElementsContext(resolvedStripe, options);
          setElements(ctx);
        }
      });
    }
  }, [parsedStripeProp, options, elements.tag]);

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
