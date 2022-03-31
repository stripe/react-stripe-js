// Must use `import *` or named imports for React's types
import {FunctionComponent} from 'react';
import * as stripeJs from '@stripe/stripe-js';

import React from 'react';

import PropTypes from 'prop-types';

import {useElementsContextWithUseCase} from './Elements';
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
  options?: UnknownOptions;
}

const noop = () => {};

const capitalized = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

// The Element instances [adds and removes classes][0] from the container node
// it is mounted to. We also want to be able to manage the class of the
// container node via the `className` prop passed to the Element wrapper
// component. If we naively apply the `className` prop, it will overwrite the
// classes that the Element instance has set for itself ([#267][1]).
//
// So instead, we track the current and previous value of the `className` prop.
// After each render, we _append_ every class in the current `className` prop
// to the container `class`, then remove any class that was in the previous
// `className` prop but is not in the current prop.
//
// [0]: https://stripe.com/docs/js/element/the_element_container
// [1]: https://github.com/stripe/react-stripe-js/issues/267
const useClassName = (domNode: HTMLDivElement | null, classNameProp = '') => {
  const previousClassNamePropRef = React.useRef(classNameProp);

  React.useLayoutEffect(() => {
    const previousClassNameProp = previousClassNamePropRef.current;
    previousClassNamePropRef.current = classNameProp;

    if (!domNode) {
      return;
    }

    const previousClassNames = previousClassNameProp
      .split(/\s+/)
      .filter((n) => n.length);
    const classNames = classNameProp.split(/\s+/).filter((n) => n.length);
    const removedClassNames = previousClassNames.filter(
      (n) => !classNames.includes(n)
    );

    domNode.classList.add(...classNames);
    domNode.classList.remove(...removedClassNames);
  }, [domNode, classNameProp]);

  // track previous classnames
  // merge provided classnames and existing classnames on domNode
  // remove the previous classnames not in the current classnames
};

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
    const [domNode, setDomNode] = React.useState<HTMLDivElement | null>(null);

    const callOnReady = useCallbackReference(onReady);
    const callOnBlur = useCallbackReference(onBlur);
    const callOnFocus = useCallbackReference(onFocus);
    const callOnClick = useCallbackReference(onClick);
    const callOnChange = useCallbackReference(onChange);
    const callOnEscape = useCallbackReference(onEscape);

    React.useLayoutEffect(() => {
      if (elementRef.current == null && elements && domNode != null) {
        const element = elements.create(type as any, options);
        elementRef.current = element;
        element.mount(domNode);
        element.on('ready', () => callOnReady(element));
        element.on('change', callOnChange);
        element.on('blur', callOnBlur);
        element.on('focus', callOnFocus);
        element.on('escape', callOnEscape);

        // Users can pass an onClick prop on any Element component
        // just as they could listen for the `click` event on any Element,
        // but only the PaymentRequestButton will actually trigger the event.
        (element as any).on('click', callOnClick);
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
        }
      };
    }, []);

    useClassName(domNode, className);

    return <div id={id} ref={setDomNode} />;
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
