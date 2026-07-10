// smoke-tests/projects/react-18-vite/tests/checkout-provider.test.tsx
import React from 'react';
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {renderHook, act, waitFor} from '@testing-library/react';
import {CheckoutProvider, useCheckout} from '@stripe/react-stripe-js/checkout';
import {createMockStripe} from './mocks/stripe';

describe('CheckoutProvider + useCheckout (React 18)', () => {
  let mockStripe: ReturnType<typeof createMockStripe>;
  const options = {clientSecret: 'cs_test_checkout_123'};

  beforeEach(() => {
    mockStripe = createMockStripe();
    // minimal checkout SDK — initCheckout returns synchronously a StripeCheckout-shaped object
    const mockSdk = {
      on: vi.fn(),
      loadActions: vi.fn().mockResolvedValue({
        type: 'success',
        actions: {
          getSession: vi.fn(() => ({
            lineItems: [],
            currency: 'usd',
            total: {total: 1099},
            confirmationRequirements: [],
            canConfirm: true,
          })),
        },
      }),
      createPaymentElement: vi.fn(() => ({
        mount: vi.fn(),
        destroy: vi.fn(),
        on: vi.fn(),
        update: vi.fn(),
      })),
      getPaymentElement: vi.fn(() => null),
      changeAppearance: vi.fn(),
      loadFonts: vi.fn(),
    };
    mockStripe.initCheckout.mockReturnValue(mockSdk);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('starts in loading state', () => {
    const {result} = renderHook(() => useCheckout(), {
      wrapper: ({children}) => (
        <CheckoutProvider stripe={mockStripe} options={options}>{children}</CheckoutProvider>
      ),
    });
    expect(result.current).toEqual({type: 'loading'});
  });

  it('transitions to success after session loads', async () => {
    const {result} = renderHook(() => useCheckout(), {
      wrapper: ({children}) => (
        <CheckoutProvider stripe={mockStripe} options={options}>{children}</CheckoutProvider>
      ),
    });
    await waitFor(() => expect(result.current.type).not.toBe('loading'));
    expect(result.current.type).toBe('success');
  });

  it('returns loading when stripe is null (SSR)', () => {
    const {result} = renderHook(() => useCheckout(), {
      wrapper: ({children}) => (
        <CheckoutProvider stripe={null} options={options}>{children}</CheckoutProvider>
      ),
    });
    expect(result.current).toEqual({type: 'loading'});
    expect(mockStripe.initCheckout).not.toHaveBeenCalled();
  });

  it('useCheckout outside CheckoutProvider throws', () => {
    expect(() => renderHook(() => useCheckout())).toThrow(
      'Could not find CheckoutProvider context'
    );
  });
});
