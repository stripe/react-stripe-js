import React from 'react';
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {render} from '@testing-library/react';
import {renderHook, act} from '@testing-library/react-hooks';
import {CheckoutProvider, useCheckout} from '@stripe/react-stripe-js/checkout';
import {
  createMockStripe,
  createMockCheckoutSdk,
  createMockCheckoutActions,
  createMockCheckoutSession,
} from './mocks/stripe';

describe('CheckoutProvider (React 17)', () => {
  let mockStripe: ReturnType<typeof createMockStripe>;
  let mockCheckoutSdk: ReturnType<typeof createMockCheckoutSdk>;
  let mockCheckoutActions: ReturnType<typeof createMockCheckoutActions>;
  const fakeClientSecret = 'cs_123';

  beforeEach(() => {
    mockCheckoutSdk = createMockCheckoutSdk();
    mockCheckoutActions = createMockCheckoutActions();
    mockCheckoutSdk.loadActions.mockResolvedValue({
      type: 'success',
      actions: mockCheckoutActions,
    });
    mockStripe = createMockStripe();
    mockStripe.initCheckout.mockReturnValue(mockCheckoutSdk);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  const makeWrapper =
    (stripe: any = null) =>
    ({children}: {children?: React.ReactNode}) =>
      (
        <CheckoutProvider
          stripe={stripe}
          options={{clientSecret: fakeClientSecret}}
        >
          {children}
        </CheckoutProvider>
      );

  it('starts in loading state', () => {
    const {result} = renderHook(() => useCheckout(), {
      wrapper: makeWrapper(mockStripe),
    });
    expect(result.current).toEqual({type: 'loading'});
  });

  it('transitions to success after loadActions resolves', async () => {
    const {result, waitForNextUpdate} = renderHook(() => useCheckout(), {
      wrapper: makeWrapper(mockStripe),
    });

    expect(result.current).toEqual({type: 'loading'});

    await waitForNextUpdate();

    expect(result.current.type).toBe('success');
    expect(mockStripe.initCheckout).toHaveBeenCalledTimes(1);
  });

  it('throws when useCheckout is called outside CheckoutProvider context', () => {
    // @testing-library/react-hooks captures errors in result.error instead of re-throwing
    const {result} = renderHook(() => useCheckout());
    expect(result.error).toEqual(
      expect.objectContaining({
        message: expect.stringContaining(
          'Could not find CheckoutProvider context'
        ),
      })
    );
  });

  it('works with a Promise resolving to a valid Stripe object', async () => {
    const stripePromise = Promise.resolve(mockStripe) as any;
    const {result, waitForNextUpdate} = renderHook(() => useCheckout(), {
      wrapper: makeWrapper(stripePromise),
    });

    expect(result.current).toEqual({type: 'loading'});

    await waitForNextUpdate();

    expect(result.current.type).toBe('success');
    expect(mockStripe.initCheckout).toHaveBeenCalledTimes(1);
  });

  it('renders CheckoutProvider without crashing', () => {
    const {container} = render(
      <CheckoutProvider
        stripe={mockStripe as any}
        options={{clientSecret: fakeClientSecret}}
      >
        <div>checkout content</div>
      </CheckoutProvider>
    );
    expect(container).not.toBeNull();
  });

  it('errors when stripe prop is invalid', () => {
    expect(() =>
      render(
        <CheckoutProvider
          stripe={undefined as any}
          options={{clientSecret: fakeClientSecret}}
        >
          <div />
        </CheckoutProvider>
      )
    ).toThrow('Invalid prop `stripe` supplied to `CheckoutProvider`.');
  });

  it('calls initCheckout once', async () => {
    const {waitForNextUpdate} = renderHook(() => useCheckout(), {
      wrapper: makeWrapper(mockStripe),
    });

    await waitForNextUpdate();

    expect(mockStripe.initCheckout).toHaveBeenCalledTimes(1);
    expect(mockStripe.initCheckout).toHaveBeenCalledWith({
      clientSecret: fakeClientSecret,
    });
  });
});
