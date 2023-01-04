import React, {StrictMode} from 'react';
import {render, act} from '@testing-library/react';

import * as ElementsModule from './Elements';
import createElementComponent from './createElementComponent';
import * as mocks from '../../test/mocks';
import {
  CardElementComponent,
  PaymentElementComponent,
  PaymentRequestButtonElementComponent,
  CartElementComponent,
  PayButtonElementComponent,
} from '../types';

const {Elements} = ElementsModule;

describe('createElementComponent', () => {
  let mockStripe: any;
  let mockElements: any;
  let mockElement: any;
  let mockCartElementContext: any;
  let simulateChange: any;
  let simulateBlur: any;
  let simulateFocus: any;
  let simulateEscape: any;
  let simulateReady: any;
  let simulateClick: any;
  let simulateLoadError: any;
  let simulateLoaderStart: any;
  let simulateNetworksChange: any;
  let simulateCheckout: any;
  let simulateLineItemClick: any;
  let simulateConfirm: any;
  let simulateCancel: any;
  let simulateShippingAddressChange: any;
  let simulateShippingRateChange: any;

  beforeEach(() => {
    mockStripe = mocks.mockStripe();
    mockElements = mocks.mockElements();
    mockElement = mocks.mockElement();
    mockStripe.elements.mockReturnValue(mockElements);
    mockElements.create.mockReturnValue(mockElement);
    jest.spyOn(React, 'useLayoutEffect');
    mockElement.on = jest.fn((event, fn) => {
      switch (event) {
        case 'change':
          simulateChange = fn;
          break;
        case 'blur':
          simulateBlur = fn;
          break;
        case 'focus':
          simulateFocus = fn;
          break;
        case 'escape':
          simulateEscape = fn;
          break;
        case 'ready':
          simulateReady = fn;
          break;
        case 'click':
          simulateClick = fn;
          break;
        case 'loaderror':
          simulateLoadError = fn;
          break;
        case 'loaderstart':
          simulateLoaderStart = fn;
          break;
        case 'networkschange':
          simulateNetworksChange = fn;
          break;
        case 'checkout':
          simulateCheckout = fn;
          break;
        case 'lineitemclick':
          simulateLineItemClick = fn;
          break;
        case 'confirm':
          simulateConfirm = fn;
          break;
        case 'cancel':
          simulateCancel = fn;
          break;
        case 'shippingaddresschange':
          simulateShippingAddressChange = fn;
          break;
        case 'shippingratechange':
          simulateShippingRateChange = fn;
          break;
        default:
          throw new Error('TestSetupError: Unexpected event registration.');
      }
    });
    mockCartElementContext = mocks.mockCartElementContext();
    jest
      .spyOn(ElementsModule, 'useCartElementContextWithUseCase')
      .mockReturnValue(mockCartElementContext);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('on the server', () => {
    const CardElement = createElementComponent('card', true);

    it('gives the element component a proper displayName', () => {
      expect(CardElement.displayName).toBe('CardElement');
    });

    it('stores the element component`s type as a static property', () => {
      expect((CardElement as any).__elementType).toBe('card');
    });

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
        <Elements stripe={null}>
          <CardElement />
        </Elements>
      );

      expect(React.useLayoutEffect).not.toHaveBeenCalled();
    });
  });

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

    const CartElement: CartElementComponent = createElementComponent(
      'cart',
      false
    );

    const PayButtonElement: PayButtonElementComponent = createElementComponent(
      'payButton',
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
    });

    it('mounts the element', () => {
      const {container} = render(
        <Elements stripe={mockStripe}>
          <CardElement />
        </Elements>
      );

      expect(mockElement.mount).toHaveBeenCalledWith(container.firstChild);
      expect(React.useLayoutEffect).toHaveBeenCalled();
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

      simulateReady();
      expect(mockHandler2).toHaveBeenCalledWith(mockElement);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('sets cart in the CartElementContext', () => {
      expect(mockCartElementContext.cart).toBe(null);

      render(
        <Elements stripe={mockStripe}>
          <CartElement />
        </Elements>
      );

      expect(mockCartElementContext.cart).toBe(mockElement);
    });

    it('sets cartState in the CartElementContext', () => {
      render(
        <Elements stripe={mockStripe}>
          <CartElement />
        </Elements>
      );

      expect(mockCartElementContext.cartState).toBe(null);

      const readyEvent = {
        elementType: 'cart',
        id: 'cart_session_id_ready',
        lineItems: {
          count: 0,
        },
      };

      simulateReady(readyEvent);
      expect(mockCartElementContext.cartState).toBe(readyEvent);

      const changeEvent = {
        elementType: 'cart',
        id: 'cart_session_id_change',
        lineItems: {
          count: 1,
        },
      };
      simulateChange(changeEvent);
      expect(mockCartElementContext.cartState).toBe(changeEvent);

      const checkoutEvent = {
        elementType: 'cart',
        id: 'cart_session_id_checkout',
        lineItems: {
          count: 2,
        },
      };
      simulateCheckout(checkoutEvent);
      expect(mockCartElementContext.cartState).toBe(checkoutEvent);
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
      simulateChange(changeEventMock);
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

      simulateBlur();
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

      simulateFocus();
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

      simulateEscape();
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
      simulateClick(clickEventMock);
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
      simulateLoadError(loadErrorEventMock);
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

      simulateLoaderStart();
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

      simulateNetworksChange();
      expect(mockHandler2).toHaveBeenCalledWith();
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('propagates the Element`s checkout event to the current onCheckout prop', () => {
      const mockHandler = jest.fn();
      const mockHandler2 = jest.fn();
      const {rerender} = render(
        <Elements stripe={mockStripe}>
          <CartElement onCheckout={mockHandler} />
        </Elements>
      );
      rerender(
        <Elements stripe={mockStripe}>
          <CartElement onCheckout={mockHandler2} />
        </Elements>
      );

      const checkoutEventMock = Symbol('checkout');
      simulateCheckout(checkoutEventMock);
      expect(mockHandler2).toHaveBeenCalledWith(checkoutEventMock);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('propagates the Element`s lineitemclick event to the current onLineItemClick prop', () => {
      const mockHandler = jest.fn();
      const mockHandler2 = jest.fn();
      const {rerender} = render(
        <Elements stripe={mockStripe}>
          <CartElement onLineItemClick={mockHandler} />
        </Elements>
      );
      rerender(
        <Elements stripe={mockStripe}>
          <CartElement onLineItemClick={mockHandler2} />
        </Elements>
      );

      const lineItemClickEventMock = Symbol('lineitemclick');
      simulateLineItemClick(lineItemClickEventMock);
      expect(mockHandler2).toHaveBeenCalledWith(lineItemClickEventMock);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('propagates the Element`s confirm event to the current onConfirm prop', () => {
      const mockHandler = jest.fn();
      const mockHandler2 = jest.fn();
      const {rerender} = render(
        <Elements stripe={mockStripe}>
          <PayButtonElement onConfirm={mockHandler} />
        </Elements>
      );
      rerender(
        <Elements stripe={mockStripe}>
          <PayButtonElement onConfirm={mockHandler2} />
        </Elements>
      );

      const confirmEventMock = Symbol('confirm');
      simulateConfirm(confirmEventMock);
      expect(mockHandler2).toHaveBeenCalledWith(confirmEventMock);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('propagates the Element`s cancel event to the current onCancel prop', () => {
      const mockHandler = jest.fn();
      const mockHandler2 = jest.fn();
      const {rerender} = render(
        <Elements stripe={mockStripe}>
          <PayButtonElement onConfirm={() => {}} onCancel={mockHandler} />
        </Elements>
      );
      rerender(
        <Elements stripe={mockStripe}>
          <PayButtonElement onConfirm={() => {}} onCancel={mockHandler2} />
        </Elements>
      );

      const cancelEventMock = Symbol('cancel');
      simulateCancel(cancelEventMock);
      expect(mockHandler2).toHaveBeenCalledWith(cancelEventMock);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('propagates the Element`s shippingaddresschange event to the current onShippingAddressChange prop', () => {
      const mockHandler = jest.fn();
      const mockHandler2 = jest.fn();
      const {rerender} = render(
        <Elements stripe={mockStripe}>
          <PayButtonElement
            onConfirm={() => {}}
            onShippingAddressChange={mockHandler}
          />
        </Elements>
      );
      rerender(
        <Elements stripe={mockStripe}>
          <PayButtonElement
            onConfirm={() => {}}
            onShippingAddressChange={mockHandler2}
          />
        </Elements>
      );

      const shippingAddressChangeEventMock = Symbol('shippingaddresschange');
      simulateShippingAddressChange(shippingAddressChangeEventMock);
      expect(mockHandler2).toHaveBeenCalledWith(shippingAddressChangeEventMock);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('propagates the Element`s shippingratechange event to the current onShippingRateChange prop', () => {
      const mockHandler = jest.fn();
      const mockHandler2 = jest.fn();
      const {rerender} = render(
        <Elements stripe={mockStripe}>
          <PayButtonElement
            onConfirm={() => {}}
            onShippingRateChange={mockHandler}
          />
        </Elements>
      );
      rerender(
        <Elements stripe={mockStripe}>
          <PayButtonElement
            onConfirm={() => {}}
            onShippingRateChange={mockHandler2}
          />
        </Elements>
      );

      const shippingRateChangeEventMock = Symbol('shippingratechange');
      simulateShippingRateChange(shippingRateChangeEventMock);
      expect(mockHandler2).toHaveBeenCalledWith(shippingRateChangeEventMock);
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
  });
});
