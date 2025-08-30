import React, {StrictMode} from 'react';
import {render, act, waitFor} from '@testing-library/react';
import {renderHook} from '@testing-library/react-hooks';

import {CheckoutProvider, useCheckout} from './CheckoutProvider';
import {Elements} from '../../components/Elements';
import {useStripe} from '../../components/useStripe';
import * as mocks from '../../../test/mocks';
import makeDeferred from '../../../test/makeDeferred';

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

  const makeFetchClientSecret = () => async () => {
    return 'cs_123';
  };

  const wrapper = ({stripe, fetchClientSecret, children}: any) => (
    <CheckoutProvider
      stripe={stripe === undefined ? mockStripe : stripe}
      options={{
        fetchClientSecret: fetchClientSecret || makeFetchClientSecret(),
      }}
    >
      {children}
    </CheckoutProvider>
  );

  describe('interaction with useStripe()', () => {
    it('works with a Stripe instance', async () => {
      const {result, waitForNextUpdate} = renderHook(() => useStripe(), {
        wrapper,
        initialProps: {stripe: mockStripe},
      });

      expect(result.current).toBe(mockStripe);

      await waitForNextUpdate();

      expect(result.current).toBe(mockStripe);
    });

    it('works when updating null to a Stripe instance', async () => {
      const {result, rerender, waitForNextUpdate} = renderHook(
        () => useStripe(),
        {
          wrapper,
          initialProps: {stripe: null},
        }
      );

      expect(result.current).toBe(null);

      rerender({stripe: mockStripe});
      await waitForNextUpdate();

      expect(result.current).toBe(mockStripe);
    });

    it('works with a Promise', async () => {
      const deferred = makeDeferred();
      const {result} = renderHook(() => useStripe(), {
        wrapper,
        initialProps: {stripe: deferred.promise},
      });

      expect(result.current).toBe(null);

      await act(() => deferred.resolve(mockStripe));

      expect(result.current).toBe(mockStripe);
    });
  });

  describe('interaction with useCheckout()', () => {
    it('works when initCheckout resolves', async () => {
      const stripe: any = mocks.mockStripe();
      const deferred = makeDeferred();
      stripe.initCheckout.mockReturnValue(deferred.promise);

      const {result} = renderHook(() => useCheckout(), {
        wrapper,
        initialProps: {stripe},
      });

      expect(result.current).toEqual({type: 'loading'});
      expect(stripe.initCheckout).toHaveBeenCalledTimes(1);

      await act(() => deferred.resolve(mockCheckoutSdk));

      expect(result.current).toEqual({
        type: 'success',
        checkout: mockCheckout,
      });
      expect(stripe.initCheckout).toHaveBeenCalledTimes(1);
    });

    it('works when initCheckout rejects', async () => {
      const stripe: any = mocks.mockStripe();
      const deferred = makeDeferred();
      stripe.initCheckout.mockReturnValue(deferred.promise);

      const {result} = renderHook(() => useCheckout(), {
        wrapper,
        initialProps: {stripe},
      });

      expect(result.current).toEqual({type: 'loading'});
      expect(stripe.initCheckout).toHaveBeenCalledTimes(1);

      await act(() => deferred.reject(new Error('initCheckout error')));

      expect(result.current).toEqual({
        type: 'error',
        error: new Error('initCheckout error'),
      });
      expect(stripe.initCheckout).toHaveBeenCalledTimes(1);
    });

    it('does not set context if Promise resolves after CheckoutProvider is unmounted', async () => {
      const result = render(
        <CheckoutProvider
          stripe={mockStripePromise}
          options={{fetchClientSecret: async () => 'cs_123'}}
        >
          {null}
        </CheckoutProvider>
      );

      result.unmount();
      await act(() => mockStripePromise);

      expect(consoleError).not.toHaveBeenCalled();
    });
  });

  describe('stripe prop', () => {
    it('validates stripe prop type', async () => {
      // Silence console output so test output is less noisy
      consoleError.mockImplementation(() => {});

      const renderWithProp = (stripeProp: unknown) => () => {
        render(
          <CheckoutProvider
            stripe={stripeProp as any}
            options={{fetchClientSecret: async () => 'cs_123'}}
          >
            <div />
          </CheckoutProvider>
        );
      };

      expect(renderWithProp(undefined)).toThrow(
        'Invalid prop `stripe` supplied to `CheckoutProvider`.'
      );
      expect(renderWithProp(false)).toThrow(
        'Invalid prop `stripe` supplied to `CheckoutProvider`.'
      );
      expect(renderWithProp('foo')).toThrow(
        'Invalid prop `stripe` supplied to `CheckoutProvider`.'
      );
      expect(renderWithProp({foo: 'bar'})).toThrow(
        'Invalid prop `stripe` supplied to `CheckoutProvider`.'
      );
    });

    it('when stripe prop changes from null to a Stripe instance', async () => {
      const stripe: any = mocks.mockStripe();
      const deferred = makeDeferred();
      stripe.initCheckout.mockReturnValue(deferred.promise);

      const {result, rerender} = renderHook(() => useCheckout(), {
        wrapper,
        initialProps: {stripe: null},
      });

      expect(result.current).toEqual({type: 'loading'});
      expect(stripe.initCheckout).toHaveBeenCalledTimes(0);

      rerender({stripe});

      expect(result.current).toEqual({type: 'loading'});
      expect(stripe.initCheckout).toHaveBeenCalledTimes(1);

      await act(() => deferred.resolve(mockCheckoutSdk));

      expect(result.current).toEqual({
        type: 'success',
        checkout: mockCheckout,
      });
      expect(stripe.initCheckout).toHaveBeenCalledTimes(1);
    });

    it('when the stripe prop is a Promise', async () => {
      const stripe: any = mocks.mockStripe();
      const stripeDeferred = makeDeferred();
      const deferred = makeDeferred();
      stripe.initCheckout.mockReturnValue(deferred.promise);

      const {result} = renderHook(() => useCheckout(), {
        wrapper,
        initialProps: {stripe: stripeDeferred.promise},
      });

      expect(result.current).toEqual({type: 'loading'});
      expect(stripe.initCheckout).toHaveBeenCalledTimes(0);

      await act(() => stripeDeferred.resolve(stripe));

      expect(result.current).toEqual({type: 'loading'});
      expect(stripe.initCheckout).toHaveBeenCalledTimes(1);

      await act(() => deferred.resolve(mockCheckoutSdk));

      expect(result.current).toEqual({
        type: 'success',
        checkout: mockCheckout,
      });
      expect(stripe.initCheckout).toHaveBeenCalledTimes(1);
    });

    it('when the stripe prop changes from null to a Promise', async () => {
      const stripe: any = mocks.mockStripe();
      const stripeDeferred = makeDeferred();
      const deferred = makeDeferred();
      stripe.initCheckout.mockReturnValue(deferred.promise);

      const {result, rerender} = renderHook(() => useCheckout(), {
        wrapper,
        initialProps: {stripe: null},
      });

      expect(result.current).toEqual({type: 'loading'});
      expect(stripe.initCheckout).toHaveBeenCalledTimes(0);

      rerender({stripe});

      expect(result.current).toEqual({type: 'loading'});
      expect(stripe.initCheckout).toHaveBeenCalledTimes(1);

      await act(() => stripeDeferred.resolve(stripe));

      expect(result.current).toEqual({type: 'loading'});
      expect(stripe.initCheckout).toHaveBeenCalledTimes(1);

      await act(() => deferred.resolve(mockCheckoutSdk));

      expect(result.current).toEqual({
        type: 'success',
        checkout: mockCheckout,
      });
      expect(stripe.initCheckout).toHaveBeenCalledTimes(1);
    });

    it('when the stripe prop is a Promise(null)', async () => {
      const stripeDeferred = makeDeferred<any>();

      const {result} = renderHook(() => useCheckout(), {
        wrapper,
        initialProps: {stripe: stripeDeferred.promise},
      });

      expect(result.current).toEqual({type: 'loading'});

      await act(() => stripeDeferred.resolve(null));

      expect(result.current).toEqual({type: 'loading'});
    });

    it('does not allow changes to an already set Stripe object', async () => {
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
  });

  it('only calls initCheckout once and allows changes to elementsOptions appearance after setting the Stripe object', async () => {
    const fetchClientSecret = async () => 'cs_123';
    const result = render(
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

    await waitFor(() => {
      expect(mockStripe.initCheckout).toHaveBeenCalledWith({
        fetchClientSecret,
        elementsOptions: {
          appearance: {theme: 'stripe'},
        },
      });
    });

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

  it('allows options changes before setting the Stripe object', async () => {
    const fetchClientSecret = async () => 'cs_123';
    const result = render(
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

  describe('providers <> hooks', () => {
    it('throws when trying to call useCheckout outside of CheckoutProvider context', () => {
      const {result} = renderHook(() => useCheckout());

      expect(result.error && result.error.message).toBe(
        'Could not find CheckoutProvider context; You need to wrap the part of your app that calls useCheckout() in a <CheckoutProvider> provider.'
      );
    });

    it('throws when trying to call useStripe outside of CheckoutProvider context', () => {
      const {result} = renderHook(() => useStripe());

      expect(result.error && result.error.message).toBe(
        'Could not find Elements context; You need to wrap the part of your app that calls useStripe() in an <Elements> provider.'
      );
    });

    it('throws when trying to call useStripe in Elements -> CheckoutProvider nested context', async () => {
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

      const {result} = renderHook(() => useStripe(), {
        wrapper,
      });

      expect(result.error && result.error.message).toBe(
        'You cannot wrap the part of your app that calls useStripe() in both <CheckoutProvider> and <Elements> providers.'
      );
    });

    it('throws when trying to call useStripe in CheckoutProvider -> Elements nested context', async () => {
      const wrapper = ({children}: any) => (
        <CheckoutProvider
          stripe={mockStripe}
          options={{fetchClientSecret: async () => 'cs_123'}}
        >
          <Elements stripe={mockStripe}>{children}</Elements>
        </CheckoutProvider>
      );

      const {result} = renderHook(() => useStripe(), {
        wrapper,
      });
      expect(result.error && result.error.message).toBe(
        'You cannot wrap the part of your app that calls useStripe() in both <CheckoutProvider> and <Elements> providers.'
      );
    });
  });
});
