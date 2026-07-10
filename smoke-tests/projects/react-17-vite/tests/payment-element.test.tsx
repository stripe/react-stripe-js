import React from 'react';
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {render} from '@testing-library/react';
import {renderHook, act} from '@testing-library/react-hooks';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import {createMockStripe, createMockElements, createMockElement} from './mocks/stripe';

describe('PaymentElement (React 17)', () => {
  let mockStripe: ReturnType<typeof createMockStripe>;
  let mockElements: ReturnType<typeof createMockElements>;
  let mockEl: ReturnType<typeof createMockElement>;

  beforeEach(() => {
    mockStripe = createMockStripe();
    mockElements = createMockElements();
    mockEl = createMockElement();
    mockStripe.elements.mockReturnValue(mockElements);
    mockElements.create.mockReturnValue(mockEl);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it('mounts a PaymentElement inside Elements', () => {
    const {container} = render(
      <Elements stripe={mockStripe as any}>
        <PaymentElement />
      </Elements>
    );
    expect(container.querySelector('div')).not.toBeNull();
  });

  it('useStripe returns the stripe instance inside Elements', () => {
    const wrapper = ({children}: {children?: React.ReactNode}) => (
      <Elements stripe={mockStripe as any}>{children}</Elements>
    );
    const {result} = renderHook(() => useStripe(), {wrapper});
    expect(result.current).toBe(mockStripe);
  });

  it('useElements returns elements inside Elements', () => {
    const wrapper = ({children}: {children?: React.ReactNode}) => (
      <Elements stripe={mockStripe as any}>{children}</Elements>
    );
    const {result} = renderHook(() => useElements(), {wrapper});
    expect(result.current).toBe(mockElements);
  });

  it('works with an async stripe promise', async () => {
    const stripePromise = Promise.resolve(mockStripe) as any;
    const wrapper = ({children}: {children?: React.ReactNode}) => (
      <Elements stripe={stripePromise}>{children}</Elements>
    );
    const {result, waitForNextUpdate} = renderHook(() => useStripe(), {wrapper});
    expect(result.current).toBe(null);

    await waitForNextUpdate();
    expect(result.current).toBe(mockStripe);
  });
});
