import React from 'react';
import {mount} from 'enzyme';
import {Elements} from './Elements';
import createElementComponent from './createElementComponent';
import {mockElements, mockElement, mockStripe} from '../../test/mocks';

describe('createElementComponent', () => {
  let stripe;
  let elements;
  let element;
  let simulatedEvents;

  const getSimulatedEventHandlers = function(event) {
    let handlers = simulatedEvents.get(event);
    if (!handlers) {
      handlers = new Set();
      simulatedEvents.set(event, handlers);
    }
    return handlers;
  };

  const simulateEvent = function(event, ...args) {
    const handlers = getSimulatedEventHandlers(event);
    for (const handler of handlers) {
      handler(...args);
    }
  };

  beforeEach(() => {
    jest.restoreAllMocks();
    stripe = mockStripe();
    elements = mockElements();
    element = mockElement();
    simulatedEvents = new Map();
    stripe.elements.mockReturnValue(elements);
    elements.create.mockReturnValue(element);
    jest.spyOn(React, 'useLayoutEffect');
    element.on = jest.fn((event, fn) => {
      const handlers = getSimulatedEventHandlers(event);
      handlers.add(fn);
    });
    element.off = jest.fn((event, fn) => {
      const handlers = getSimulatedEventHandlers(event);
      handlers.delete(fn);
    });
  });

  describe('on the server', () => {
    const CardElement = createElementComponent('card', true);

    it('gives the element component a proper displayName', () => {
      expect(CardElement.displayName).toBe('CardElement');
    });

    it('stores the element component`s type as a static property', () => {
      expect(CardElement.__elementType).toBe('card'); // eslint-disable-line no-underscore-dangle
    });

    it('passes id to the wrapping DOM element', () => {
      const wrapper = mount(
        <Elements stripe={null}>
          <CardElement id="foo" />
        </Elements>
      );
      expect(wrapper.find('div').prop('id')).toBe('foo');
    });

    it('passes className to the wrapping DOM element', () => {
      const wrapper = mount(
        <Elements stripe={null}>
          <CardElement className="bar" />
        </Elements>
      );
      expect(wrapper.find('div').prop('className')).toBe('bar');
    });

    it('throws when the Element is mounted outside of Elements context', () => {
      // Prevent the console.errors to keep the test output clean
      jest.spyOn(console, 'error');
      console.error.mockImplementation(() => {});
      expect(() => mount(<CardElement />)).toThrow(
        'Could not find Elements context; You need to wrap the part of your app that mounts <CardElement> in an <Elements> provider.'
      );
      console.error.mockRestore();
    });

    it('does not call useLayoutEffect', () => {
      mount(
        <Elements stripe={null}>
          <CardElement />
        </Elements>
      );

      expect(React.useLayoutEffect).not.toHaveBeenCalled();
    });
  });

  describe('on the client', () => {
    const CardElement = createElementComponent('card', false);

    it('gives the element component a proper displayName', () => {
      expect(CardElement.displayName).toBe('CardElement');
    });

    it('stores the element component`s type as a static property', () => {
      expect(CardElement.__elementType).toBe('card'); // eslint-disable-line no-underscore-dangle
    });

    it('passes id to the wrapping DOM element', () => {
      const wrapper = mount(
        <Elements stripe={stripe}>
          <CardElement id="foo" />
        </Elements>
      );
      expect(wrapper.find('div').prop('id')).toBe('foo');
    });

    it('passes className to the wrapping DOM element', () => {
      const wrapper = mount(
        <Elements stripe={stripe}>
          <CardElement className="bar" />
        </Elements>
      );
      expect(wrapper.find('div').prop('className')).toBe('bar');
    });

    it('creates the element with options', () => {
      const options = {foo: 'foo'};
      mount(
        <Elements stripe={stripe}>
          <CardElement options={options} />
        </Elements>
      );

      expect(elements.create).toHaveBeenCalledWith('card', options);
    });

    it('mounts the element', () => {
      const wrapper = mount(
        <Elements stripe={stripe}>
          <CardElement />
        </Elements>
      );

      expect(element.mount).toHaveBeenCalledWith(
        wrapper.find('div').getDOMNode()
      );

      expect(React.useLayoutEffect).toHaveBeenCalled();
    });

    it('does not create and mount until Elements has been instantiated', () => {
      const wrapper = mount(
        <Elements stripe={null}>
          <CardElement />
        </Elements>
      );

      expect(element.mount).not.toHaveBeenCalled();
      expect(elements.create).not.toHaveBeenCalled();

      wrapper.setProps({stripe});

      expect(element.mount).toHaveBeenCalled();
      expect(elements.create).toHaveBeenCalled();
    });

    it('throws when the Element is mounted outside of Elements context', () => {
      // Prevent the console.errors to keep the test output clean
      jest.spyOn(console, 'error');
      console.error.mockImplementation(() => {});
      expect(() => mount(<CardElement />)).toThrow(
        'Could not find Elements context; You need to wrap the part of your app that mounts <CardElement> in an <Elements> provider.'
      );
      console.error.mockRestore();
    });

    it('propagates the Element`s ready event to the current onReady prop', () => {
      // We need to wrap so that we can update the CardElement's props later.
      // Enzyme does not support calling setProps on child components.
      const TestComponent = (props) => (
        <Elements stripe={stripe}>
          <CardElement {...props} />
        </Elements>
      );

      const onReady = jest.fn();
      const onReady2 = jest.fn();
      const wrapper = mount(<TestComponent onReady={onReady} />);

      // when setting a new onReady prop (e.g. a lambda in the render),
      // only the latest handler is called.
      wrapper.setProps({
        onReady: onReady2,
      });

      simulateEvent('ready');
      expect(onReady2).toHaveBeenCalledWith(element);
      expect(onReady).not.toHaveBeenCalled();
    });

    it('propagates the Element`s change event to the current onChange prop', () => {
      // We need to wrap so that we can update the CardElement's props later.
      // Enzyme does not support calling setProps on child components.
      const TestComponent = (props) => (
        <Elements stripe={stripe}>
          <CardElement {...props} />
        </Elements>
      );

      const onChange = jest.fn();
      const onChange2 = jest.fn();
      const wrapper = mount(<TestComponent onChange={onChange} />);

      // when setting a new onChange prop (e.g. a lambda in the render),
      // only the latest handler is called.
      wrapper.setProps({
        onChange: onChange2,
      });

      const changeEventMock = Symbol('change');
      simulateEvent('change', changeEventMock);
      expect(onChange2).toHaveBeenCalledWith(changeEventMock);
      expect(onChange).not.toHaveBeenCalled();
    });

    it('propagates the Element`s blur event to the current onBlur prop', () => {
      // We need to wrap so that we can update the CardElement's props later.
      // Enzyme does not support calling setProps on child components.
      const TestComponent = (props) => (
        <Elements stripe={stripe}>
          <CardElement {...props} />
        </Elements>
      );

      const onBlur = jest.fn();
      const onBlur2 = jest.fn();
      const wrapper = mount(<TestComponent onBlur={onBlur} />);

      // when setting a new onBlur prop (e.g. a lambda in the render),
      // only the latest handler is called.
      wrapper.setProps({
        onBlur: onBlur2,
      });

      simulateEvent('blur');
      expect(onBlur2).toHaveBeenCalled();
      expect(onBlur).not.toHaveBeenCalled();
    });

    it('propagates the Element`s focus event to the current onFocus prop', () => {
      // We need to wrap so that we can update the CardElement's props later.
      // Enzyme does not support calling setProps on child components.
      const TestComponent = (props) => (
        <Elements stripe={stripe}>
          <CardElement {...props} />
        </Elements>
      );

      const onFocus = jest.fn();
      const onFocus2 = jest.fn();
      const wrapper = mount(<TestComponent onFocus={onFocus} />);

      // when setting a new onFocus prop (e.g. a lambda in the render),
      // only the latest handler is called.
      wrapper.setProps({
        onFocus: onFocus2,
      });

      simulateEvent('focus');
      expect(onFocus2).toHaveBeenCalled();
      expect(onFocus).not.toHaveBeenCalled();
    });

    it('propagates the Element`s escape event to the current onEscape prop', () => {
      // We need to wrap so that we can update the CardElement's props later.
      // Enzyme does not support calling setProps on child components.
      const TestComponent = (props) => (
        <Elements stripe={stripe}>
          <CardElement {...props} />
        </Elements>
      );

      const onEscape = jest.fn();
      const onEscape2 = jest.fn();
      const wrapper = mount(<TestComponent onEscape={onEscape} />);

      // when setting a new onEscape prop (e.g. a lambda in the render),
      // only the latest handler is called.
      wrapper.setProps({
        onEscape: onEscape2,
      });

      simulateEvent('escape');
      expect(onEscape2).toHaveBeenCalled();
      expect(onEscape).not.toHaveBeenCalled();
    });

    it('propagates an unknown Element`s event to undocumented on prop', () => {
      // We need to wrap so that we can update the CardElement's props later.
      // Enzyme does not support calling setProps on child components.
      const TestComponent = (props) => (
        <Elements stripe={stripe}>
          <CardElement {...props} />
        </Elements>
      );

      const onUndocumented = jest.fn();
      const onUndocumented2 = jest.fn();
      const wrapper = mount(<TestComponent onEscape={onUndocumented} />);

      // when setting a new onEscape prop (e.g. a lambda in the render),
      // only the latest handler is called.
      wrapper.setProps({
        onUndocumented: onUndocumented2,
      });

      simulateEvent('undocumented');
      expect(onUndocumented2).toHaveBeenCalled();
      expect(onUndocumented).not.toHaveBeenCalled();
    });

    // Users can pass an an onClick prop on any Element component
    // just as they could listen for the `click` event on any Element,
    // but only the PaymentRequestButton will actually trigger the event.
    it('propagates the Element`s click event to the current onClick prop', () => {
      // We need to wrap so that we can update the CardElement's props later.
      // Enzyme does not support calling setProps on child components.
      const TestComponent = (props) => (
        <Elements stripe={stripe}>
          <CardElement {...props} />
        </Elements>
      );

      const onClick = jest.fn();
      const onClick2 = jest.fn();
      const wrapper = mount(<TestComponent onClick={onClick} />);

      // when setting a new onClick prop (e.g. a lambda in the render),
      // only the latest handler is called.
      wrapper.setProps({
        onClick: onClick2,
      });

      const clickEventMock = Symbol('click');
      simulateEvent('click', clickEventMock);
      expect(onClick2).toHaveBeenCalledWith(clickEventMock);
      expect(onClick).not.toHaveBeenCalled();
    });

    it('updates the Element when options change', () => {
      // We need to wrap so that we can update the CardElement's props later.
      // Enzyme does not support calling setProps on child components.
      const TestComponent = (props) => (
        <Elements stripe={stripe}>
          <CardElement {...props} />
        </Elements>
      );

      const wrapper = mount(<TestComponent options={{style: {foo: 'foo'}}} />);

      wrapper.setProps({
        options: {style: {foo: 'bar'}},
      });
      expect(element.update).toHaveBeenCalledWith({
        style: {foo: 'bar'},
      });
    });

    it('does not trigger unnecessary updates', () => {
      // We need to wrap so that we can update the CardElement's props later.
      // Enzyme does not support calling setProps on child components.
      const TestComponent = (props) => (
        <Elements stripe={stripe}>
          <CardElement {...props} />
        </Elements>
      );

      const wrapper = mount(
        <TestComponent
          options={{
            style: {foo: 'foo'},
          }}
        />
      );

      wrapper.setProps({
        options: {
          style: {foo: 'foo'},
        },
      });
      expect(element.update).not.toHaveBeenCalled();
    });

    it('warns on changes to non-updatable options', () => {
      // We need to wrap so that we can update the CardElement's props later.
      // Enzyme does not support calling setProps on child components.
      const TestComponent = (props) => (
        <Elements stripe={stripe}>
          <CardElement {...props} />
        </Elements>
      );

      const wrapper = mount(
        <TestComponent
          options={{
            paymentRequest: Symbol('PaymentRequest'),
          }}
        />
      );

      jest.spyOn(console, 'warn');
      console.warn.mockImplementation(() => {});
      wrapper.setProps({
        options: {
          paymentRequest: Symbol('PaymentRequest'),
        },
      });

      expect(element.update).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith(
        'Unsupported prop change: options.paymentRequest is not a customizable property.'
      );

      console.warn.mockRestore();
    });

    it('destroys an existing Element when the component unmounts', () => {
      // not called when Element has not been mounted (because stripe is still loading)
      const wrapper = mount(
        <Elements stripe={null}>
          <CardElement />
        </Elements>
      );

      wrapper.unmount();
      expect(element.destroy).not.toHaveBeenCalled();

      const wrapper2 = mount(
        <Elements stripe={stripe}>
          <CardElement />
        </Elements>
      );

      wrapper2.unmount();
      expect(element.destroy).toHaveBeenCalled();
    });
  });
});
