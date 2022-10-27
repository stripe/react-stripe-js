// Must use `import *` or named imports for React's types
import {FunctionComponent} from 'react';
import * as stripeJs from '@stripe/stripe-js';

import React from 'react';

import PropTypes from 'prop-types';

import {
  useElementsContextWithUseCase,
  useCartElementContextWithUseCase,
} from './Elements';
import {useCallbackReference} from '../utils/useCallbackReference';
import {ElementProps} from '../types';
import {usePrevious} from '../utils/usePrevious';
import {
  extractAllowedOptionsUpdates,
  UnknownOptions,
} from '../utils/extractAllowedOptionsUpdates';

type UnknownCallback = (...args: unknown[]) => any;

interface PrivateElementProps {
  id?: string;
  className?: string;
  onChange?: UnknownCallback;
  onBlur?: UnknownCallback;
  onFocus?: UnknownCallback;
  onEscape?: UnknownCallback;
  onReady?: UnknownCallback;
  onClick?: UnknownCallback;
  onLoadError?: UnknownCallback;
  onLoaderStart?: UnknownCallback;
  onNetworksChange?: UnknownCallback;
  onCheckout?: UnknownCallback;
  onLineItemClick?: UnknownCallback;
  options?: UnknownOptions;
}

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
    onLoadError = noop,
    onLoaderStart = noop,
    onNetworksChange = noop,
    onCheckout = noop,
    onLineItemClick = noop,
  }) => {
    const {elements} = useElementsContextWithUseCase(`mounts <${displayName}>`);
    const elementRef = React.useRef<stripeJs.StripeElement | null>(null);
    const domNode = React.useRef<HTMLDivElement | null>(null);

    const {setCart, setCartState} = useCartElementContextWithUseCase(
      `mounts <${displayName}>`
    );

    const callOnReady = useCallbackReference(onReady);
    const callOnBlur = useCallbackReference(onBlur);
    const callOnFocus = useCallbackReference(onFocus);
    const callOnClick = useCallbackReference(onClick);
    const callOnChange = useCallbackReference(onChange);
    const callOnEscape = useCallbackReference(onEscape);
    const callOnLoadError = useCallbackReference(onLoadError);
    const callOnLoaderStart = useCallbackReference(onLoaderStart);
    const callOnNetworksChange = useCallbackReference(onNetworksChange);
    const callOnCheckout = useCallbackReference(onCheckout);
    const callOnLineItemClick = useCallbackReference(onLineItemClick);

    React.useLayoutEffect(() => {
      if (elementRef.current == null && elements && domNode.current != null) {
        const element = elements.create(type as any, options);
        if (type === 'cart' && setCart) {
          // we know that elements.create return value must be of type StripeCartElement if type is 'cart',
          // we need to cast because typescript is not able to infer which overloaded method is used based off param type
          setCart((element as unknown) as stripeJs.StripeCartElement);
        }
        elementRef.current = element;
        element.mount(domNode.current);
        element.on('ready', (event) => {
          if (type === 'cart') {
            // we know that elements.on event must be of type StripeCartPayloadEvent if type is 'cart'
            // we need to cast because typescript is not able to infer which overloaded method is used based off param type
            if (setCartState) {
              setCartState(
                (event as unknown) as stripeJs.StripeCartElementPayloadEvent
              );
            }
            // the cart ready event returns a CartStatePayload instead of the CartElement
            callOnReady(event);
          } else {
            callOnReady(element);
          }
        });

        element.on('change', (event) => {
          if (type === 'cart' && setCartState) {
            // we know that elements.on event must be of type StripeCartPayloadEvent if type is 'cart'
            // we need to cast because typescript is not able to infer which overloaded method is used based off param type
            setCartState(
              (event as unknown) as stripeJs.StripeCartElementPayloadEvent
            );
          }
          callOnChange(event);
        });

        // Users can pass an onBlur prop on any Element component
        // just as they could listen for the `blur` event on any Element,
        // but only certain Elements will trigger the event.
        (element as any).on('blur', callOnBlur);

        // Users can pass an onFocus prop on any Element component
        // just as they could listen for the `focus` event on any Element,
        // but only certain Elements will trigger the event.
        (element as any).on('focus', callOnFocus);

        // Users can pass an onEscape prop on any Element component
        // just as they could listen for the `escape` event on any Element,
        // but only certain Elements will trigger the event.
        (element as any).on('escape', callOnEscape);

        // Users can pass an onLoadError prop on any Element component
        // just as they could listen for the `loaderror` event on any Element,
        // but only certain Elements will trigger the event.
        (element as any).on('loaderror', callOnLoadError);

        // Users can pass an onLoaderStart prop on any Element component
        // just as they could listen for the `loaderstart` event on any Element,
        // but only certain Elements will trigger the event.
        (element as any).on('loaderstart', callOnLoaderStart);

        // Users can pass an onNetworksChange prop on any Element component
        // just as they could listen for the `networkschange` event on any Element,
        // but only the Card and CardNumber Elements will trigger the event.
        (element as any).on('networkschange', callOnNetworksChange);

        // Users can pass an onClick prop on any Element component
        // just as they could listen for the `click` event on any Element,
        // but only the PaymentRequestButton will actually trigger the event.
        (element as any).on('click', callOnClick);

        // Users can pass an onCheckout prop on any Element component
        // just as they could listen for the `checkout` event on any Element,
        // but only certain Elements will trigger the event.
        (element as any).on(
          'checkout',
          (event: stripeJs.StripeCartElementPayloadEvent) => {
            if (type === 'cart' && setCartState) {
              // we know that elements.on event must be of type StripeCartPayloadEvent if type is 'cart'
              // we need to cast because typescript is not able to infer which overloaded method is used based off param type
              setCartState(event);
            }
            callOnCheckout(event);
          }
        );

        // Users can pass an onLineItemClick prop on any Element component
        // just as they could listen for the `lineitemclick` event on any Element,
        // but only certain Elements will trigger the event.
        (element as any).on('lineitemclick', callOnLineItemClick);
      }
    });

    const prevOptions = usePrevious(options);
    React.useEffect(() => {
      if (!elementRef.current) {
        return;
      }

      const updates = extractAllowedOptionsUpdates(options, prevOptions, [
        'paymentRequest',
      ]);

      if (updates) {
        elementRef.current.update(updates);
      }
    }, [options, prevOptions]);

    React.useLayoutEffect(() => {
      return () => {
        if (elementRef.current) {
          elementRef.current.destroy();
          elementRef.current = null;
        }
      };
    }, []);

    return <div id={id} className={className} ref={domNode} />;
  };

  // Only render the Element wrapper in a server environment.
  const ServerElement: FunctionComponent<PrivateElementProps> = (props) => {
    // Validate that we are in the right context by calling useElementsContextWithUseCase.
    useElementsContextWithUseCase(`mounts <${displayName}>`);
    useCartElementContextWithUseCase(`mounts <${displayName}>`);
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
    onEscape: PropTypes.func,
    onClick: PropTypes.func,
    onLoadError: PropTypes.func,
    onLoaderStart: PropTypes.func,
    onNetworksChange: PropTypes.func,
    onCheckout: PropTypes.func,
    onLineItemClick: PropTypes.func,
    options: PropTypes.object as any,
  };

  Element.displayName = displayName;
  (Element as any).__elementType = type;

  return Element as FunctionComponent<ElementProps>;
};

export default createElementComponent;
