// @flow
/* eslint-disable react/forbid-prop-types */
import React, {useContext, useMemo, useState, useEffect, useRef} from 'react';
import PropTypes from 'prop-types';

import isEqual from '../utils/isEqual';
import usePrevious from '../utils/usePrevious';

type ParsedStripeProp =
  | {|tag: 'empty'|}
  | {|tag: 'sync', stripe: StripeShape|}
  | {|tag: 'async', stripePromise: Promise<StripeShape | null>|};

// We are using types to enforce the `stripe` prop in this lib,
// but in a real integration `stripe` could be anything, so we need
// to do some sanity validation to prevent type errors.
const validateStripe = (maybeStripe: mixed): null | StripeShape => {
  if (maybeStripe === null) {
    return maybeStripe;
  }

  if (
    typeof maybeStripe === 'object' &&
    typeof maybeStripe.elements === 'function' &&
    typeof maybeStripe.createSource === 'function' &&
    typeof maybeStripe.createToken === 'function' &&
    typeof maybeStripe.createPaymentMethod === 'function'
  ) {
    // If the object appears to be roughly Stripe shaped,
    // force cast it to the expected type.
    return ((maybeStripe: any): StripeShape);
  }

  throw new Error(
    'Invalid prop `stripe` supplied to `Elements`. Please pass a valid Stripe object or null. ' +
      'You can obtain a Stripe object by calling `window.Stripe(...)` with your publishable key.'
  );
};

const parseStripeProp = (raw: mixed): ParsedStripeProp => {
  if (
    raw !== null &&
    typeof raw === 'object' &&
    raw.then &&
    typeof raw.then === 'function'
  ) {
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

type ElementContext = {|
  elements: ElementsShape | null,
  stripe: StripeShape | null,
|};

const ElementsContext = React.createContext<?ElementContext>();
ElementsContext.displayName = 'Stripe';

export const parseElementsContext = (
  ctx: ?ElementContext,
  useCase: string
): ElementContext => {
  if (!ctx) {
    throw new Error(
      `Could not find Elements context; You need to wrap the part of your app that ${useCase} in an <Elements> provider.`
    );
  }

  return ctx;
};

type Props = {|
  stripe: Promise<StripeShape | null> | StripeShape | null,
  options?: MixedObject,
  children?: any,
|};

export const Elements = ({stripe: rawStripeProp, options, children}: Props) => {
  const final = useRef(false);
  const isMounted = useRef(true);
  const parsed = useMemo(() => parseStripeProp(rawStripeProp), [rawStripeProp]);
  const [ctx, setContext] = useState<ElementContext>(() => ({
    stripe: null,
    elements: null,
  }));

  const prevStripe = usePrevious(rawStripeProp);
  const prevOptions = usePrevious(options);
  if (prevStripe !== null) {
    if (prevStripe !== rawStripeProp) {
      console.warn(
        'Unsupported prop change on Elements: You cannot change the `stripe` prop after setting it.'
      );
    }
    if (!isEqual(options, prevOptions)) {
      console.warn(
        'Unsupported prop change on Elements: You cannot change the `options` prop after setting the `stripe` prop.'
      );
    }
  }

  if (!final.current) {
    if (parsed.tag === 'sync') {
      final.current = true;
      setContext({
        stripe: parsed.stripe,
        elements: parsed.stripe.elements(options),
      });
    }

    if (parsed.tag === 'async') {
      final.current = true;
      parsed.stripePromise.then((stripe) => {
        if (stripe && isMounted.current) {
          // Only update Elements context if the component is still mounted
          // and stripe is not null. We allow stripe to be null to make
          // handling SSR easier.
          setContext({
            stripe,
            elements: stripe.elements(options),
          });
        }
      });
    }
  }

  useEffect(
    () => () => {
      isMounted.current = false;
    },
    []
  );

  return (
    <ElementsContext.Provider value={ctx}>{children}</ElementsContext.Provider>
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
