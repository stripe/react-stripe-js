import React from 'react';
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {render} from '@testing-library/react';
import {renderHook, act} from '@testing-library/react-hooks';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js';
import {createMockStripe, createMockEmbeddedCheckout} from './mocks/stripe';

describe('EmbeddedCheckout (React 17)', () => {
  let mockStripe: ReturnType<typeof createMockStripe>;
  let mockEmbeddedCheckout: ReturnType<typeof createMockEmbeddedCheckout>;
  const fakeClientSecret = 'cs_test_123';
  const fetchClientSecret = () => Promise.resolve(fakeClientSecret);

  beforeEach(() => {
    mockStripe = createMockStripe();
    mockEmbeddedCheckout = createMockEmbeddedCheckout();
    mockStripe.initEmbeddedCheckout.mockReturnValue(
      Promise.resolve(mockEmbeddedCheckout)
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it('renders EmbeddedCheckoutProvider without crashing', () => {
    const {container} = render(
      <EmbeddedCheckoutProvider
        stripe={mockStripe as any}
        options={{fetchClientSecret}}
      >
        <div>checkout</div>
      </EmbeddedCheckoutProvider>
    );
    expect(container).not.toBeNull();
  });

  it('calls initEmbeddedCheckout once', async () => {
    render(
      <EmbeddedCheckoutProvider
        stripe={mockStripe as any}
        options={{fetchClientSecret}}
      >
        <div />
      </EmbeddedCheckoutProvider>
    );

    await act(async () => {
      await Promise.resolve(mockEmbeddedCheckout);
    });

    expect(mockStripe.initEmbeddedCheckout).toHaveBeenCalledTimes(1);
  });

  it('errors when stripe prop is undefined', () => {
    expect(() =>
      render(
        <EmbeddedCheckoutProvider
          stripe={undefined as any}
          options={{fetchClientSecret}}
        />
      )
    ).toThrow('Invalid prop `stripe` supplied to `EmbeddedCheckoutProvider`.');
  });

  it('works with a Promise resolving to a valid Stripe object', async () => {
    const stripePromise = Promise.resolve(mockStripe) as any;
    render(
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{fetchClientSecret}}
      >
        <div />
      </EmbeddedCheckoutProvider>
    );

    await act(async () => {
      await stripePromise;
    });

    expect(mockStripe.initEmbeddedCheckout).toHaveBeenCalledTimes(1);
  });
});
