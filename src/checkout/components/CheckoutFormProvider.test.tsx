import React, {StrictMode} from 'react';
import {render, act, waitFor} from '@testing-library/react';
import {renderHook} from '@testing-library/react-hooks';

import {CheckoutFormProvider} from './CheckoutFormProvider';
import {
  useCheckout,
  useCheckoutElements,
  useCheckoutForm,
} from './CheckoutContext';
import * as mocks from '../../../test/mocks';
import makeDeferred from '../../../test/makeDeferred';

describe('CheckoutFormProvider', () => {
  let mockStripe: any;
  let mockStripePromise: any;
  let mockCheckoutSdk: any;
  let consoleWarn: any;
  let consoleError: any;

  beforeEach(() => {
    mockCheckoutSdk = mocks.mockCheckoutSdk();
    const mockCheckoutActions = mocks.mockCheckoutActions();
    mockCheckoutSdk.loadActions.mockResolvedValue({
      type: 'success',
      actions: mockCheckoutActions,
    });

    mockStripe = mocks.mockStripe();
    mockStripe.initCheckoutFormSdk.mockReturnValue(mockCheckoutSdk);
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

  describe('calls initCheckoutFormSdk (not initCheckoutElementsSdk)', () => {
    it('calls initCheckoutFormSdk with the provided options', async () => {
      render(
        <CheckoutFormProvider
          stripe={mockStripe}
          options={{clientSecret: fakeClientSecret}}
        >
          <div />
        </CheckoutFormProvider>
      );

      await waitFor(() => {
        expect(mockStripe.initCheckoutFormSdk).toHaveBeenCalledTimes(1);
        expect(mockStripe.initCheckoutFormSdk).toHaveBeenCalledWith({
          clientSecret: fakeClientSecret,
        });
        expect(mockStripe.initCheckoutElementsSdk).not.toHaveBeenCalled();
      });
    });

    it('calls initCheckoutFormSdk once in StrictMode', async () => {
      const TestComponent = () => {
        useCheckout();
        return <div />;
      };

      act(() => {
        render(
          <StrictMode>
            <CheckoutFormProvider
              stripe={mockStripe}
              options={{clientSecret: fakeClientSecret}}
            >
              <TestComponent />
            </CheckoutFormProvider>
          </StrictMode>
        );
      });

      await waitFor(() =>
        expect(mockStripe.initCheckoutFormSdk).toHaveBeenCalledTimes(1)
      );
    });

    it('calls initCheckoutFormSdk once with stripePromise in StrictMode', async () => {
      const TestComponent = () => {
        useCheckout();
        return <div />;
      };

      act(() => {
        render(
          <StrictMode>
            <CheckoutFormProvider
              stripe={mockStripePromise}
              options={{clientSecret: fakeClientSecret}}
            >
              <TestComponent />
            </CheckoutFormProvider>
          </StrictMode>
        );
      });

      await waitFor(() =>
        expect(mockStripe.initCheckoutFormSdk).toHaveBeenCalledTimes(1)
      );
    });
  });

  describe('useCheckout() works within CheckoutFormProvider', () => {
    it('provides checkout state through shared context', async () => {
      const stripe: any = mocks.mockStripe();
      const deferred = makeDeferred();
      const mockSdk = mocks.mockCheckoutSdk();
      const testMockCheckoutActions = mocks.mockCheckoutActions();
      const testMockSession = mocks.mockCheckoutSession();

      mockSdk.loadActions.mockReturnValue(deferred.promise);
      stripe.initCheckoutFormSdk.mockReturnValue(mockSdk);

      const wrapper = ({children}: any) => (
        <CheckoutFormProvider
          stripe={stripe}
          options={{clientSecret: fakeClientSecret}}
        >
          {children}
        </CheckoutFormProvider>
      );

      const {result} = renderHook(() => useCheckout(), {wrapper});

      expect(result.current).toEqual({type: 'loading'});
      expect(stripe.initCheckoutFormSdk).toHaveBeenCalledTimes(1);

      await act(() =>
        deferred.resolve({
          type: 'success',
          actions: testMockCheckoutActions,
        })
      );

      const {on: _on, loadActions: _loadActions, ...sdkMethods} = mockSdk;
      const {
        getSession: _getSession,
        ...otherCheckoutActions
      } = testMockCheckoutActions;

      expect(result.current).toEqual({
        type: 'success',
        checkout: {
          ...sdkMethods,
          ...otherCheckoutActions,
          ...testMockSession,
        },
      });
    });

    // Mirrors the runtime transform of stripe-js that strips 5 client-only
    // update methods before loadActions() resolves. Guards against React
    // wiring that would accidentally re-expose those methods via
    // useCheckout() under <CheckoutFormProvider>.
    it('does not expose the 5 stripped action methods on useCheckout().checkout', async () => {
      const stripe: any = mocks.mockStripe();
      const mockSdk = mocks.mockCheckoutSdk();
      const {
        updateEmail: _updateEmail,
        updatePhoneNumber: _updatePhoneNumber,
        updateShippingAddress: _updateShippingAddress,
        updateBillingAddress: _updateBillingAddress,
        updateTaxIdInfo: _updateTaxIdInfo,
        ...formStrippedActions
      } = mocks.mockCheckoutActions();

      mockSdk.loadActions.mockResolvedValue({
        type: 'success',
        actions: formStrippedActions,
      });
      stripe.initCheckoutFormSdk.mockReturnValue(mockSdk);

      const wrapper = ({children}: any) => (
        <CheckoutFormProvider
          stripe={stripe}
          options={{clientSecret: fakeClientSecret}}
        >
          {children}
        </CheckoutFormProvider>
      );

      const {result, waitForNextUpdate} = renderHook(() => useCheckout(), {
        wrapper,
      });

      await waitForNextUpdate();

      if (result.current.type !== 'success') {
        throw new Error(
          `expected success, got ${JSON.stringify(result.current)}`
        );
      }
      const {checkout} = result.current;

      expect((checkout as any).updateEmail).toBeUndefined();
      expect((checkout as any).updatePhoneNumber).toBeUndefined();
      expect((checkout as any).updateShippingAddress).toBeUndefined();
      expect((checkout as any).updateBillingAddress).toBeUndefined();
      expect((checkout as any).updateTaxIdInfo).toBeUndefined();

      expect(typeof checkout.applyPromotionCode).toBe('function');
      expect(typeof checkout.removePromotionCode).toBe('function');
      expect(typeof checkout.updateLineItemQuantity).toBe('function');
      expect(typeof checkout.updateShippingOption).toBe('function');
      expect(typeof checkout.confirm).toBe('function');
    });

    // useCheckoutForm() is the recommended hook for Form consumers — it
    // returns the narrower StripeCheckoutFormValue where the 5 stripped
    // methods are omitted at the type level, so calls to them become
    // TypeScript errors instead of runtime "is not a function" failures.
    it('useCheckoutForm() returns the Form-narrowed action surface', async () => {
      const stripe: any = mocks.mockStripe();
      const mockSdk = mocks.mockCheckoutSdk();
      const {
        updateEmail: _updateEmail,
        updatePhoneNumber: _updatePhoneNumber,
        updateShippingAddress: _updateShippingAddress,
        updateBillingAddress: _updateBillingAddress,
        updateTaxIdInfo: _updateTaxIdInfo,
        ...formStrippedActions
      } = mocks.mockCheckoutActions();

      mockSdk.loadActions.mockResolvedValue({
        type: 'success',
        actions: formStrippedActions,
      });
      stripe.initCheckoutFormSdk.mockReturnValue(mockSdk);

      const wrapper = ({children}: any) => (
        <CheckoutFormProvider
          stripe={stripe}
          options={{clientSecret: fakeClientSecret}}
        >
          {children}
        </CheckoutFormProvider>
      );

      const {result, waitForNextUpdate} = renderHook(() => useCheckoutForm(), {
        wrapper,
      });

      await waitForNextUpdate();

      if (result.current.type !== 'success') {
        throw new Error(
          `expected success, got ${JSON.stringify(result.current)}`
        );
      }
      const {checkout} = result.current;

      expect((checkout as any).updateEmail).toBeUndefined();
      expect((checkout as any).updatePhoneNumber).toBeUndefined();
      expect((checkout as any).updateShippingAddress).toBeUndefined();
      expect((checkout as any).updateBillingAddress).toBeUndefined();
      expect((checkout as any).updateTaxIdInfo).toBeUndefined();

      expect(typeof checkout.applyPromotionCode).toBe('function');
      expect(typeof checkout.removePromotionCode).toBe('function');
      expect(typeof checkout.updateLineItemQuantity).toBe('function');
      expect(typeof checkout.updateShippingOption).toBe('function');
      expect(typeof checkout.confirm).toBe('function');
    });

    // useCheckoutElements() under the wrong provider must fail loudly at
    // first render so integrators catch the misuse immediately instead of
    // calling methods that don't exist on the Form SDK at runtime.
    it('useCheckoutElements() throws when used under <CheckoutFormProvider>', async () => {
      consoleError.mockImplementation(() => {});
      const wrapper = ({children}: any) => (
        <CheckoutFormProvider
          stripe={mockStripe}
          options={{clientSecret: fakeClientSecret}}
        >
          {children}
        </CheckoutFormProvider>
      );

      const {result, waitForNextUpdate} = renderHook(
        () => useCheckoutElements(),
        {wrapper}
      );

      await waitForNextUpdate();

      expect(result.error).toBeDefined();
      expect(result.error?.message).toMatch(
        /useCheckoutElements\(\) must be used inside <CheckoutElementsProvider>/
      );
    });
  });

  describe('top-level appearance option (not nested under elementsOptions)', () => {
    it('passes top-level appearance to initCheckoutFormSdk and calls changeAppearance on update', async () => {
      const result = render(
        <CheckoutFormProvider
          stripe={mockStripe}
          options={{
            clientSecret: fakeClientSecret,
            appearance: {theme: 'stripe'},
          }}
        />
      );

      await waitFor(() => {
        expect(mockStripe.initCheckoutFormSdk).toHaveBeenCalledWith({
          clientSecret: fakeClientSecret,
          appearance: {theme: 'stripe'},
        });
      });

      act(() => {
        result.rerender(
          <CheckoutFormProvider
            stripe={mockStripe}
            options={{
              clientSecret: fakeClientSecret,
              appearance: {theme: 'night'},
            }}
          />
        );
      });

      await waitFor(() => {
        expect(mockStripe.initCheckoutFormSdk).toHaveBeenCalledTimes(1);
        expect(mockCheckoutSdk.changeAppearance).toHaveBeenCalledTimes(1);
        expect(mockCheckoutSdk.changeAppearance).toHaveBeenCalledWith({
          theme: 'night',
        });
      });
    });

    it('allows changes to appearance via changeAppearance in StrictMode', async () => {
      let result: any;
      act(() => {
        result = render(
          <StrictMode>
            <CheckoutFormProvider
              stripe={mockStripe}
              options={{
                clientSecret: fakeClientSecret,
                appearance: {theme: 'stripe'},
              }}
            />
          </StrictMode>
        );
      });

      await waitFor(() => {
        expect(mockStripe.initCheckoutFormSdk).toHaveBeenCalledTimes(1);
        expect(mockStripe.initCheckoutFormSdk).toHaveBeenCalledWith({
          clientSecret: fakeClientSecret,
          appearance: {theme: 'stripe'},
        });
      });

      act(() => {
        result.rerender(
          <StrictMode>
            <CheckoutFormProvider
              stripe={mockStripe}
              options={{
                clientSecret: fakeClientSecret,
                appearance: {theme: 'night'},
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

  describe('top-level fonts option (not nested under elementsOptions)', () => {
    it('calls loadFonts when fonts change', async () => {
      let result: any;
      act(() => {
        result = render(
          <CheckoutFormProvider
            stripe={mockStripe}
            options={{clientSecret: fakeClientSecret}}
          />
        );
      });

      await waitFor(() =>
        expect(mockStripe.initCheckoutFormSdk).toHaveBeenCalledWith({
          clientSecret: fakeClientSecret,
        })
      );

      act(() => {
        result.rerender(
          <CheckoutFormProvider
            stripe={mockStripe}
            options={{
              clientSecret: fakeClientSecret,
              fonts: [{cssSrc: 'https://example.com/font.css'}],
            }}
          />
        );
      });

      await waitFor(() => {
        expect(mockStripe.initCheckoutFormSdk).toHaveBeenCalledTimes(1);
        expect(mockCheckoutSdk.loadFonts).toHaveBeenCalledTimes(1);
        expect(mockCheckoutSdk.loadFonts).toHaveBeenCalledWith([
          {cssSrc: 'https://example.com/font.css'},
        ]);
      });
    });

    it('does not call loadFonts again if fonts do not change', async () => {
      let result: any;
      act(() => {
        result = render(
          <CheckoutFormProvider
            stripe={mockStripe}
            options={{
              clientSecret: fakeClientSecret,
              fonts: [{cssSrc: 'https://example.com/font.css'}],
            }}
          />
        );
      });

      await waitFor(() =>
        expect(mockStripe.initCheckoutFormSdk).toHaveBeenCalledWith({
          clientSecret: fakeClientSecret,
          fonts: [{cssSrc: 'https://example.com/font.css'}],
        })
      );

      act(() => {
        result.rerender(
          <CheckoutFormProvider
            stripe={mockStripe}
            options={{
              clientSecret: fakeClientSecret,
              fonts: [{cssSrc: 'https://example.com/font.css'}],
            }}
          />
        );
      });

      act(() => {
        result.rerender(
          <CheckoutFormProvider
            stripe={mockStripe}
            options={{
              clientSecret: fakeClientSecret,
              fonts: [{cssSrc: 'https://example.com/font.css'}],
            }}
          />
        );
      });

      await waitFor(() => {
        expect(mockStripe.initCheckoutFormSdk).toHaveBeenCalledTimes(1);
        expect(mockCheckoutSdk.loadFonts).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('stripe prop validation', () => {
    it('validates stripe prop type with CheckoutFormProvider-specific message', () => {
      consoleError.mockImplementation(() => {});

      const renderWithProp = (stripeProp: unknown) => () => {
        render(
          <CheckoutFormProvider
            stripe={stripeProp as any}
            options={{clientSecret: fakeClientSecret}}
          >
            <div />
          </CheckoutFormProvider>
        );
      };

      expect(renderWithProp(undefined)).toThrow(
        'Invalid prop `stripe` supplied to `CheckoutFormProvider`.'
      );
      expect(renderWithProp(false)).toThrow(
        'Invalid prop `stripe` supplied to `CheckoutFormProvider`.'
      );
      expect(renderWithProp('foo')).toThrow(
        'Invalid prop `stripe` supplied to `CheckoutFormProvider`.'
      );
    });

    it('does not allow changes to an already set Stripe object', async () => {
      consoleWarn.mockImplementation(() => {});
      let result: any;
      act(() => {
        result = render(
          <CheckoutFormProvider
            stripe={mockStripe}
            options={{clientSecret: fakeClientSecret}}
          />
        );
      });

      const mockStripe2: any = mocks.mockStripe();
      act(() => {
        result.rerender(
          <CheckoutFormProvider
            stripe={mockStripe2}
            options={{clientSecret: fakeClientSecret}}
          />
        );
      });

      await waitFor(() => {
        expect(mockStripe.initCheckoutFormSdk).toHaveBeenCalledTimes(1);
        expect(mockStripe2.initCheckoutFormSdk).toHaveBeenCalledTimes(0);
        expect(consoleWarn).toHaveBeenCalledWith(
          'Unsupported prop change on CheckoutFormProvider: You cannot change the `stripe` prop after setting it.'
        );
      });
    });
  });

  it('allows options changes before setting the Stripe object', async () => {
    const result = render(
      <CheckoutFormProvider
        stripe={null}
        options={{
          clientSecret: fakeClientSecret,
          appearance: {theme: 'stripe'},
        }}
      />
    );

    await waitFor(() =>
      expect(mockStripe.initCheckoutFormSdk).toHaveBeenCalledTimes(0)
    );

    act(() => {
      result.rerender(
        <CheckoutFormProvider
          stripe={mockStripe}
          options={{
            clientSecret: fakeClientSecret,
            appearance: {theme: 'stripe'},
          }}
        />
      );
    });

    await waitFor(() => {
      expect(console.warn).not.toHaveBeenCalled();
      expect(mockStripe.initCheckoutFormSdk).toHaveBeenCalledTimes(1);
      expect(mockStripe.initCheckoutFormSdk).toHaveBeenCalledWith({
        clientSecret: fakeClientSecret,
        appearance: {theme: 'stripe'},
      });
    });
  });
});
