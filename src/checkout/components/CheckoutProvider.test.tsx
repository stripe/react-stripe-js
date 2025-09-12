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
  let consoleError: any;
  let consoleWarn: any;
  let mockCheckoutActions: any;

  beforeEach(() => {
    mockCheckoutSdk = mocks.mockCheckoutSdk();
    mockCheckoutActions = mocks.mockCheckoutActions();
    mockCheckoutSdk.loadActions.mockResolvedValue({
      type: 'success',
      actions: mockCheckoutActions,
    });

    mockStripe = mocks.mockStripe();
    mockStripe.initCheckout.mockReturnValue(mockCheckoutSdk);
    mockStripePromise = Promise.resolve(mockStripe);

    jest.spyOn(console, 'error');
    jest.spyOn(console, 'warn');
    consoleError = console.error;
    consoleWarn = console.warn;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const fakeClientSecret = 'cs_123';

  const wrapper = ({stripe, clientSecret, children}: any) => (
    <CheckoutProvider
      stripe={stripe === undefined ? mockStripe : stripe}
      options={{
        clientSecret: clientSecret || fakeClientSecret,
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
    it('works when loadActions resolves', async () => {
      const stripe: any = mocks.mockStripe();
      const deferred = makeDeferred();
      const mockSdk = mocks.mockCheckoutSdk();
      const testMockCheckoutActions = mocks.mockCheckoutActions();
      const testMockSession = mocks.mockCheckoutSession();

      mockSdk.loadActions.mockReturnValue(deferred.promise);
      stripe.initCheckout.mockReturnValue(mockSdk);

      const {result} = renderHook(() => useCheckout(), {
        wrapper,
        initialProps: {stripe},
      });

      expect(result.current).toEqual({type: 'loading'});
      expect(stripe.initCheckout).toHaveBeenCalledTimes(1);

      await act(() =>
        deferred.resolve({
          type: 'success',
          actions: testMockCheckoutActions,
        })
      );

      const {on: _on, loadActions: _loadActions, ...elementsMethods} = mockSdk;
      const {
        getSession: _getSession,
        ...otherCheckoutActions
      } = testMockCheckoutActions;

      const expectedCheckout = {
        ...elementsMethods,
        ...otherCheckoutActions,
        ...testMockSession,
      };

      expect(result.current).toEqual({
        type: 'success',
        checkout: expectedCheckout,
      });
      expect(stripe.initCheckout).toHaveBeenCalledTimes(1);
    });

    it('works when loadActions rejects', async () => {
      const stripe: any = mocks.mockStripe();
      const deferred = makeDeferred();
      const mockSdk = mocks.mockCheckoutSdk();
      mockSdk.loadActions.mockReturnValue(deferred.promise);
      stripe.initCheckout.mockReturnValue(mockSdk);

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
          options={{clientSecret: Promise.resolve(fakeClientSecret)}}
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
            options={{clientSecret: fakeClientSecret}}
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
      const mockSdk = mocks.mockCheckoutSdk();
      const testMockCheckoutActions = mocks.mockCheckoutActions();
      const testMockSession = mocks.mockCheckoutSession();

      mockSdk.loadActions.mockReturnValue(deferred.promise);
      stripe.initCheckout.mockReturnValue(mockSdk);

      const {result, rerender} = renderHook(() => useCheckout(), {
        wrapper,
        initialProps: {stripe: null},
      });

      expect(result.current).toEqual({type: 'loading'});
      expect(stripe.initCheckout).toHaveBeenCalledTimes(0);

      rerender({stripe});

      expect(result.current).toEqual({type: 'loading'});
      expect(stripe.initCheckout).toHaveBeenCalledTimes(1);

      await act(() =>
        deferred.resolve({
          type: 'success',
          actions: testMockCheckoutActions,
        })
      );

      const {on: _on, loadActions: _loadActions, ...elementsMethods} = mockSdk;
      const {
        getSession: _getSession,
        ...otherCheckoutActions
      } = testMockCheckoutActions;

      const expectedCheckout = {
        ...elementsMethods,
        ...otherCheckoutActions,
        ...testMockSession,
      };

      expect(result.current).toEqual({
        type: 'success',
        checkout: expectedCheckout,
      });
      expect(stripe.initCheckout).toHaveBeenCalledTimes(1);
    });

    it('when the stripe prop is a Promise', async () => {
      const stripe: any = mocks.mockStripe();
      const stripeDeferred = makeDeferred();
      const deferred = makeDeferred();
      const mockSdk = mocks.mockCheckoutSdk();
      const testMockCheckoutActions = mocks.mockCheckoutActions();
      const testMockSession = mocks.mockCheckoutSession();

      mockSdk.loadActions.mockReturnValue(deferred.promise);
      stripe.initCheckout.mockReturnValue(mockSdk);

      const {result} = renderHook(() => useCheckout(), {
        wrapper,
        initialProps: {stripe: stripeDeferred.promise},
      });

      expect(result.current).toEqual({type: 'loading'});
      expect(stripe.initCheckout).toHaveBeenCalledTimes(0);

      await act(() => stripeDeferred.resolve(stripe));

      expect(result.current).toEqual({type: 'loading'});
      expect(stripe.initCheckout).toHaveBeenCalledTimes(1);

      await act(() =>
        deferred.resolve({
          type: 'success',
          actions: testMockCheckoutActions,
        })
      );

      const {on: _on, loadActions: _loadActions, ...elementsMethods} = mockSdk;
      const {
        getSession: _getSession,
        ...otherCheckoutActions
      } = testMockCheckoutActions;

      const expectedCheckout = {
        ...elementsMethods,
        ...otherCheckoutActions,
        ...testMockSession,
      };

      expect(result.current).toEqual({
        type: 'success',
        checkout: expectedCheckout,
      });
      expect(stripe.initCheckout).toHaveBeenCalledTimes(1);
    });

    it('when the stripe prop changes from null to a Promise', async () => {
      const stripe: any = mocks.mockStripe();
      const stripeDeferred = makeDeferred();
      const deferred = makeDeferred();
      const mockSdk = mocks.mockCheckoutSdk();
      const testMockCheckoutActions = mocks.mockCheckoutActions();
      const testMockSession = mocks.mockCheckoutSession();

      mockSdk.loadActions.mockReturnValue(deferred.promise);
      stripe.initCheckout.mockReturnValue(mockSdk);

      const {result, rerender} = renderHook(() => useCheckout(), {
        wrapper,
        initialProps: {stripe: null},
      });

      expect(result.current).toEqual({type: 'loading'});
      expect(stripe.initCheckout).toHaveBeenCalledTimes(0);

      rerender({stripe: stripeDeferred.promise as any});

      expect(result.current).toEqual({type: 'loading'});
      expect(stripe.initCheckout).toHaveBeenCalledTimes(0);

      await act(() => stripeDeferred.resolve(stripe));

      expect(result.current).toEqual({type: 'loading'});
      expect(stripe.initCheckout).toHaveBeenCalledTimes(1);

      await act(() =>
        deferred.resolve({
          type: 'success',
          actions: testMockCheckoutActions,
        })
      );

      const {on: _on, loadActions: _loadActions, ...elementsMethods} = mockSdk;
      const {
        getSession: _getSession,
        ...otherCheckoutActions
      } = testMockCheckoutActions;

      const expectedCheckout = {
        ...elementsMethods,
        ...otherCheckoutActions,
        ...testMockSession,
      };

      expect(result.current).toEqual({
        type: 'success',
        checkout: expectedCheckout,
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
            options={{clientSecret: fakeClientSecret}}
          />
        );
      });

      const mockStripe2: any = mocks.mockStripe();
      act(() => {
        result.rerender(
          <CheckoutProvider
            stripe={mockStripe2}
            options={{clientSecret: fakeClientSecret}}
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
    const result = render(
      <CheckoutProvider
        stripe={mockStripe}
        options={{
          clientSecret: fakeClientSecret,
          elementsOptions: {
            appearance: {theme: 'stripe'},
          },
        }}
      />
    );

    await waitFor(() => {
      expect(mockStripe.initCheckout).toHaveBeenCalledWith({
        clientSecret: fakeClientSecret,
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
            clientSecret: fakeClientSecret,
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
    act(() => {
      result = render(
        <CheckoutProvider
          stripe={mockStripe}
          options={{
            clientSecret: fakeClientSecret,
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
        clientSecret: fakeClientSecret,
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
            clientSecret: fakeClientSecret,
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
            clientSecret: fakeClientSecret,
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

      // This is not called, due to the fonts not changing.
      expect(mockCheckoutSdk.loadFonts).toHaveBeenCalledTimes(0);
    });
  });

  test('allows changes to elementsOptions fonts', async () => {
    let result: any;
    act(() => {
      result = render(
        <CheckoutProvider
          stripe={mockStripe}
          options={{
            clientSecret: fakeClientSecret,
            elementsOptions: {},
          }}
        />
      );
    });

    await waitFor(() =>
      expect(mockStripe.initCheckout).toHaveBeenCalledWith({
        clientSecret: fakeClientSecret,
        elementsOptions: {},
      })
    );

    act(() => {
      result.rerender(
        <CheckoutProvider
          stripe={mockStripe}
          options={{
            clientSecret: fakeClientSecret,
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
    const result = render(
      <CheckoutProvider
        stripe={null}
        options={{
          clientSecret: fakeClientSecret,
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
            clientSecret: fakeClientSecret,
            elementsOptions: {appearance: {theme: 'stripe'}},
          }}
        />
      );
    });

    await waitFor(() => {
      expect(console.warn).not.toHaveBeenCalled();
      expect(mockStripe.initCheckout).toHaveBeenCalledTimes(1);
      expect(mockStripe.initCheckout).toHaveBeenCalledWith({
        clientSecret: fakeClientSecret,
        elementsOptions: {
          appearance: {theme: 'stripe'},
        },
      });
    });
  });

  describe('React.StrictMode', () => {
    test('initCheckout once in StrictMode', async () => {
      const TestComponent = () => {
        useCheckout();
        return <div />;
      };

      act(() => {
        render(
          <StrictMode>
            <CheckoutProvider
              stripe={mockStripe}
              options={{clientSecret: fakeClientSecret}}
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
        useCheckout();
        return <div />;
      };

      act(() => {
        render(
          <StrictMode>
            <CheckoutProvider
              stripe={mockStripePromise}
              options={{clientSecret: fakeClientSecret}}
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
      act(() => {
        result = render(
          <StrictMode>
            <CheckoutProvider
              stripe={mockStripe}
              options={{
                clientSecret: fakeClientSecret,
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
          clientSecret: fakeClientSecret,
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
                clientSecret: fakeClientSecret,
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
            options={{clientSecret: fakeClientSecret}}
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
          options={{clientSecret: fakeClientSecret}}
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
