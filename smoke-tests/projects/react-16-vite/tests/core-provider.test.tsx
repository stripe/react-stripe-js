import React from 'react'; // required for React 16 JSX classic runtime
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {render, waitFor} from '@testing-library/react';
import {renderHook, act} from '@testing-library/react-hooks';
import {Elements, ElementsConsumer, useStripe, useElements} from '@stripe/react-stripe-js';
import {createMockStripe, createMockElements} from './mocks/stripe';

describe('Elements provider — React 16 integration', () => {
  let mockStripe: ReturnType<typeof createMockStripe>;
  let mockElements: ReturnType<typeof createMockElements>;

  beforeEach(() => {
    mockStripe = createMockStripe();
    mockElements = createMockElements();
    mockStripe.elements.mockReturnValue(mockElements);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('renders without errors', () => {
    expect(() =>
      render(<Elements stripe={mockStripe}><div /></Elements>)
    ).not.toThrow();
  });

  it('useStripe returns Stripe instance', () => {
    const {result} = renderHook(() => useStripe(), {
      wrapper: ({children}: any) => <Elements stripe={mockStripe}>{children}</Elements>,
    });
    expect(result.current).toBe(mockStripe);
  });

  it('useElements returns Elements instance', () => {
    const {result} = renderHook(() => useElements(), {
      wrapper: ({children}: any) => <Elements stripe={mockStripe}>{children}</Elements>,
    });
    expect(result.current).toBe(mockElements);
  });

  it('accepts null stripe — returns null from hooks', () => {
    const {result} = renderHook(() => useStripe(), {
      wrapper: ({children}: any) => <Elements stripe={null}>{children}</Elements>,
    });
    expect(result.current).toBe(null);
  });

  it('resolves async stripe Promise', async () => {
    const stripePromise = Promise.resolve(mockStripe);
    const {result, waitForNextUpdate} = renderHook(() => useElements(), {
      wrapper: ({children}: any) => <Elements stripe={stripePromise}>{children}</Elements>,
    });
    expect(result.current).toBe(null);
    await waitForNextUpdate();
    expect(result.current).toBe(mockElements);
  });

  it('ElementsConsumer receives stripe and elements', () => {
    let s: any, e: any;
    render(
      <Elements stripe={mockStripe}>
        <ElementsConsumer>
          {({stripe, elements}) => { s = stripe; e = elements; return null; }}
        </ElementsConsumer>
      </Elements>
    );
    expect(s).toBe(mockStripe);
    expect(e).toBe(mockElements);
  });

  it('useStripe outside Elements throws', () => {
    const {result} = renderHook(() => useStripe());
    expect(result.error).toBeTruthy();
    expect((result.error as Error).message).toContain('Could not find Elements context');
  });
});
