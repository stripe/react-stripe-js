// @flow
/* eslint-disable react/forbid-prop-types */
import React, {useRef, useEffect, useLayoutEffect} from 'react';
import PropTypes from 'prop-types';
import {useElements} from './Elements';
import isEqual from '../utils/isEqual';

type Props = {
  id?: string,
  className?: string,
  onChange: MixedFunction,
  onBlur: MixedFunction,
  onFocus: MixedFunction,
  onReady: MixedFunction,
  onClick: MixedFunction,
  options: MixedObject,
};

const extractUpdateableOptions = (options: ?MixedObject) => {
  if (!options) {
    return {};
  }

  const {paymentRequest, ...rest} = options;

  return rest;
};

const noop = () => {};
const capitalized = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
const callbackReference = (cb: MixedFunction) => {
  const cbStore = useRef(cb);

  useEffect(() => {
    cbStore.current = cb;
  }, [cb]);

  return (...args) => {
    if (cbStore.current) {
      cbStore.current(...args);
    }
  };
};

const createElementComponent = (type: string) => {
  const Element = (props: Props) => {
    const {
      id,
      className,
      options,
      onBlur,
      onFocus,
      onReady,
      onChange,
      onClick,
    } = props;

    const elements = useElements();
    const elementRef = useRef();
    const domNode = useRef();

    const callOnReady = callbackReference(onReady);
    const callOnBlur = callbackReference(onBlur);
    const callOnFocus = callbackReference(onFocus);
    const callOnClick = callbackReference(onClick);
    const callOnChange = callbackReference(onChange);

    useLayoutEffect(() => {
      if (
        elementRef.current == null &&
        elements != null &&
        domNode.current != null
      ) {
        const element = elements.create(type, options);
        elementRef.current = element;
        element.mount(domNode.current);
        element.on('ready', () => callOnReady(element));
        element.on('change', callOnChange);
        element.on('blur', callOnBlur);
        element.on('focus', callOnFocus);
        // Users can pass an an onClick prop on any Element component
        // just as they could listen for the `click` event on any Element,
        // but only the PaymentRequestButton will actually trigger the event.
        element.on('click', callOnClick);
      }
    });

    const prevOptions = useRef(options);
    useEffect(() => {
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

    useEffect(
      () => () => {
        if (elementRef.current) {
          elementRef.current.destroy();
        }
      },
      []
    );

    return <div id={id} className={className} ref={domNode} />;
  };

  Element.propTypes = {
    id: PropTypes.string,
    className: PropTypes.string,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    onFocus: PropTypes.func,
    onReady: PropTypes.func,
    onClick: PropTypes.func,
    options: PropTypes.object,
  };

  Element.defaultProps = {
    id: undefined,
    className: undefined,
    onChange: noop,
    onBlur: noop,
    onFocus: noop,
    onReady: noop,
    onClick: noop,
    options: {},
  };

  Element.displayName = `${capitalized(type)}Element`;

  return Element;
};

export default createElementComponent;
