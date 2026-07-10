// smoke-tests/projects/react-19-vite/tests/strict-mode.test.tsx
import React, {StrictMode} from 'react';
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {render, renderHook, act, waitFor} from '@testing-library/react';
import {Elements, useStripe} from '@stripe/react-stripe-js';
import {createMockStripe, createMockElements} from './mocks/stripe';

describe('React 19 StrictMode — effect double-invocation', () => {
  let mockStripe: ReturnType<typeof createMockStripe>;
  let mockElements: ReturnType<typeof createMockElements>;

  beforeEach(() => {
    mockStripe = createMockStripe();
    mockElements = createMockElements();
    mockStripe.elements.mockReturnValue(mockElements);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('sync stripe in StrictMode: elements() called twice (useState initializer — expected)', () => {
    render(<StrictMode><Elements stripe={mockStripe}><div /></Elements></StrictMode>);
    expect(mockStripe.elements).toHaveBeenCalledTimes(2);
  });

  it('async Promise in StrictMode: elements() called exactly once (effect guard)', async () => {
    const stripePromise = Promise.resolve(mockStripe);
    render(<StrictMode><Elements stripe={stripePromise}><div /></Elements></StrictMode>);
    await act(async () => { await stripePromise; });
    expect(mockStripe.elements).toHaveBeenCalledTimes(1);
  });

  it('null → sync stripe in StrictMode: elements() called once', async () => {
    let stripe: any = null;
    const {rerender} = render(<StrictMode><Elements stripe={stripe}><div /></Elements></StrictMode>);
    stripe = mockStripe;
    rerender(<StrictMode><Elements stripe={stripe}><div /></Elements></StrictMode>);
    await act(async () => {});
    expect(mockStripe.elements).toHaveBeenCalledTimes(1);
  });

  it('null → async Promise in StrictMode: elements() called once', async () => {
    let stripe: any = null;
    const {rerender} = render(<StrictMode><Elements stripe={stripe}><div /></Elements></StrictMode>);
    const stripePromise = Promise.resolve(mockStripe);
    stripe = stripePromise;
    rerender(<StrictMode><Elements stripe={stripe}><div /></Elements></StrictMode>);
    await act(async () => { await stripePromise; });
    expect(mockStripe.elements).toHaveBeenCalledTimes(1);
  });

  it('hooks return correct values in StrictMode', () => {
    const {result} = renderHook(() => useStripe(), {
      wrapper: ({children}) => (
        <StrictMode><Elements stripe={mockStripe}>{children}</Elements></StrictMode>
      ),
    });
    expect(result.current).toBe(mockStripe);
  });
});
