import React, {StrictMode} from 'react';
import {render, act, waitFor} from '@testing-library/react';
import {renderHook} from '@testing-library/react-hooks';

import {CustomCheckoutProvider, useCustomCheckout} from './CustomCheckout';
import {Elements, useStripe} from './Elements';
import * as mocks from '../../test/mocks';

describe('CustomCheckoutProvider', () => {
  let mockStripe: any;
  let mockStripePromise: any;
  let mockCustomCheckoutSdk: any;
  let mockSession: any;
  let consoleError: any;
  let consoleWarn: any;
  let mockCustomCheckout: any;

  beforeEach(() => {
    mockStripe = mocks.mockStripe();
    mockStripePromise = Promise.resolve(mockStripe);
    mockCustomCheckoutSdk = mocks.mockCustomCheckoutSdk();
    mockStripe.initCustomCheckout.mockResolvedValue(mockCustomCheckoutSdk);
    mockSession = mocks.mockCustomCheckoutSession();
    mockCustomCheckoutSdk.session.mockReturnValue(mockSession);

    const {on: _on, session: _session, ...actions} = mockCustomCheckoutSdk;

    mockCustomCheckout = {...actions, ...mockSession};

    jest.spyOn(console, 'error');
    jest.spyOn(console, 'warn');
    consoleError = console.error;
    consoleWarn = console.warn;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('injects CustomCheckoutProvider with the useCustomCheckout hook', async () => {
    const wrapper = ({children}: any) => (
      <CustomCheckoutProvider
        stripe={mockStripe}
        options={{clientSecret: 'cs_123'}}
      >
        {children}
      </CustomCheckoutProvider>
    );

    const {result, waitForNextUpdate} = renderHook(() => useCustomCheckout(), {
      wrapper,
    });

    // observe intermediate states
    await waitForNextUpdate();

    // wait for all (potentially multiple) updates to finish
    await waitFor(() => expect(result.current).toEqual(mockCustomCheckout));
  });

  test('injects CustomCheckoutProvider with the useStripe hook', async () => {
    const wrapper = ({children}: any) => (
      <CustomCheckoutProvider
        stripe={mockStripe}
        options={{clientSecret: 'cs_123'}}
      >
        {children}
      </CustomCheckoutProvider>
    );

    const {result, waitForNextUpdate} = renderHook(() => useStripe(), {
      wrapper,
    });

    // observe intermediate states
    await waitForNextUpdate();

    // wait for all (potentially multiple) updates to finish
    await waitFor(() => expect(result.current).toBe(mockStripe));
  });

  test('allows a transition from null to a valid Stripe object', async () => {
    let stripeProp: any = null;
    const wrapper = ({children}: any) => (
      <CustomCheckoutProvider
        stripe={stripeProp}
        options={{clientSecret: 'cs_123'}}
      >
        {children}
      </CustomCheckoutProvider>
    );

    const {result, rerender} = renderHook(() => useCustomCheckout(), {wrapper});
    expect(result.current).toBe(undefined);

    stripeProp = mockStripe;
    act(() => rerender());
    await waitFor(() => expect(result.current).toEqual(mockCustomCheckout));
  });

  test('works with a Promise resolving to a valid Stripe object', async () => {
    const wrapper = ({children}: any) => (
      <CustomCheckoutProvider
        stripe={mockStripePromise}
        options={{clientSecret: 'cs_123'}}
      >
        {children}
      </CustomCheckoutProvider>
    );

    const {result, waitForNextUpdate} = renderHook(() => useCustomCheckout(), {
      wrapper,
    });

    expect(result.current).toBe(undefined);

    await waitForNextUpdate();

    await waitFor(() => expect(result.current).toEqual(mockCustomCheckout));
  });

  test('allows a transition from null to a valid Promise', async () => {
    let stripeProp: any = null;
    const wrapper = ({children}: any) => (
      <CustomCheckoutProvider
        stripe={stripeProp}
        options={{clientSecret: 'cs_123'}}
      >
        {children}
      </CustomCheckoutProvider>
    );

    const {result, rerender, waitForNextUpdate} = renderHook(
      () => useCustomCheckout(),
      {wrapper}
    );
    expect(result.current).toBe(undefined);

    stripeProp = mockStripePromise;
    act(() => rerender());

    expect(result.current).toBe(undefined);

    await waitForNextUpdate();

    await waitFor(() => expect(result.current).toEqual(mockCustomCheckout));
  });

  test('does not set context if Promise resolves after Elements is unmounted', async () => {
    // Silence console output so test output is less noisy
    consoleError.mockImplementation(() => {});

    let result: any;
    act(() => {
      result = render(
        <CustomCheckoutProvider
          stripe={mockStripePromise}
          options={{clientSecret: 'cs_123'}}
        >
          {null}
        </CustomCheckoutProvider>
      );
    });

    result.unmount();
    await act(() => mockStripePromise);

    expect(consoleError).not.toHaveBeenCalled();
  });

  test('works with a Promise resolving to null for SSR safety', async () => {
    const nullPromise = Promise.resolve(null);
    const TestComponent = () => {
      const customCheckout = useCustomCheckout();
      return customCheckout ? <div>not empty</div> : null;
    };

    let result: any;
    act(() => {
      result = render(
        <CustomCheckoutProvider
          stripe={nullPromise}
          options={{clientSecret: 'cs_123'}}
        >
          <TestComponent />
        </CustomCheckoutProvider>
      );
    });

    expect(result.container).toBeEmptyDOMElement();

    await act(() => nullPromise.then(() => undefined));
    expect(result.container).toBeEmptyDOMElement();
  });

  describe.each([
    ['undefined', undefined],
    ['false', false],
    ['string', 'foo'],
    ['random object', {foo: 'bar'}],
  ])('invalid stripe prop', (name, stripeProp) => {
    test(`errors when props.stripe is ${name}`, () => {
      // Silence console output so test output is less noisy
      consoleError.mockImplementation(() => {});

      expect(() =>
        render(
          <CustomCheckoutProvider
            stripe={stripeProp as any}
            options={{clientSecret: 'cs_123'}}
          >
            <div />
          </CustomCheckoutProvider>
        )
      ).toThrow('Invalid prop `stripe` supplied to `CustomCheckoutProvider`.');
    });
  });

  test('does not allow changes to an already set Stripe object', async () => {
    // Silence console output so test output is less noisy
    consoleWarn.mockImplementation(() => {});
    let result: any;
    act(() => {
      result = render(
        <CustomCheckoutProvider
          stripe={mockStripe}
          options={{clientSecret: 'cs_123'}}
        />
      );
    });

    const mockStripe2: any = mocks.mockStripe();
    act(() => {
      result.rerender(
        <CustomCheckoutProvider
          stripe={mockStripe2}
          options={{clientSecret: 'cs_123'}}
        />
      );
    });

    await waitFor(() => {
      expect(mockStripe.initCustomCheckout).toHaveBeenCalledTimes(1);
      expect(mockStripe2.initCustomCheckout).toHaveBeenCalledTimes(0);
      expect(consoleWarn).toHaveBeenCalledWith(
        'Unsupported prop change on CustomCheckoutProvider: You cannot change the `stripe` prop after setting it.'
      );
    });
  });

  test('initCustomCheckout only called once and allows changes to elementsOptions appearance after setting the Stripe object', async () => {
    let result: any;
    act(() => {
      result = render(
        <CustomCheckoutProvider
          stripe={mockStripe}
          options={{
            clientSecret: 'cs_123',
            elementsOptions: {
              appearance: {theme: 'stripe'},
            },
          }}
        />
      );
    });

    await waitFor(() =>
      expect(mockStripe.initCustomCheckout).toHaveBeenCalledWith({
        clientSecret: 'cs_123',
        elementsOptions: {
          appearance: {theme: 'stripe'},
        },
      })
    );

    act(() => {
      result.rerender(
        <CustomCheckoutProvider
          stripe={mockStripe}
          options={{
            clientSecret: 'cs_123',
            elementsOptions: {appearance: {theme: 'night'}},
          }}
        />
      );
    });

    await waitFor(() => {
      expect(mockStripe.initCustomCheckout).toHaveBeenCalledTimes(1);
      expect(mockCustomCheckoutSdk.changeAppearance).toHaveBeenCalledTimes(1);
      expect(mockCustomCheckoutSdk.changeAppearance).toHaveBeenCalledWith({
        theme: 'night',
      });
    });
  });

  test('allows options changes before setting the Stripe object', async () => {
    let result: any;
    act(() => {
      result = render(
        <CustomCheckoutProvider
          stripe={null}
          options={{
            clientSecret: 'cs_123',
            elementsOptions: {
              appearance: {theme: 'stripe'},
            },
          }}
        />
      );
    });

    await waitFor(() =>
      expect(mockStripe.initCustomCheckout).toHaveBeenCalledTimes(0)
    );

    act(() => {
      result.rerender(
        <CustomCheckoutProvider
          stripe={mockStripe}
          options={{
            clientSecret: 'cs_123',
            elementsOptions: {appearance: {theme: 'stripe'}},
          }}
        />
      );
    });

    await waitFor(() => {
      expect(console.warn).not.toHaveBeenCalled();
      expect(mockStripe.initCustomCheckout).toHaveBeenCalledTimes(1);
      expect(mockStripe.initCustomCheckout).toHaveBeenCalledWith({
        clientSecret: 'cs_123',
        elementsOptions: {
          appearance: {theme: 'stripe'},
        },
      });
    });
  });

  test('throws when trying to call useCustomCheckout outside of CustomCheckoutProvider context', () => {
    const {result} = renderHook(() => useCustomCheckout());

    expect(result.error && result.error.message).toBe(
      'Could not find CustomCheckoutProvider context; You need to wrap the part of your app that calls useCustomCheckout() in an <CustomCheckoutProvider> provider.'
    );
  });

  test('throws when trying to call useStripe outside of CustomCheckoutProvider context', () => {
    const {result} = renderHook(() => useStripe());

    expect(result.error && result.error.message).toBe(
      'Could not find Elements context; You need to wrap the part of your app that calls useStripe() in an <Elements> provider.'
    );
  });

  test('throws when trying to call useStripe in Elements -> CustomCheckoutProvider nested context', async () => {
    const wrapper = ({children}: any) => (
      <Elements stripe={mockStripe}>
        <CustomCheckoutProvider
          stripe={mockStripe}
          options={{clientSecret: 'cs_123'}}
        >
          {children}
        </CustomCheckoutProvider>
      </Elements>
    );

    const {result, waitForNextUpdate} = renderHook(() => useStripe(), {
      wrapper,
    });

    await waitForNextUpdate();

    expect(result.error && result.error.message).toBe(
      'You cannot wrap the part of your app that calls useStripe() in both <CustomCheckoutProvider> and <Elements> providers.'
    );
  });

  test('throws when trying to call useStripe in CustomCheckoutProvider -> Elements nested context', async () => {
    const wrapper = ({children}: any) => (
      <CustomCheckoutProvider
        stripe={mockStripe}
        options={{clientSecret: 'cs_123'}}
      >
        <Elements stripe={mockStripe}>{children}</Elements>
      </CustomCheckoutProvider>
    );

    const {result, waitForNextUpdate} = renderHook(() => useStripe(), {
      wrapper,
    });

    await waitForNextUpdate();

    expect(result.error && result.error.message).toBe(
      'You cannot wrap the part of your app that calls useStripe() in both <CustomCheckoutProvider> and <Elements> providers.'
    );
  });

  describe('React.StrictMode', () => {
    test('initCustomCheckout once in StrictMode', async () => {
      const TestComponent = () => {
        const _ = useCustomCheckout();
        return <div />;
      };

      act(() => {
        render(
          <StrictMode>
            <CustomCheckoutProvider
              stripe={mockStripe}
              options={{clientSecret: 'cs_123'}}
            >
              <TestComponent />
            </CustomCheckoutProvider>
          </StrictMode>
        );
      });

      await waitFor(() =>
        expect(mockStripe.initCustomCheckout).toHaveBeenCalledTimes(1)
      );
    });

    test('initCustomCheckout once with stripePromise in StrictMode', async () => {
      const TestComponent = () => {
        const _ = useCustomCheckout();
        return <div />;
      };

      act(() => {
        render(
          <StrictMode>
            <CustomCheckoutProvider
              stripe={mockStripePromise}
              options={{clientSecret: 'cs_123'}}
            >
              <TestComponent />
            </CustomCheckoutProvider>
          </StrictMode>
        );
      });

      await waitFor(() =>
        expect(mockStripe.initCustomCheckout).toHaveBeenCalledTimes(1)
      );
    });

    test('allows changes to options via (mockCustomCheckoutSdk.changeAppearance after setting the Stripe object in StrictMode', async () => {
      let result: any;
      act(() => {
        result = render(
          <StrictMode>
            <CustomCheckoutProvider
              stripe={mockStripe}
              options={{
                clientSecret: 'cs_123',
                elementsOptions: {
                  appearance: {theme: 'stripe'},
                },
              }}
            />
          </StrictMode>
        );
      });

      await waitFor(() => {
        expect(mockStripe.initCustomCheckout).toHaveBeenCalledTimes(1);
        expect(mockStripe.initCustomCheckout).toHaveBeenCalledWith({
          clientSecret: 'cs_123',
          elementsOptions: {
            appearance: {theme: 'stripe'},
          },
        });
      });

      act(() => {
        result.rerender(
          <StrictMode>
            <CustomCheckoutProvider
              stripe={mockStripe}
              options={{
                clientSecret: 'cs_123',
                elementsOptions: {appearance: {theme: 'night'}},
              }}
            />
          </StrictMode>
        );
      });

      await waitFor(() => {
        expect(mockCustomCheckoutSdk.changeAppearance).toHaveBeenCalledTimes(1);
        expect(mockCustomCheckoutSdk.changeAppearance).toHaveBeenCalledWith({
          theme: 'night',
        });
      });
    });
  });
});
