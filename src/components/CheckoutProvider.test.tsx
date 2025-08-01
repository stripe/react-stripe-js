import React, {StrictMode} from 'react';
import {render, act, waitFor} from '@testing-library/react';
import {renderHook} from '@testing-library/react-hooks';

import {CheckoutProvider, useCheckout} from './CheckoutProvider';
import {Elements} from './Elements';
import {useStripe} from './useStripe';
import * as mocks from '../../test/mocks';

describe('CheckoutProvider', () => {
  let mockStripe: any;
  let mockStripePromise: any;
  let mockCheckoutSdk: any;
  let mockSession: any;
  let consoleError: any;
  let consoleWarn: any;
  let mockCheckout: any;

  beforeEach(() => {
    mockStripe = mocks.mockStripe();
    mockStripePromise = Promise.resolve(mockStripe);
    mockCheckoutSdk = mocks.mockCheckoutSdk();
    mockStripe.initCheckout.mockResolvedValue(mockCheckoutSdk);
    mockSession = mocks.mockCheckoutSession();
    mockCheckoutSdk.session.mockReturnValue(mockSession);

    const {on: _on, session: _session, ...actions} = mockCheckoutSdk;

    mockCheckout = {...actions, ...mockSession};

    jest.spyOn(console, 'error');
    jest.spyOn(console, 'warn');
    consoleError = console.error;
    consoleWarn = console.warn;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('injects CheckoutProvider with the useCheckout hook', async () => {
    const wrapper = ({children}: any) => (
      <CheckoutProvider
        stripe={mockStripe}
        options={{fetchClientSecret: async () => 'cs_123'}}
      >
        {children}
      </CheckoutProvider>
    );

    const {result, waitForNextUpdate} = renderHook(() => useCheckout(), {
      wrapper,
    });

    // observe intermediate states
    await waitForNextUpdate();

    // wait for all (potentially multiple) updates to finish
    await waitFor(() => expect(result.current).toEqual(mockCheckout));
  });

  test('injects CheckoutProvider with the useStripe hook', async () => {
    const wrapper = ({children}: any) => (
      <CheckoutProvider
        stripe={mockStripe}
        options={{fetchClientSecret: async () => 'cs_123'}}
      >
        {children}
      </CheckoutProvider>
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
      <CheckoutProvider
        stripe={stripeProp}
        options={{fetchClientSecret: async () => 'cs_123'}}
      >
        {children}
      </CheckoutProvider>
    );

    const {result, rerender} = renderHook(() => useCheckout(), {wrapper});
    expect(result.current).toBe(undefined);

    stripeProp = mockStripe;
    act(() => rerender());
    await waitFor(() => expect(result.current).toEqual(mockCheckout));
  });

  test('works with a Promise resolving to a valid Stripe object', async () => {
    const wrapper = ({children}: any) => (
      <CheckoutProvider
        stripe={mockStripePromise}
        options={{fetchClientSecret: async () => 'cs_123'}}
      >
        {children}
      </CheckoutProvider>
    );

    const {result, waitForNextUpdate} = renderHook(() => useCheckout(), {
      wrapper,
    });

    expect(result.current).toBe(undefined);

    await waitForNextUpdate();

    await waitFor(() => expect(result.current).toEqual(mockCheckout));
  });

  test('allows a transition from null to a valid Promise', async () => {
    let stripeProp: any = null;
    const wrapper = ({children}: any) => (
      <CheckoutProvider
        stripe={stripeProp}
        options={{fetchClientSecret: async () => 'cs_123'}}
      >
        {children}
      </CheckoutProvider>
    );

    const {result, rerender, waitForNextUpdate} = renderHook(
      () => useCheckout(),
      {wrapper}
    );
    expect(result.current).toBe(undefined);

    stripeProp = mockStripePromise;
    act(() => rerender());

    expect(result.current).toBe(undefined);

    await waitForNextUpdate();

    await waitFor(() => expect(result.current).toEqual(mockCheckout));
  });

  test('does not set context if Promise resolves after CheckoutProvider is unmounted', async () => {
    // Silence console output so test output is less noisy
    consoleError.mockImplementation(() => {});

    let result: any;
    act(() => {
      result = render(
        <CheckoutProvider
          stripe={mockStripePromise}
          options={{fetchClientSecret: async () => 'cs_123'}}
        >
          {null}
        </CheckoutProvider>
      );
    });

    result.unmount();
    await act(() => mockStripePromise);

    expect(consoleError).not.toHaveBeenCalled();
  });

  test('works with a Promise resolving to null for SSR safety', async () => {
    const nullPromise = Promise.resolve(null);
    const TestComponent = () => {
      const customCheckout = useCheckout();
      return customCheckout ? <div>not empty</div> : null;
    };

    let result: any;
    act(() => {
      result = render(
        <CheckoutProvider
          stripe={nullPromise}
          options={{fetchClientSecret: async () => 'cs_123'}}
        >
          <TestComponent />
        </CheckoutProvider>
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
          <CheckoutProvider
            stripe={stripeProp as any}
            options={{fetchClientSecret: async () => 'cs_123'}}
          >
            <div />
          </CheckoutProvider>
        )
      ).toThrow('Invalid prop `stripe` supplied to `CheckoutProvider`.');
    });
  });

  test('does not allow changes to an already set Stripe object', async () => {
    // Silence console output so test output is less noisy
    consoleWarn.mockImplementation(() => {});
    let result: any;
    act(() => {
      result = render(
        <CheckoutProvider
          stripe={mockStripe}
          options={{fetchClientSecret: async () => 'cs_123'}}
        />
      );
    });

    const mockStripe2: any = mocks.mockStripe();
    act(() => {
      result.rerender(
        <CheckoutProvider
          stripe={mockStripe2}
          options={{fetchClientSecret: async () => 'cs_123'}}
        />
      );
    });

    await waitFor(() => {
      expect(mockStripe.initCheckout).toHaveBeenCalledTimes(1);
      expect(mockStripe2.initCheckout).toHaveBeenCalledTimes(0);
      expect(consoleWarn).toHaveBeenCalledWith(
        'Unsupported prop change on CheckoutProvider: You cannot change the `stripe` prop after setting it.'
      );
    });
  });

  test('initCheckout only called once and allows changes to elementsOptions appearance after setting the Stripe object', async () => {
    let result: any;
    const fetchClientSecret = async () => 'cs_123';
    act(() => {
      result = render(
        <CheckoutProvider
          stripe={mockStripe}
          options={{
            fetchClientSecret,
            elementsOptions: {
              appearance: {theme: 'stripe'},
            },
          }}
        />
      );
    });

    await waitFor(() =>
      expect(mockStripe.initCheckout).toHaveBeenCalledWith({
        fetchClientSecret,
        elementsOptions: {
          appearance: {theme: 'stripe'},
        },
      })
    );

    act(() => {
      result.rerender(
        <CheckoutProvider
          stripe={mockStripe}
          options={{
            fetchClientSecret: async () => 'cs_123',
            elementsOptions: {appearance: {theme: 'night'}},
          }}
        />
      );
    });

    await waitFor(() => {
      expect(mockStripe.initCheckout).toHaveBeenCalledTimes(1);
      expect(mockCheckoutSdk.changeAppearance).toHaveBeenCalledTimes(1);
      expect(mockCheckoutSdk.changeAppearance).toHaveBeenCalledWith({
        theme: 'night',
      });
    });
  });

  test('it does not call loadFonts a 2nd time if they do not change', async () => {
    let result: any;
    const fetchClientSecret = async () => 'cs_123';
    act(() => {
      result = render(
        <CheckoutProvider
          stripe={mockStripe}
          options={{
            fetchClientSecret,
            elementsOptions: {
              fonts: [
                {
                  cssSrc: 'https://example.com/font.css',
                },
              ],
            },
          }}
        />
      );
    });

    await waitFor(() =>
      expect(mockStripe.initCheckout).toHaveBeenCalledWith({
        fetchClientSecret,
        elementsOptions: {
          fonts: [
            {
              cssSrc: 'https://example.com/font.css',
            },
          ],
        },
      })
    );

    act(() => {
      result.rerender(
        <CheckoutProvider
          stripe={mockStripe}
          options={{
            fetchClientSecret: async () => 'cs_123',
            elementsOptions: {
              fonts: [
                {
                  cssSrc: 'https://example.com/font.css',
                },
              ],
            },
          }}
        />
      );
    });

    act(() => {
      result.rerender(
        <CheckoutProvider
          stripe={mockStripe}
          options={{
            fetchClientSecret: async () => 'cs_123',
            elementsOptions: {
              fonts: [
                {
                  cssSrc: 'https://example.com/font.css',
                },
              ],
            },
          }}
        />
      );
    });

    await waitFor(() => {
      expect(mockStripe.initCheckout).toHaveBeenCalledTimes(1);

      // This is called once, due to the sdk having loaded.
      expect(mockCheckoutSdk.loadFonts).toHaveBeenCalledTimes(1);
    });
  });

  test('allows changes to elementsOptions fonts', async () => {
    let result: any;
    const fetchClientSecret = async () => 'cs_123';
    act(() => {
      result = render(
        <CheckoutProvider
          stripe={mockStripe}
          options={{
            fetchClientSecret,
            elementsOptions: {},
          }}
        />
      );
    });

    await waitFor(() =>
      expect(mockStripe.initCheckout).toHaveBeenCalledWith({
        fetchClientSecret,
        elementsOptions: {},
      })
    );

    act(() => {
      result.rerender(
        <CheckoutProvider
          stripe={mockStripe}
          options={{
            fetchClientSecret: async () => 'cs_123',
            elementsOptions: {
              fonts: [
                {
                  cssSrc: 'https://example.com/font.css',
                },
              ],
            },
          }}
        />
      );
    });

    await waitFor(() => {
      expect(mockStripe.initCheckout).toHaveBeenCalledTimes(1);
      expect(mockCheckoutSdk.loadFonts).toHaveBeenCalledTimes(1);
      expect(mockCheckoutSdk.loadFonts).toHaveBeenCalledWith([
        {
          cssSrc: 'https://example.com/font.css',
        },
      ]);
    });
  });

  test('allows options changes before setting the Stripe object', async () => {
    let result: any;
    const fetchClientSecret = async () => 'cs_123';
    act(() => {
      result = render(
        <CheckoutProvider
          stripe={null}
          options={{
            fetchClientSecret,
            elementsOptions: {
              appearance: {theme: 'stripe'},
            },
          }}
        />
      );
    });

    await waitFor(() =>
      expect(mockStripe.initCheckout).toHaveBeenCalledTimes(0)
    );

    act(() => {
      result.rerender(
        <CheckoutProvider
          stripe={mockStripe}
          options={{
            fetchClientSecret,
            elementsOptions: {appearance: {theme: 'stripe'}},
          }}
        />
      );
    });

    await waitFor(() => {
      expect(console.warn).not.toHaveBeenCalled();
      expect(mockStripe.initCheckout).toHaveBeenCalledTimes(1);
      expect(mockStripe.initCheckout).toHaveBeenCalledWith({
        fetchClientSecret,
        elementsOptions: {
          appearance: {theme: 'stripe'},
        },
      });
    });
  });

  test('throws when trying to call useCheckout outside of CheckoutProvider context', () => {
    const {result} = renderHook(() => useCheckout());

    expect(result.error && result.error.message).toBe(
      'Could not find CheckoutProvider context; You need to wrap the part of your app that calls useCheckout() in an <CheckoutProvider> provider.'
    );
  });

  test('throws when trying to call useStripe outside of CheckoutProvider context', () => {
    const {result} = renderHook(() => useStripe());

    expect(result.error && result.error.message).toBe(
      'Could not find Elements context; You need to wrap the part of your app that calls useStripe() in an <Elements> provider.'
    );
  });

  test('throws when trying to call useStripe in Elements -> CheckoutProvider nested context', async () => {
    const wrapper = ({children}: any) => (
      <Elements stripe={mockStripe}>
        <CheckoutProvider
          stripe={mockStripe}
          options={{fetchClientSecret: async () => 'cs_123'}}
        >
          {children}
        </CheckoutProvider>
      </Elements>
    );

    const {result, waitForNextUpdate} = renderHook(() => useStripe(), {
      wrapper,
    });

    await waitForNextUpdate();

    expect(result.error && result.error.message).toBe(
      'You cannot wrap the part of your app that calls useStripe() in both <CheckoutProvider> and <Elements> providers.'
    );
  });

  test('throws when trying to call useStripe in CheckoutProvider -> Elements nested context', async () => {
    const wrapper = ({children}: any) => (
      <CheckoutProvider
        stripe={mockStripe}
        options={{fetchClientSecret: async () => 'cs_123'}}
      >
        <Elements stripe={mockStripe}>{children}</Elements>
      </CheckoutProvider>
    );

    const {result, waitForNextUpdate} = renderHook(() => useStripe(), {
      wrapper,
    });

    await waitForNextUpdate();

    expect(result.error && result.error.message).toBe(
      'You cannot wrap the part of your app that calls useStripe() in both <CheckoutProvider> and <Elements> providers.'
    );
  });

  describe('React.StrictMode', () => {
    test('initCheckout once in StrictMode', async () => {
      const TestComponent = () => {
        const _ = useCheckout();
        return <div />;
      };

      act(() => {
        render(
          <StrictMode>
            <CheckoutProvider
              stripe={mockStripe}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <TestComponent />
            </CheckoutProvider>
          </StrictMode>
        );
      });

      await waitFor(() =>
        expect(mockStripe.initCheckout).toHaveBeenCalledTimes(1)
      );
    });

    test('initCheckout once with stripePromise in StrictMode', async () => {
      const TestComponent = () => {
        const _ = useCheckout();
        return <div />;
      };

      act(() => {
        render(
          <StrictMode>
            <CheckoutProvider
              stripe={mockStripePromise}
              options={{fetchClientSecret: async () => 'cs_123'}}
            >
              <TestComponent />
            </CheckoutProvider>
          </StrictMode>
        );
      });

      await waitFor(() =>
        expect(mockStripe.initCheckout).toHaveBeenCalledTimes(1)
      );
    });

    test('allows changes to options via (mockCheckoutSdk.changeAppearance after setting the Stripe object in StrictMode', async () => {
      let result: any;
      const fetchClientSecret = async () => 'cs_123';
      act(() => {
        result = render(
          <StrictMode>
            <CheckoutProvider
              stripe={mockStripe}
              options={{
                fetchClientSecret,
                elementsOptions: {
                  appearance: {theme: 'stripe'},
                },
              }}
            />
          </StrictMode>
        );
      });

      await waitFor(() => {
        expect(mockStripe.initCheckout).toHaveBeenCalledTimes(1);
        expect(mockStripe.initCheckout).toHaveBeenCalledWith({
          fetchClientSecret,
          elementsOptions: {
            appearance: {theme: 'stripe'},
          },
        });
      });

      act(() => {
        result.rerender(
          <StrictMode>
            <CheckoutProvider
              stripe={mockStripe}
              options={{
                fetchClientSecret: async () => 'cs_123',
                elementsOptions: {appearance: {theme: 'night'}},
              }}
            />
          </StrictMode>
        );
      });

      await waitFor(() => {
        expect(mockCheckoutSdk.changeAppearance).toHaveBeenCalledTimes(1);
        expect(mockCheckoutSdk.changeAppearance).toHaveBeenCalledWith({
          theme: 'night',
        });
      });
    });
  });
});
