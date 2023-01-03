// Must use `import *` or named imports for React's types
import {FunctionComponent} from 'react';
import * as stripeJs from '@stripe/stripe-js';

import React from 'react';

import PropTypes from 'prop-types';

import {
  useElementsContextWithUseCase,
  useCartElementContextWithUseCase,
} from './Elements';
import {useAttachEvent} from '../utils/useAttachEvent';
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
  onConfirm?: UnknownCallback;
  onCancel?: UnknownCallback;
  onShippingAddressChange?: UnknownCallback;
  onShippingRateChange?: UnknownCallback;
  options?: UnknownOptions;
}

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
    onBlur,
    onFocus,
    onReady,
    onChange,
    onEscape,
    onClick,
    onLoadError,
    onLoaderStart,
    onNetworksChange,
    onCheckout,
    onLineItemClick,
    onConfirm,
    onCancel,
    onShippingAddressChange,
    onShippingRateChange,
  }) => {
    const {elements} = useElementsContextWithUseCase(`mounts <${displayName}>`);
    const elementRef = React.useRef<stripeJs.StripeElement | null>(null);
    const domNode = React.useRef<HTMLDivElement | null>(null);

    const {setCart, setCartState} = useCartElementContextWithUseCase(
      `mounts <${displayName}>`
    );

    // For every event where the merchant provides a callback, call element.on
    // with that callback. If the merchant ever changes the callback, removes
    // the old callback with element.off and then call element.on with the new one.
    const attachBlurEvent = useAttachEvent(elementRef, 'blur', onBlur);
    const attachFocusEvent = useAttachEvent(elementRef, 'focus', onFocus);
    const attachEscapeEvent = useAttachEvent(elementRef, 'escape', onEscape);
    const attachClickEvent = useAttachEvent(elementRef, 'click', onClick);
    const attachLoadErrorEvent = useAttachEvent(
      elementRef,
      'loaderror',
      onLoadError
    );
    const attachLoaderStartEvent = useAttachEvent(
      elementRef,
      'loaderstart',
      onLoaderStart
    );
    const attachNetworksChangeEvent = useAttachEvent(
      elementRef,
      'networkschange',
      onNetworksChange
    );
    const attachLineItemClickEvent = useAttachEvent(
      elementRef,
      'lineitemclick',
      onLineItemClick
    );
    const attachConfirmEvent = useAttachEvent(elementRef, 'confirm', onConfirm);
    const attachCancelEvent = useAttachEvent(elementRef, 'cancel', onCancel);
    const attachShippingAddressChangeEvent = useAttachEvent(
      elementRef,
      'shippingaddresschange',
      onShippingAddressChange
    );
    const attachShippingRateChangeEvent = useAttachEvent(
      elementRef,
      'shippingratechange',
      onShippingRateChange
    );

    let readyCallback: UnknownCallback | undefined;
    if (type === 'cart') {
      readyCallback = (event) => {
        setCartState(
          (event as unknown) as stripeJs.StripeCartElementPayloadEvent
        );
        onReady && onReady(event);
      };
    } else if (onReady) {
      if (type === 'payButton') {
        // Passes through the event, which includes visible PM types
        readyCallback = onReady;
      } else {
        // For other Elements, pass through the Element itself.
        readyCallback = () => {
          onReady(elementRef.current);
        };
      }
    }

    const attachReadyEvent = useAttachEvent(elementRef, 'ready', readyCallback);

    const changeCallback =
      type === 'cart'
        ? (event: stripeJs.StripeCartElementPayloadEvent) => {
            setCartState(event);
            onChange && onChange(event);
          }
        : onChange;

    const attachChangeEvent = useAttachEvent(
      elementRef,
      'change',
      changeCallback
    );

    const checkoutCallback =
      type === 'cart'
        ? (event: stripeJs.StripeCartElementPayloadEvent) => {
            setCartState(event);
            onCheckout && onCheckout(event);
          }
        : onCheckout;

    const attachCheckoutEvent = useAttachEvent(
      elementRef,
      'checkout',
      checkoutCallback
    );

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

        attachBlurEvent();
        attachFocusEvent();
        attachEscapeEvent();
        attachClickEvent();
        attachLoadErrorEvent();
        attachLoaderStartEvent();
        attachNetworksChangeEvent();
        attachLineItemClickEvent();
        attachConfirmEvent();
        attachCancelEvent();
        attachShippingAddressChangeEvent();
        attachShippingRateChangeEvent();
        attachReadyEvent();
        attachChangeEvent();
        attachCheckoutEvent();
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
    onConfirm: PropTypes.func,
    onCancel: PropTypes.func,
    onShippingAddressChange: PropTypes.func,
    onShippingRateChange: PropTypes.func,
    options: PropTypes.object as any,
  };

  Element.displayName = displayName;
  (Element as any).__elementType = type;

  return Element as FunctionComponent<ElementProps>;
};

export default createElementComponent;
