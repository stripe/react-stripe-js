// @noflow
import React from 'react';
import {mount} from 'enzyme';
import {Elements, useElements, injectElements} from './Elements';
import {mockStripe} from '../../test/mocks';

const TestComponent = () => <div>test</div>;
const InjectedTestComponent = () => {
  const elements = useElements();
  return <TestComponent elements={elements} />;
};

describe('Elements', () => {
  let stripe;
  let mockElements;

  beforeEach(() => {
    stripe = mockStripe();
    mockElements = Symbol('MockElements');
    stripe.elements.mockReturnValue(mockElements);
  });

  it('injects elements context with the useElements hook', () => {
    const wrapper = mount(
      <Elements stripe={stripe}>
        <InjectedTestComponent />
      </Elements>
    );

    expect(wrapper.find(TestComponent).prop('elements')).toBe(mockElements);
  });

  it('injects stripe with the injectElements HOC', () => {
    const WithAHOC = injectElements(TestComponent);

    const wrapper = mount(
      <Elements stripe={stripe}>
        <WithAHOC />
      </Elements>
    );

    expect(wrapper.find(TestComponent).prop('elements')).toBe(mockElements);
  });

  it('allows a transition from null to a valid stripe object', () => {
    const wrapper = mount(
      <Elements stripe={null}>
        <InjectedTestComponent />
      </Elements>
    );

    expect(wrapper.find(TestComponent).prop('elements')).toBe(null);
    wrapper.setProps({stripe});
    wrapper.update();
    expect(wrapper.find(TestComponent).prop('elements')).toBe(mockElements);
  });

  it('allows a transition from undefined to a valid stripe object', () => {
    const wrapper = mount(
      <Elements stripe={undefined}>
        <InjectedTestComponent />
      </Elements>
    );

    expect(wrapper.find(TestComponent).prop('elements')).toBe(null);
    wrapper.setProps({
      stripe,
    });
    wrapper.update();
    expect(wrapper.find(TestComponent).prop('elements')).toBe(mockElements);
  });

  it('errors when props.stripe is `false`', () => {
    const consoleError = console.error;
    console.error = () => {};

    expect(() =>
      mount(
        <Elements stripe={false}>
          <InjectedTestComponent />
        </Elements>
      )
    ).toThrow('Invalid prop `stripe` supplied to `Elements`.');

    console.error = consoleError;
  });

  it('errors when props.stripe is a string', () => {
    const consoleError = console.error;
    console.error = () => {};

    expect(() =>
      mount(
        <Elements stripe="wat">
          <InjectedTestComponent />
        </Elements>
      )
    ).toThrow('Invalid prop `stripe` supplied to `Elements`.');
    console.error = consoleError;
  });

  it('does not allow changes to a set Stripe object', () => {
    const wrapper = mount(<Elements stripe={stripe} />);

    const consoleWarn = console.warn;
    console.warn = jest.fn();

    const stripe2 = mockStripe();
    wrapper.setProps({stripe: stripe2});

    expect(stripe.elements.mock.calls).toHaveLength(1);
    expect(stripe2.elements.mock.calls).toHaveLength(0);
    expect(console.warn).toHaveBeenCalledWith(
      'Unsupported prop change on Elements: You cannot change the `stripe` prop after setting it.'
    );

    console.warn = consoleWarn;
  });

  it('does not allow changes to options after setting the Stripe object', () => {
    const wrapper = mount(<Elements stripe={stripe} options={{foo: 'foo'}} />);

    const consoleWarn = console.warn;
    console.warn = jest.fn();

    wrapper.setProps({options: {bar: 'bar'}});

    expect(stripe.elements).toHaveBeenCalledWith({foo: 'foo'});
    expect(stripe.elements.mock.calls).toHaveLength(1);

    expect(console.warn).toHaveBeenCalledWith(
      'Unsupported prop change on Elements: You cannot change the `options` prop after setting the `stripe` prop.'
    );

    console.warn = consoleWarn;
  });

  it('allows options changes before setting the Stripe object', () => {
    const wrapper = mount(<Elements stripe={null} options={{foo: 'foo'}} />);

    const consoleWarn = console.warn;
    console.warn = jest.fn();

    wrapper.setProps({options: {bar: 'bar'}});

    expect(console.warn).not.toHaveBeenCalled();

    wrapper.setProps({stripe});

    expect(stripe.elements).toHaveBeenCalledWith({bar: 'bar'});

    console.warn = consoleWarn;
  });

  it('throws when trying to call useElements outside of Elements context', () => {
    const consoleError = console.error;
    console.error = () => {};
    expect(() => mount(<InjectedTestComponent />)).toThrow(
      'It looks like you are trying to inject Stripe context outside of an Elements context.'
    );
    console.error = consoleError;
  });

  it('throws when trying to mount an injected component outside of Elements context', () => {
    const consoleError = console.error;
    console.error = () => {};
    const WithAHOC = injectElements(TestComponent);
    expect(() => mount(<WithAHOC />)).toThrow(
      'It looks like you are trying to inject Stripe context outside of an Elements context.'
    );
    console.error = consoleError;
  });
});
