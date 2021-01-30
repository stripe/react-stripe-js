// Must use `import *` or named imports for React's types
import {FunctionComponent} from 'react';
import * as stripeJs from '@stripe/stripe-js';

import React from 'react';

import PropTypes from 'prop-types';

import {useElementsContextWithUseCase} from './Elements';
import {useCallbackReference} from '../utils/useCallbackReference';
import {isEqual} from '../utils/isEqual';
import {ElementProps} from '../types';
import {isUnknownObject} from '../utils/guards';

type UnknownCallback = (...args: unknown[]) => any;
type UnknownOptions = {[k: string]: unknown};

interface PrivateElementProps {
  id?: string;
  className?: string;
  onChange?: UnknownCallback;
  onBlur?: UnknownCallback;
  onFocus?: UnknownCallback;
  onEscape?: UnknownCallback;
  onReady?: UnknownCallback;
  onClick?: UnknownCallback;
  options?: UnknownOptions;
}

const extractUpdateableOptions = (options?: UnknownOptions): UnknownOptions => {
  if (!isUnknownObject(options)) {
    return {};
  }

  const {paymentRequest: _, ...rest} = options;

  return rest;
};

const noop = () => {};

const capitalized = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const createElementComponent = (
  type: stripeJs.StripeElementType,
  isServer: boolean
): FunctionComponent<ElementProps> => {
  const displayName = `${capitalized(type)}Element`;

  const ClientElement: FunctionComponent<PrivateElementProps> = ({
    id,
    className,
    options = {},
    onBlur = noop,
    onFocus = noop,
    onReady = noop,
    onChange = noop,
    onEscape = noop,
    onClick = noop,
  }) => {
    const {elements} = useElementsContextWithUseCase(`mounts <${displayName}>`);
    const elementRef = React.useRef<stripeJs.StripeElement | null>(null);
    const domNode = React.useRef<HTMLDivElement | null>(null);

    const callOnReady = useCallbackReference(onReady);
    const callOnBlur = useCallbackReference(onBlur);
    const callOnFocus = useCallbackReference(onFocus);
    const callOnClick = useCallbackReference(onClick);
    const callOnChange = useCallbackReference(onChange);
    const callOnEscape = useCallbackReference(onEscape);

    React.useLayoutEffect(() => {
      if (elementRef.current == null && elements && domNode.current != null) {
        const element = elements.create(type as any, options);
        elementRef.current = element;
        element.mount(domNode.current);
        element.on('ready', () => callOnReady(element));
        element.on('change', callOnChange);
        element.on('blur', callOnBlur);
        element.on('focus', callOnFocus);
        element.on('escape', callOnEscape);

        // Users can pass an an onClick prop on any Element component
        // just as they could listen for the `click` event on any Element,
        // but only the PaymentRequestButton will actually trigger the event.
        (element as any).on('click', callOnClick);
      }
    });

    const prevOptions = React.useRef(options);
    React.useEffect(() => {
      if (
        prevOptions.current &&
        prevOptions.current.paymentRequest !== options.paymentRequest
      ) {
        console.warn(
          'Unsupported prop change: options.paymentRequest is not a customizable property.'
        );
      }

      const updateableOptions = extractUpdateableOptions(options);

      if (
        Object.keys(updateableOptions).length !== 0 &&
        !isEqual(
          updateableOptions,
          extractUpdateableOptions(prevOptions.current)
        )
      ) {
        if (elementRef.current) {
          elementRef.current.update(updateableOptions);
          prevOptions.current = options;
        }
      }
    }, [options]);

    React.useLayoutEffect(() => {
      return () => {
        if (elementRef.current) {
          elementRef.current.destroy();
        }
      };
    }, []);

    return <div id={id} className={className} ref={domNode} />;
  };

  // Only render the Element wrapper in a server environment.
  const ServerElement: FunctionComponent<PrivateElementProps> = (props) => {
    // Validate that we are in the right context by calling useElementsContextWithUseCase.
    useElementsContextWithUseCase(`mounts <${displayName}>`);
    const {id, className} = props;
    return <div id={id} className={className} />;
  };

  const Element = isServer ? ServerElement : ClientElement;

  Element.propTypes = {
    id: PropTypes.string,
    className: PropTypes.string,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    onFocus: PropTypes.func,
    onReady: PropTypes.func,
    onClick: PropTypes.func,
    options: PropTypes.object as any,
  };

  Element.displayName = displayName;
  (Element as any).__elementType = type;

  return Element as FunctionComponent<ElementProps>;
};

export default createElementComponent;
