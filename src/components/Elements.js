// @flow
/* eslint-disable react/forbid-prop-types, react/require-default-props */
import * as React from 'react';
import PropTypes from 'prop-types';

import isEqual from '../utils/isEqual';

const {useContext, useEffect, useRef, useState} = React;

type ElementContext =
  | {|
      tag: 'ready',
      elements: ElementsShape,
    |}
  | {|
      tag: 'loading',
    |};

const ElementsContext = React.createContext<?ElementContext>();

type Props = {|
  stripe: ?StripeShape,
  options?: MixedObject,
  children?: any,
|};

const validateStripe = (maybeStripe: $NonMaybeType<mixed>) => {
  if (
    typeof maybeStripe === 'object' &&
    maybeStripe.elements &&
    maybeStripe.createSource &&
    maybeStripe.createToken &&
    maybeStripe.createPaymentMethod
  ) {
    return;
  }

  throw new Error(
    'Invalid prop `stripe` supplied to `Elements`. Please pass a valid Stripe object. ' +
      'You can obtain a Stripe object by calling `window.Stripe(...)` with your publishable key.'
  );
};

const usePrevious = (value) => {
  // The ref object is a generic container whose current property is mutable ...
  // ... and can hold any value, similar to an instance property on a class
  const ref = useRef();

  // Store current value in ref
  useEffect(() => {
    ref.current = value;
  }, [value]); // Only re-run if value changes

  // Return previous value (happens before update in useEffect above)
  return ref.current;
};

const createElementsContext = (
  stripe: ?StripeShape,
  options: ?MixedObject
): ElementContext => {
  if (stripe == null) {
    return {tag: 'loading'};
  }

  // We are using types to enforce the `stripe` prop in this lib,
  // but in a real integration, `stripe` could be anything, so we need
  // to do some sanity validation to prevent type errors.
  validateStripe(stripe);

  return {
    tag: 'ready',
    elements: stripe.elements(options || {}),
  };
};

export const Elements = ({stripe, options, children}: Props) => {
  const [elements, setElements] = useState(() =>
    createElementsContext(stripe, options)
  );

  if (stripe != null && elements.tag === 'loading') {
    setElements(createElementsContext(stripe, options));
  }

  const prevStripe = usePrevious(stripe);
  if (prevStripe != null && prevStripe !== stripe) {
    console.warn(
      'Unsupported prop change on Elements: You cannot change the `stripe` prop after setting it.'
    );
  }

  const prevOptions = usePrevious(options);
  if (prevStripe != null && !isEqual(prevOptions, options)) {
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
  children: PropTypes.any,
  options: PropTypes.object,
};

const parseElementsContext = (ctx: ?ElementContext): null | ElementsShape => {
  if (!ctx) {
    throw new Error(
      `It looks like you are trying to inject Stripe context outside of an Elements context.
Please be sure the component that calls createSource or createToken is within an <Elements> component.`
    );
  }

  if (ctx.tag === 'loading') {
    return null;
  }

  return ctx.elements;
};

export const useElements = () => {
  const ctx = useContext(ElementsContext);
  return parseElementsContext(ctx);
};

export const ElementsConsumer = ({
  children,
}: {|
  children: (elements: ElementsShape | null) => React$Node,
|}) => {
  const elements = useElements();
  return children(elements);
};

ElementsConsumer.propTypes = {
  children: PropTypes.func,
};

export const injectElements = <Config: {}>(
  WrappedComponent: React.AbstractComponent<Config>
) => {
  const Injected = (props: MixedObject) => (
    <ElementsContext.Consumer>
      {(ctx) => (
        <WrappedComponent elements={parseElementsContext(ctx)} {...props} />
      )}
    </ElementsContext.Consumer>
  );
  Injected.displayName = `InjectElements(${WrappedComponent.displayName ||
    WrappedComponent.name ||
    'Component'})`;
  return Injected;
};
