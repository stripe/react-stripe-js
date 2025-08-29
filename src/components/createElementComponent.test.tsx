import React, {StrictMode} from 'react';
import {render, act, waitFor} from '@testing-library/react';

import * as ElementsModule from './Elements';
import * as CheckoutModule from './CheckoutProvider';
import createElementComponent from './createElementComponent';
import * as mocks from '../../test/mocks';
import {
  CardElementComponent,
  PaymentElementComponent,
  PaymentRequestButtonElementComponent,
  ExpressCheckoutElementComponent,
  AddressElementComponent,
} from '../types';

const {Elements} = ElementsModule;
const {CheckoutProvider} = CheckoutModule;

describe('createElementComponent', () => {
  let mockStripe: any;
  let mockElements: any;
  let mockElement: any;
  let mockCheckoutSdk: any;

  let simulateElementsEvents: Record<string, any[]>;
  let simulateOn: any;
  let simulateOff: any;
  const simulateEvent = (event: string, ...args: any[]) => {
    simulateElementsEvents[event].forEach((fn) => fn(...args));
  };

  beforeEach(() => {
    mockStripe = mocks.mockStripe();
    mockElements = mocks.mockElements();
    mockCheckoutSdk = mocks.mockCheckoutSdk();
    mockElement = mocks.mockElement();
    mockStripe.elements.mockReturnValue(mockElements);
    mockElements.create.mockReturnValue(mockElement);
    mockStripe.initCheckout.mockResolvedValue(mockCheckoutSdk);
    mockCheckoutSdk.createPaymentElement.mockReturnValue(mockElement);
    mockCheckoutSdk.createBillingAddressElement.mockReturnValue(mockElement);
    mockCheckoutSdk.createShippingAddressElement.mockReturnValue(mockElement);
    mockCheckoutSdk.createExpressCheckoutElement.mockReturnValue(mockElement);
    jest.spyOn(React, 'useLayoutEffect');

    simulateElementsEvents = {};
    simulateOn = jest.fn((event, fn) => {
      simulateElementsEvents[event] = [
        ...(simulateElementsEvents[event] || []),
        fn,
      ];
    });
    simulateOff = jest.fn((event, fn) => {
      simulateElementsEvents[event] = simulateElementsEvents[event].filter(
        (previouslyAddedFn) => previouslyAddedFn !== fn
      );
    });

    mockElement.on = simulateOn;
    mockElement.off = simulateOff;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('on the server - only for Elements', () => {
    const CardElement = createElementComponent('card', true);
    it('passes id to the wrapping DOM element', () => {
      const {container} = render(
        <Elements stripe={null}>
          <CardElement id="foo" />
        </Elements>
      );

      const elementContainer = container.firstChild as Element;

      expect(elementContainer.id).toBe('foo');
    });

    it('passes className to the wrapping DOM element', () => {
      const {container} = render(
        <Elements stripe={null}>
          <CardElement className="bar" />
        </Elements>
      );
      const elementContainer = container.firstChild as Element;
      expect(elementContainer).toHaveClass('bar');
    });
  });

  describe('on the server - only for CheckoutProvider', () => {
    const CardElement = createElementComponent('card', true);

    it('does not render anything', () => {
      const {container} = render(
        <CheckoutProvider
          stripe={null}
          options={{fetchClientSecret: async () => ''}}
        >
          <CardElement />
        </CheckoutProvider>
      );

      expect(container.firstChild).toBe(null);
    });
  });

  describe.each([
    ['Elements', Elements, {clientSecret: 'pi_123'}],
    [
      'CheckoutProvider',
      CheckoutProvider,
      {fetchClientSecret: async () => 'cs_123'} as any,
    ],
  ])(
    'on the server with Provider - %s',
    (_providerName, Provider, providerOptions) => {
      const CardElement = createElementComponent('card', true);

      it('gives the element component a proper displayName', () => {
        expect(CardElement.displayName).toBe('CardElement');
      });

      it('stores the element component`s type as a static property', () => {
        expect((CardElement as any).__elementType).toBe('card');
      });

      it('throws when the Element is mounted outside of Elements context', () => {
        // Prevent the console.errors to keep the test output clean
        jest.spyOn(console, 'error');
        (console.error as any).mockImplementation(() => {});

        expect(() => render(<CardElement />)).toThrow(
          'Could not find Elements context; You need to wrap the part of your app that mounts <CardElement> in an <Elements> provider.'
        );
      });

      it('does not call useLayoutEffect', () => {
        render(
          <Provider stripe={null} options={providerOptions}>
            <CardElement />
          </Provider>
        );

        expect(React.useLayoutEffect).not.toHaveBeenCalled();
      });
    }
  );

  describe('on the client', () => {
    const CardElement: CardElementComponent = createElementComponent(
      'card',
      false
    );
    const PaymentRequestButtonElement: PaymentRequestButtonElementComponent = createElementComponent(
      'card',
      false
    );
    const PaymentElement: PaymentElementComponent = createElementComponent(
      'payment',
      false
    );
    const AddressElement: AddressElementComponent = createElementComponent(
      'address',
      false
    );

    const ExpressCheckoutElement: ExpressCheckoutElementComponent = createElementComponent(
      'expressCheckout',
      false
    );

    it('Can remove and add CardElement at the same time', () => {
      let cardMounted = false;
      mockElement.mount.mockImplementation(() => {
        if (cardMounted) {
          throw new Error('Card already mounted');
        }
        cardMounted = true;
      });
      mockElement.destroy.mockImplementation(() => {
        cardMounted = false;
      });

      const {rerender} = render(
        <Elements stripe={mockStripe}>
          <CardElement key={'1'} />
        </Elements>
      );
      rerender(
        <Elements stripe={mockStripe}>
          <CardElement key={'2'} />
        </Elements>
      );

      expect(mockElement.mount).toHaveBeenCalledTimes(2);
    });

    it('gives the element component a proper displayName', () => {
      expect(CardElement.displayName).toBe('CardElement');
    });

    it('stores the element component`s type as a static property', () => {
      expect((CardElement as any).__elementType).toBe('card');
    });

    it('passes id to the wrapping DOM element', () => {
      const {container} = render(
        <Elements stripe={mockStripe}>
          <CardElement id="foo" />
        </Elements>
      );
      const elementContainer = container.firstChild as Element;

      expect(elementContainer.id).toBe('foo');
    });

    it('passes className to the wrapping DOM element', () => {
      const {container} = render(
        <Elements stripe={mockStripe}>
          <CardElement className="bar" />
        </Elements>
      );
      const elementContainer = container.firstChild as Element;

      expect(elementContainer).toHaveClass('bar');
    });

    it('creates the element with options', () => {
      const options: any = {foo: 'foo'};
      render(
        <Elements stripe={mockStripe}>
          <CardElement options={options} />
        </Elements>
      );

      expect(mockElements.create).toHaveBeenCalledWith('card', options);

      expect(simulateOn).not.toBeCalled();
      expect(simulateOff).not.toBeCalled();
    });

    it('creates, destroys, then re-creates element in strict mode', () => {
      expect.assertions(4);

      let elementCreated = false;

      mockElements.create.mockImplementation(() => {
        expect(elementCreated).toBe(false);
        elementCreated = true;

        return mockElement;
      });

      mockElement.destroy.mockImplementation(() => {
        elementCreated = false;
      });

      render(
        <StrictMode>
          <Elements stripe={mockStripe}>
            <CardElement />
          </Elements>
        </StrictMode>
      );

      expect(mockElements.create).toHaveBeenCalledTimes(2);
      expect(mockElement.destroy).toHaveBeenCalledTimes(1);
    });

    it('mounts the element', () => {
      const {container} = render(
        <Elements stripe={mockStripe}>
          <CardElement />
        </Elements>
      );

      expect(mockElement.mount).toHaveBeenCalledWith(container.firstChild);
      expect(React.useLayoutEffect).toHaveBeenCalled();

      expect(simulateOn).not.toBeCalled();
      expect(simulateOff).not.toBeCalled();
    });

    it('does not create and mount until Elements has been instantiated', () => {
      const {rerender} = render(
        <Elements stripe={null}>
          <CardElement />
        </Elements>
      );

      expect(mockElement.mount).not.toHaveBeenCalled();
      expect(mockElements.create).not.toHaveBeenCalled();

      rerender(
        <Elements stripe={mockStripe}>
          <CardElement />
        </Elements>
      );

      expect(mockElement.mount).toHaveBeenCalled();
      expect(mockElements.create).toHaveBeenCalled();
    });

    it('throws when the Element is mounted outside of Elements context', () => {
      // Prevent the console.errors to keep the test output clean
      jest.spyOn(console, 'error');
      (console.error as any).mockImplementation(() => {});

      expect(() => render(<CardElement />)).toThrow(
        'Could not find Elements context; You need to wrap the part of your app that mounts <CardElement> in an <Elements> provider.'
      );
    });

    it('adds an event handlers to an Element', () => {
      const mockHandler = jest.fn();
      render(
        <Elements stripe={mockStripe}>
          <CardElement onChange={mockHandler} />
        </Elements>
      );

      const changeEventMock = Symbol('change');
      simulateEvent('change', changeEventMock);
      expect(mockHandler).toHaveBeenCalledWith(changeEventMock);
    });

    it('attaches event listeners once the element is created', () => {
      jest
        .spyOn(CheckoutModule, 'useElementsOrCheckoutSdkContextWithUseCase')
        .mockReturnValueOnce({elements: null, stripe: null})
        .mockReturnValue({elements: mockElements, stripe: mockStripe});

      const mockHandler = jest.fn();

      // This won't create the element, since elements is undefined on this render
      const {rerender} = render(
        <Elements stripe={mockStripe}>
          <CardElement onChange={mockHandler} />
        </Elements>
      );
      expect(mockElements.create).not.toBeCalled();

      expect(simulateOn).not.toBeCalled();

      // This creates the element now that elements is defined
      rerender(
        <Elements stripe={mockStripe}>
          <CardElement onChange={mockHandler} />
        </Elements>
      );
      expect(mockElements.create).toBeCalled();

      expect(simulateOn).toBeCalledWith('change', expect.any(Function));
      expect(simulateOff).not.toBeCalled();

      const changeEventMock = Symbol('change');
      simulateEvent('change', changeEventMock);
      expect(mockHandler).toHaveBeenCalledWith(changeEventMock);
    });

    it('adds event handler on re-render', () => {
      const mockHandler = jest.fn();
      const {rerender} = render(
        <Elements stripe={mockStripe}>
          <CardElement onChange={mockHandler} />
        </Elements>
      );

      expect(simulateOn).toBeCalledWith('change', expect.any(Function));
      expect(simulateOff).not.toBeCalled();

      rerender(
        <Elements stripe={mockStripe}>
          <CardElement />
        </Elements>
      );

      expect(simulateOff).toBeCalledWith('change', expect.any(Function));
    });

    it('removes event handler when removed on re-render', () => {
      const mockHandler = jest.fn();
      const {rerender} = render(
        <Elements stripe={mockStripe}>
          <CardElement onChange={mockHandler} />
        </Elements>
      );

      expect(simulateOn).toBeCalledWith('change', expect.any(Function));
      expect(simulateOff).not.toBeCalled();

      rerender(
        <Elements stripe={mockStripe}>
          <CardElement />
        </Elements>
      );

      expect(simulateOff).toBeCalledWith('change', expect.any(Function));
    });

    it('does not call on/off when an event handler changes', () => {
      const mockHandler = jest.fn();
      const mockHandler2 = jest.fn();

      const {rerender} = render(
        <Elements stripe={mockStripe}>
          <CardElement onChange={mockHandler} />
        </Elements>
      );

      expect(simulateOn).toBeCalledWith('change', expect.any(Function));

      rerender(
        <Elements stripe={mockStripe}>
          <CardElement onChange={mockHandler2} />
        </Elements>
      );

      expect(simulateOn).toBeCalledTimes(1);
      expect(simulateOff).not.toBeCalled();
    });

    it('propagates the Element`s ready event to the current onReady prop', () => {
      const mockHandler = jest.fn();
      const mockHandler2 = jest.fn();
      const {rerender} = render(
        <Elements stripe={mockStripe}>
          <CardElement onReady={mockHandler} />
        </Elements>
      );
      rerender(
        <Elements stripe={mockStripe}>
          <CardElement onReady={mockHandler2} />
        </Elements>
      );

      const mockEvent = Symbol('ready');
      simulateEvent('ready', mockEvent);
      expect(mockHandler2).toHaveBeenCalledWith(mockElement);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('propagates the Express Checkout Element`s ready event to the current onReady prop', () => {
      const mockHandler = jest.fn();
      const mockHandler2 = jest.fn();
      const {rerender} = render(
        <Elements stripe={mockStripe}>
          <ExpressCheckoutElement onReady={mockHandler} onConfirm={() => {}} />
        </Elements>
      );
      rerender(
        <Elements stripe={mockStripe}>
          <ExpressCheckoutElement onReady={mockHandler2} onConfirm={() => {}} />
        </Elements>
      );

      const mockEvent = Symbol('ready');
      simulateEvent('ready', mockEvent);
      expect(mockHandler2).toHaveBeenCalledWith(mockEvent);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('propagates the Element`s change event to the current onChange prop', () => {
      const mockHandler = jest.fn();
      const mockHandler2 = jest.fn();
      const {rerender} = render(
        <Elements stripe={mockStripe}>
          <CardElement onChange={mockHandler} />
        </Elements>
      );
      rerender(
        <Elements stripe={mockStripe}>
          <CardElement onChange={mockHandler2} />
        </Elements>
      );

      const changeEventMock = Symbol('change');
      simulateEvent('change', changeEventMock);
      expect(mockHandler2).toHaveBeenCalledWith(changeEventMock);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('propagates the Element`s blur event to the current onBlur prop', () => {
      const mockHandler = jest.fn();
      const mockHandler2 = jest.fn();
      const {rerender} = render(
        <Elements stripe={mockStripe}>
          <CardElement onBlur={mockHandler} />
        </Elements>
      );
      rerender(
        <Elements stripe={mockStripe}>
          <CardElement onBlur={mockHandler2} />
        </Elements>
      );

      simulateEvent('blur');
      expect(mockHandler2).toHaveBeenCalledWith();
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('propagates the Element`s focus event to the current onFocus prop', () => {
      const mockHandler = jest.fn();
      const mockHandler2 = jest.fn();
      const {rerender} = render(
        <Elements stripe={mockStripe}>
          <CardElement onFocus={mockHandler} />
        </Elements>
      );
      rerender(
        <Elements stripe={mockStripe}>
          <CardElement onFocus={mockHandler2} />
        </Elements>
      );

      simulateEvent('focus');
      expect(mockHandler2).toHaveBeenCalledWith();
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('propagates the Element`s escape event to the current onEscape prop', () => {
      const mockHandler = jest.fn();
      const mockHandler2 = jest.fn();
      const {rerender} = render(
        <Elements stripe={mockStripe}>
          <CardElement onEscape={mockHandler} />
        </Elements>
      );
      rerender(
        <Elements stripe={mockStripe}>
          <CardElement onEscape={mockHandler2} />
        </Elements>
      );

      simulateEvent('escape');
      expect(mockHandler2).toHaveBeenCalledWith();
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('propagates the Element`s click event to the current onClick prop', () => {
      const mockHandler = jest.fn();
      const mockHandler2 = jest.fn();
      const {rerender} = render(
        <Elements stripe={mockStripe}>
          <PaymentRequestButtonElement onClick={mockHandler} />
        </Elements>
      );
      rerender(
        <Elements stripe={mockStripe}>
          <PaymentRequestButtonElement onClick={mockHandler2} />
        </Elements>
      );

      const clickEventMock = Symbol('click');
      simulateEvent('click', clickEventMock);
      expect(mockHandler2).toHaveBeenCalledWith(clickEventMock);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('propagates the Element`s loaderror event to the current onLoadError prop', () => {
      const mockHandler = jest.fn();
      const mockHandler2 = jest.fn();
      const {rerender} = render(
        <Elements stripe={mockStripe}>
          <PaymentElement onLoadError={mockHandler} />
        </Elements>
      );
      rerender(
        <Elements stripe={mockStripe}>
          <PaymentElement onLoadError={mockHandler2} />
        </Elements>
      );

      const loadErrorEventMock = Symbol('loaderror');
      simulateEvent('loaderror', loadErrorEventMock);
      expect(mockHandler2).toHaveBeenCalledWith(loadErrorEventMock);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('propagates the Element`s loaderstart event to the current onLoaderStart prop', () => {
      const mockHandler = jest.fn();
      const mockHandler2 = jest.fn();
      const {rerender} = render(
        <Elements stripe={mockStripe}>
          <PaymentElement onLoaderStart={mockHandler} />
        </Elements>
      );
      rerender(
        <Elements stripe={mockStripe}>
          <PaymentElement onLoaderStart={mockHandler2} />
        </Elements>
      );

      simulateEvent('loaderstart');
      expect(mockHandler2).toHaveBeenCalledWith();
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('propagates the Element`s networkschange event to the current onNetworksChange prop', () => {
      const mockHandler = jest.fn();
      const mockHandler2 = jest.fn();
      const {rerender} = render(
        <Elements stripe={mockStripe}>
          <CardElement onNetworksChange={mockHandler} />
        </Elements>
      );
      rerender(
        <Elements stripe={mockStripe}>
          <CardElement onNetworksChange={mockHandler2} />
        </Elements>
      );

      simulateEvent('networkschange');
      expect(mockHandler2).toHaveBeenCalledWith();
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('propagates the Element`s confirm event to the current onConfirm prop', () => {
      const mockHandler = jest.fn();
      const mockHandler2 = jest.fn();
      const {rerender} = render(
        <Elements stripe={mockStripe}>
          <ExpressCheckoutElement onConfirm={mockHandler} />
        </Elements>
      );
      rerender(
        <Elements stripe={mockStripe}>
          <ExpressCheckoutElement onConfirm={mockHandler2} />
        </Elements>
      );

      const confirmEventMock = Symbol('confirm');
      simulateEvent('confirm', confirmEventMock);
      expect(mockHandler2).toHaveBeenCalledWith(confirmEventMock);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('propagates the Element`s cancel event to the current onCancel prop', () => {
      const mockHandler = jest.fn();
      const mockHandler2 = jest.fn();
      const {rerender} = render(
        <Elements stripe={mockStripe}>
          <ExpressCheckoutElement onConfirm={() => {}} onCancel={mockHandler} />
        </Elements>
      );
      rerender(
        <Elements stripe={mockStripe}>
          <ExpressCheckoutElement
            onConfirm={() => {}}
            onCancel={mockHandler2}
          />
        </Elements>
      );

      const cancelEventMock = Symbol('cancel');
      simulateEvent('cancel', cancelEventMock);
      expect(mockHandler2).toHaveBeenCalledWith(cancelEventMock);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('propagates the Element`s shippingaddresschange event to the current onShippingAddressChange prop', () => {
      const mockHandler = jest.fn();
      const mockHandler2 = jest.fn();
      const {rerender} = render(
        <Elements stripe={mockStripe}>
          <ExpressCheckoutElement
            onConfirm={() => {}}
            onShippingAddressChange={mockHandler}
          />
        </Elements>
      );
      rerender(
        <Elements stripe={mockStripe}>
          <ExpressCheckoutElement
            onConfirm={() => {}}
            onShippingAddressChange={mockHandler2}
          />
        </Elements>
      );

      const shippingAddressChangeEventMock = Symbol('shippingaddresschange');
      simulateEvent('shippingaddresschange', shippingAddressChangeEventMock);
      expect(mockHandler2).toHaveBeenCalledWith(shippingAddressChangeEventMock);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('propagates the Element`s shippingratechange event to the current onShippingRateChange prop', () => {
      const mockHandler = jest.fn();
      const mockHandler2 = jest.fn();
      const {rerender} = render(
        <Elements stripe={mockStripe}>
          <ExpressCheckoutElement
            onConfirm={() => {}}
            onShippingRateChange={mockHandler}
          />
        </Elements>
      );
      rerender(
        <Elements stripe={mockStripe}>
          <ExpressCheckoutElement
            onConfirm={() => {}}
            onShippingRateChange={mockHandler2}
          />
        </Elements>
      );

      const shippingRateChangeEventMock = Symbol('shippingratechange');
      simulateEvent('shippingratechange', shippingRateChangeEventMock);
      expect(mockHandler2).toHaveBeenCalledWith(shippingRateChangeEventMock);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('propagates the Element`s savedpaymentmethodremove event to the current onSavedPaymentMethodRemove prop', () => {
      const mockHandler = jest.fn();
      const mockHandler2 = jest.fn();
      const {rerender} = render(
        <Elements stripe={mockStripe}>
          <PaymentElement onSavedPaymentMethodRemove={mockHandler} />
        </Elements>
      );
      rerender(
        <Elements stripe={mockStripe}>
          <PaymentElement onSavedPaymentMethodRemove={mockHandler2} />
        </Elements>
      );

      const removeEventMock = Symbol('savedpaymentmethodremove');
      simulateEvent('savedpaymentmethodremove', removeEventMock);
      expect(mockHandler2).toHaveBeenCalledWith(removeEventMock);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('propagates the Element`s savedpaymentmethodupdate event to the current onSavedPaymentMethodUpdate prop', () => {
      const mockHandler = jest.fn();
      const mockHandler2 = jest.fn();
      const {rerender} = render(
        <Elements stripe={mockStripe}>
          <PaymentElement onSavedPaymentMethodUpdate={mockHandler} />
        </Elements>
      );
      rerender(
        <Elements stripe={mockStripe}>
          <PaymentElement onSavedPaymentMethodUpdate={mockHandler2} />
        </Elements>
      );

      const updateEventMock = Symbol('savedpaymentmethodupdate');
      simulateEvent('savedpaymentmethodupdate', updateEventMock);
      expect(mockHandler2).toHaveBeenCalledWith(updateEventMock);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('updates the Element when options change', () => {
      const {rerender} = render(
        <Elements stripe={mockStripe}>
          <CardElement options={{style: {base: {fontSize: '20px'}}}} />
        </Elements>
      );

      rerender(
        <Elements stripe={mockStripe}>
          <CardElement options={{style: {base: {fontSize: '30px'}}}} />
        </Elements>
      );

      expect(mockElement.update).toHaveBeenCalledWith({
        style: {base: {fontSize: '30px'}},
      });
    });

    it('does not trigger unnecessary updates', () => {
      const {rerender} = render(
        <Elements stripe={mockStripe}>
          <CardElement options={{style: {base: {fontSize: '20px'}}}} />
        </Elements>
      );

      rerender(
        <Elements stripe={mockStripe}>
          <CardElement options={{style: {base: {fontSize: '20px'}}}} />
        </Elements>
      );

      expect(mockElement.update).not.toHaveBeenCalled();
    });

    it('warns on changes to non-updatable options', () => {
      jest.spyOn(console, 'warn');
      (console.warn as any).mockImplementation(() => {});

      const {rerender} = render(
        <Elements stripe={mockStripe}>
          <PaymentRequestButtonElement
            options={{
              paymentRequest: Symbol('PaymentRequest') as any,
            }}
          />
        </Elements>
      );

      rerender(
        <Elements stripe={mockStripe}>
          <PaymentRequestButtonElement
            options={{
              paymentRequest: Symbol('PaymentRequest') as any,
            }}
          />
        </Elements>
      );

      expect(mockElement.update).not.toHaveBeenCalled();

      expect(console.warn).toHaveBeenCalledWith(
        'Unsupported prop change: options.paymentRequest is not a mutable property.'
      );
    });

    it('destroys an existing Element when the component unmounts', () => {
      const {unmount} = render(
        <Elements stripe={null}>
          <CardElement />
        </Elements>
      );

      unmount();

      // not called when Element has not been mounted (because stripe is still loading)
      expect(mockElement.destroy).not.toHaveBeenCalled();

      const {unmount: unmount2} = render(
        <Elements stripe={mockStripe}>
          <CardElement />
        </Elements>
      );

      unmount2();
      expect(mockElement.destroy).toHaveBeenCalled();
    });

    it('destroys an existing Element when the component unmounts with an async stripe prop', async () => {
      const stripePromise = Promise.resolve(mockStripe);

      const {unmount} = render(
        <Elements stripe={stripePromise}>
          <CardElement />
        </Elements>
      );

      await act(() => stripePromise);

      unmount();
      expect(mockElement.destroy).toHaveBeenCalled();
    });

    it('destroys an existing Element when the component unmounts with an async stripe prop in StrictMode', async () => {
      const stripePromise = Promise.resolve(mockStripe);

      const {unmount} = render(
        <StrictMode>
          <Elements stripe={stripePromise}>
            <CardElement />
          </Elements>
        </StrictMode>
      );

      await act(() => stripePromise);

      unmount();
      expect(mockElement.destroy).toHaveBeenCalled();
    });

    it('updates the Element when options change from null to non-null value', () => {
      const {rerender} = render(
        <Elements stripe={mockStripe}>
          {/* @ts-expect-error */}
          <CardElement options={null} />
        </Elements>
      );

      rerender(
        <Elements stripe={mockStripe}>
          <CardElement options={{style: {base: {fontSize: '30px'}}}} />
        </Elements>
      );

      expect(mockElement.update).toHaveBeenCalledWith({
        style: {base: {fontSize: '30px'}},
      });
    });

    describe('Within a CheckoutProvider', () => {
      let peMounted = false;
      let result: any;
      beforeEach(() => {
        peMounted = false;
        result = null;

        mockElement.mount.mockImplementation(() => {
          if (peMounted) {
            throw new Error('Element already mounted');
          }
          peMounted = true;
        });
        mockElement.destroy.mockImplementation(() => {
          peMounted = false;
        });
      });
      it('Can remove and add PaymentElement at the same time', async () => {
        act(() => {
          result = render(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement key={'100'} />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());
        expect(mockElement.mount).toHaveBeenCalledTimes(1);

        const rerender = result.rerender;
        act(() => {
          rerender(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement key={'200'} />
            </CheckoutProvider>
          );
        });

        await waitFor(() => expect(peMounted).toBeTruthy());
        expect(mockElement.mount).toHaveBeenCalledTimes(2);
      });

      it('passes id to the wrapping DOM element', async () => {
        act(() => {
          result = render(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement id="foo" />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());
        const {container} = result;
        const elementContainer = container.firstChild as Element;

        expect(elementContainer.id).toBe('foo');
      });

      it('passes className to the wrapping DOM element', async () => {
        act(() => {
          result = render(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement className="bar" />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());
        const {container} = result;
        const elementContainer = container.firstChild as Element;

        expect(elementContainer).toHaveClass('bar');
      });

      it('creates the element with options', async () => {
        const options: any = {foo: 'foo'};
        act(() => {
          result = render(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement options={options} />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());
        expect(mockCheckoutSdk.createPaymentElement).toHaveBeenCalledWith(
          options
        );
        expect(simulateOn).not.toBeCalled();
        expect(simulateOff).not.toBeCalled();
      });

      it('creates, destroys, then re-creates element in strict mode', async () => {
        let elementCreated = false;
        let elementMounted = false;

        mockCheckoutSdk.createPaymentElement.mockImplementation(() => {
          expect(elementCreated).toBe(false);
          elementCreated = true;

          return mockElement;
        });
        mockElement.mount.mockImplementation(() => {
          expect(elementMounted).toBe(false);
          elementMounted = true;
        });

        mockElement.destroy.mockImplementation(() => {
          elementCreated = false;
          elementMounted = false;
        });

        act(() => {
          result = render(
            <StrictMode>
              <CheckoutProvider
                stripe={mockStripe}
                options={{fetchClientSecret: async () => 'cs_123'}}
              >
                <PaymentElement />
              </CheckoutProvider>
            </StrictMode>
          );
        });
        await waitFor(() => expect(elementMounted).toBeTruthy());

        expect(mockCheckoutSdk.createPaymentElement).toHaveBeenCalledTimes(2);
        expect(mockElement.mount).toHaveBeenCalledTimes(2);
        expect(mockElement.destroy).toHaveBeenCalledTimes(1);
      });

      it('mounts the element', async () => {
        act(() => {
          result = render(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());

        const {container} = result;

        expect(mockElement.mount).toHaveBeenCalledWith(container.firstChild);
        expect(React.useLayoutEffect).toHaveBeenCalled();

        expect(simulateOn).not.toBeCalled();
        expect(simulateOff).not.toBeCalled();
      });

      it('does not create and mount until CheckoutSdk has been instantiated', async () => {
        act(() => {
          result = render(
            <CheckoutProvider
              stripe={null}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement />
            </CheckoutProvider>
          );
        });

        expect(mockElement.mount).not.toHaveBeenCalled();
        expect(mockElements.create).not.toHaveBeenCalled();

        const {rerender} = result;

        act(() => {
          rerender(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());

        expect(mockElement.mount).toHaveBeenCalled();
        expect(mockCheckoutSdk.createPaymentElement).toHaveBeenCalled();
      });

      it('adds an event handlers to an Element', async () => {
        const mockHandler = jest.fn();

        act(() => {
          result = render(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement onChange={mockHandler} />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());

        const changeEventMock = Symbol('change');
        simulateEvent('change', changeEventMock);
        expect(mockHandler).toHaveBeenCalledWith(changeEventMock);
      });

      it('attaches event listeners once the element is created', async () => {
        const mockHandler = jest.fn();

        // This won't create the element, since checkoutSdk is undefined on this render
        act(() => {
          result = render(
            <CheckoutProvider
              stripe={null}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement onChange={mockHandler} />
            </CheckoutProvider>
          );
        });
        expect(mockCheckoutSdk.createPaymentElement).not.toBeCalled();

        expect(simulateOn).not.toBeCalled();

        // This creates the element now that checkoutSdk is defined
        act(() => {
          result.rerender(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement onChange={mockHandler} />
            </CheckoutProvider>
          );
        });

        await waitFor(() => expect(peMounted).toBeTruthy());
        expect(mockCheckoutSdk.createPaymentElement).toBeCalled();

        expect(simulateOn).toBeCalledWith('change', expect.any(Function));
        expect(simulateOff).not.toBeCalled();

        const changeEventMock = Symbol('change');
        simulateEvent('change', changeEventMock);
        expect(mockHandler).toHaveBeenCalledWith(changeEventMock);
      });

      it('adds event handler on re-render', async () => {
        const mockHandler = jest.fn();
        act(() => {
          result = render(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement onChange={mockHandler} />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());
        const {rerender} = result;

        expect(simulateOn).toBeCalledWith('change', expect.any(Function));
        expect(simulateOff).not.toBeCalled();

        act(() => {
          rerender(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement onChange={mockHandler} />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());

        expect(simulateOn).toBeCalledWith('change', expect.any(Function));
      });

      it('removes event handler when removed on re-render', async () => {
        const mockHandler = jest.fn();
        act(() => {
          result = render(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement onChange={mockHandler} />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());
        const {rerender} = result;

        expect(simulateOn).toBeCalledWith('change', expect.any(Function));
        expect(simulateOff).not.toBeCalled();

        act(() => {
          rerender(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());

        expect(simulateOff).toBeCalledWith('change', expect.any(Function));
      });

      it('does not call on/off when an event handler changes', async () => {
        const mockHandler = jest.fn();
        const mockHandler2 = jest.fn();

        act(() => {
          result = render(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement onChange={mockHandler} />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());
        const {rerender} = result;

        expect(simulateOn).toBeCalledWith('change', expect.any(Function));

        act(() => {
          rerender(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement onChange={mockHandler2} />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());

        expect(simulateOn).toBeCalledTimes(1);
        expect(simulateOff).not.toBeCalled();
      });

      it('propagates the Element`s ready event to the current onReady prop', async () => {
        const mockHandler = jest.fn();
        const mockHandler2 = jest.fn();

        act(() => {
          result = render(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement onReady={mockHandler} />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());
        const {rerender} = result;
        act(() => {
          rerender(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement onReady={mockHandler2} />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());

        const mockEvent = Symbol('ready');
        simulateEvent('ready', mockEvent);
        expect(mockHandler2).toHaveBeenCalledWith(mockElement);
        expect(mockHandler).not.toHaveBeenCalled();
      });

      it('propagates the Element`s change event to the current onChange prop', async () => {
        const mockHandler = jest.fn();
        const mockHandler2 = jest.fn();

        act(() => {
          result = render(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement onChange={mockHandler} />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());
        const {rerender} = result;

        act(() => {
          rerender(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement onChange={mockHandler2} />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());

        const changeEventMock = Symbol('change');
        simulateEvent('change', changeEventMock);
        expect(mockHandler2).toHaveBeenCalledWith(changeEventMock);
        expect(mockHandler).not.toHaveBeenCalled();
      });

      it('propagates the Element`s blur event to the current onBlur prop', async () => {
        const mockHandler = jest.fn();
        const mockHandler2 = jest.fn();
        act(() => {
          result = render(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement onBlur={mockHandler} />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());
        const {rerender} = result;

        act(() => {
          rerender(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement onBlur={mockHandler2} />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());

        simulateEvent('blur');
        expect(mockHandler2).toHaveBeenCalledWith();
        expect(mockHandler).not.toHaveBeenCalled();
      });

      it('propagates the Element`s focus event to the current onFocus prop', async () => {
        const mockHandler = jest.fn();
        const mockHandler2 = jest.fn();
        act(() => {
          result = render(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement onFocus={mockHandler} />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());
        const {rerender} = result;

        act(() => {
          rerender(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement onFocus={mockHandler2} />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());

        simulateEvent('focus');
        expect(mockHandler2).toHaveBeenCalledWith();
        expect(mockHandler).not.toHaveBeenCalled();
      });

      it('propagates the Element`s escape event to the current onEscape prop', async () => {
        const mockHandler = jest.fn();
        const mockHandler2 = jest.fn();
        act(() => {
          result = render(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement onEscape={mockHandler} />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());
        const {rerender} = result;

        act(() => {
          rerender(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement onEscape={mockHandler2} />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());

        simulateEvent('escape');
        expect(mockHandler2).toHaveBeenCalledWith();
        expect(mockHandler).not.toHaveBeenCalled();
      });

      it('propagates the Element`s loaderror event to the current onLoadError prop', async () => {
        const mockHandler = jest.fn();
        const mockHandler2 = jest.fn();
        act(() => {
          result = render(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement onLoadError={mockHandler} />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());
        const {rerender} = result;

        act(() => {
          rerender(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement onLoadError={mockHandler2} />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());

        simulateEvent('loaderror');
        expect(mockHandler2).toHaveBeenCalledWith();
        expect(mockHandler).not.toHaveBeenCalled();
      });

      it('propagates the Element`s loaderstart event to the current onLoaderStart prop', async () => {
        const mockHandler = jest.fn();
        const mockHandler2 = jest.fn();
        act(() => {
          result = render(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement onLoaderStart={mockHandler} />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());
        const {rerender} = result;

        act(() => {
          rerender(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement onLoaderStart={mockHandler2} />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());

        simulateEvent('loaderstart');
        expect(mockHandler2).toHaveBeenCalledWith();
        expect(mockHandler).not.toHaveBeenCalled();
      });

      it('updates the Element when options change', async () => {
        act(() => {
          result = render(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement options={{layout: 'accordion'}} />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());
        const {rerender} = result;

        act(() => {
          rerender(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement options={{layout: 'tabs'}} />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());

        expect(mockElement.update).toHaveBeenCalledWith({
          layout: 'tabs',
        });
      });

      it('does not trigger unnecessary updates', async () => {
        act(() => {
          result = render(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement options={{layout: 'accordion'}} />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());
        const {rerender} = result;

        act(() => {
          rerender(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement options={{layout: 'accordion'}} />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());

        expect(mockElement.update).not.toHaveBeenCalled();
      });

      it('updates the Element when options change from null to non-null value', async () => {
        act(() => {
          result = render(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              {/* @ts-expect-error */}
              <PaymentElement options={null} />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());
        const {rerender} = result;

        act(() => {
          rerender(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement options={{layout: 'tabs'}} />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());

        expect(mockElement.update).toHaveBeenCalledWith({
          layout: 'tabs',
        });
      });

      it('destroys an existing Element when the component unmounts', async () => {
        act(() => {
          result = render(
            <CheckoutProvider
              stripe={null}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement />
            </CheckoutProvider>
          );
        });
        const {unmount} = result;
        unmount();

        // not called when Element has not been mounted (because stripe is still loading)
        expect(mockElement.destroy).not.toHaveBeenCalled();

        act(() => {
          result = render(
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());
        const {unmount: unmount2} = result;
        unmount2();

        expect(mockElement.destroy).toHaveBeenCalled();
      });

      it('destroys an existing Element when the component unmounts with an async stripe prop', async () => {
        const stripePromise = Promise.resolve(mockStripe);

        act(() => {
          result = render(
            <CheckoutProvider
              stripe={stripePromise}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <PaymentElement />
            </CheckoutProvider>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());
        const {unmount} = result;
        unmount();

        expect(mockElement.destroy).toHaveBeenCalled();
      });

      it('destroys an existing Element when the component unmounts with an async stripe prop in StrictMode', async () => {
        const stripePromise = Promise.resolve(mockStripe);
        act(() => {
          result = render(
            <StrictMode>
              <CheckoutProvider
                stripe={stripePromise}
                options={{fetchClientSecret: async () => 'cs_123'}}
              >
                <PaymentElement />
              </CheckoutProvider>
            </StrictMode>
          );
        });
        await waitFor(() => expect(peMounted).toBeTruthy());
        const {unmount} = result;
        unmount();

        expect(mockElement.destroy).toHaveBeenCalled();
      });

      it('throws on invalid Element', async () => {
        expect.assertions(1);
        // Prevent the console.errors to keep the test output clean
        jest.spyOn(console, 'error').mockImplementation(() => {});

        try {
          await act(async () => {
            render(
              <CheckoutProvider
                stripe={mockStripe}
                options={{fetchClientSecret: async () => 'cs_123'}}
              >
                <CardElement />
              </CheckoutProvider>
            );
          });
        } catch (e) {
          expect((e as Error).message).toMatch(
            'Invalid Element type CardElement'
          );
        }
      });

      it('throws on invalid AddressElement mode', async () => {
        expect.assertions(1);
        // Prevent the console.errors to keep the test output clean
        jest.spyOn(console, 'error').mockImplementation(() => {});

        try {
          await act(async () => {
            render(
              <CheckoutProvider
                stripe={mockStripe}
                options={{fetchClientSecret: async () => 'cs_123'}}
              >
                {/* @ts-expect-error Testing invalid mode */}
                <AddressElement options={{mode: 'foo'}} />
              </CheckoutProvider>
            );
          });
        } catch (e) {
          expect((e as Error).message).toMatch('Invalid options.mode');
        }
      });

      it('throws on missing AddressElement mode', async () => {
        expect.assertions(1);
        // Prevent the console.errors to keep the test output clean
        jest.spyOn(console, 'error').mockImplementation(() => {});

        try {
          await act(async () => {
            render(
              <CheckoutProvider
                stripe={mockStripe}
                options={{fetchClientSecret: async () => 'cs_123'}}
              >
                {/* @ts-expect-error Testing missing mode */}
                <AddressElement />
              </CheckoutProvider>
            );
          });
        } catch (e) {
          expect((e as Error).message).toMatch('You must supply options.mode');
        }
      });
    });
  });
});
