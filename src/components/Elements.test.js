// @noflow
import React from 'react';
import {mount} from 'enzyme';
import {Elements, useElements, ElementsConsumer} from './Elements';
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

  it('injects elements with the useElements hook', () => {
    const wrapper = mount(
      <Elements stripe={stripe}>
        <InjectedTestComponent />
      </Elements>
    );

    expect(wrapper.find(TestComponent).prop('elements')).toBe(mockElements);
  });

  it('only creates elements once', () => {
    mount(
      <Elements stripe={stripe}>
        <InjectedTestComponent />
      </Elements>
    );

    expect(stripe.elements.mock.calls).toHaveLength(1);
  });

  it('provides elements with the ElementsConsumer component', () => {
    const wrapper = mount(
      <Elements stripe={stripe}>
        <ElementsConsumer>
          {(elements) => <TestComponent elements={elements} />}
        </ElementsConsumer>
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
    // Prevent the console.errors to keep the test output clean
    jest.spyOn(console, 'error');
    console.error.mockImplementation(() => {});

    expect(() =>
      mount(
        <Elements stripe={false}>
          <InjectedTestComponent />
        </Elements>
      )
    ).toThrow('Invalid prop `stripe` supplied to `Elements`.');

    console.error.mockRestore();
  });

  it('errors when props.stripe is a string', () => {
    // Prevent the console.errors to keep the test output clean
    jest.spyOn(console, 'error');
    console.error.mockImplementation(() => {});

    expect(() =>
      mount(
        <Elements stripe="wat">
          <InjectedTestComponent />
        </Elements>
      )
    ).toThrow('Invalid prop `stripe` supplied to `Elements`.');
    console.error.mockRestore();
  });

  it('does not allow changes to a set Stripe object', () => {
    const wrapper = mount(<Elements stripe={stripe} />);

    jest.spyOn(console, 'warn');
    console.warn.mockImplementation(() => {});

    const stripe2 = mockStripe();
    wrapper.setProps({stripe: stripe2});

    expect(stripe.elements.mock.calls).toHaveLength(1);
    expect(stripe2.elements.mock.calls).toHaveLength(0);
    expect(console.warn).toHaveBeenCalledWith(
      'Unsupported prop change on Elements: You cannot change the `stripe` prop after setting it.'
    );

    console.warn.mockRestore();
  });

  it('does not allow changes to options after setting the Stripe object', () => {
    const wrapper = mount(<Elements stripe={stripe} options={{foo: 'foo'}} />);

    jest.spyOn(console, 'warn');
    console.warn.mockImplementation(() => {});

    wrapper.setProps({options: {bar: 'bar'}});

    expect(stripe.elements).toHaveBeenCalledWith({foo: 'foo'});
    expect(stripe.elements.mock.calls).toHaveLength(1);

    expect(console.warn).toHaveBeenCalledWith(
      'Unsupported prop change on Elements: You cannot change the `options` prop after setting the `stripe` prop.'
    );

    console.warn.mockRestore();
  });

  it('allows options changes before setting the Stripe object', () => {
    const wrapper = mount(<Elements stripe={null} options={{foo: 'foo'}} />);

    jest.spyOn(console, 'warn');
    console.warn.mockImplementation(() => {});

    wrapper.setProps({options: {bar: 'bar'}});

    expect(console.warn).not.toHaveBeenCalled();

    wrapper.setProps({stripe});

    expect(stripe.elements).toHaveBeenCalledWith({bar: 'bar'});

    console.warn.mockRestore();
  });

  it('throws when trying to call useElements outside of Elements context', () => {
    // Prevent the console.errors to keep the test output clean
    jest.spyOn(console, 'error');
    console.error.mockImplementation(() => {});
    expect(() => mount(<InjectedTestComponent />)).toThrow(
      'Could not find elements context; You need to wrap the part of your app that is calling useElements() in an <Elements> provider.'
    );
    console.error.mockRestore();
  });

  it('throws when trying to mount an <ElementsConsumer> outside of Elements context', () => {
    // Prevent the console.errors to keep the test output clean
    jest.spyOn(console, 'error');
    console.error.mockImplementation(() => {});
    const WithAConsumer = () => (
      <ElementsConsumer>
        {(elements) => <TestComponent elements={elements} />}
      </ElementsConsumer>
    );

    expect(() => mount(<WithAConsumer />)).toThrow(
      'Could not find elements context; You need to wrap the part of your app that is mounting <ElementsConsumer> in an <Elements> provider.'
    );
    console.error.mockRestore();
  });
});
