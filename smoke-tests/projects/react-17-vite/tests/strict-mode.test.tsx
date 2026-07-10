import React, {StrictMode} from 'react';
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {render} from '@testing-library/react';
import {act} from '@testing-library/react-hooks';
import {Elements} from '@stripe/react-stripe-js';
import {createMockStripe, createMockElements} from './mocks/stripe';

describe('React 17 StrictMode — effects run once', () => {
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
    render(<StrictMode><Elements stripe={mockStripe as any}><div /></Elements></StrictMode>);
    // useState initializer is double-called in React 16 StrictMode too for purity detection
    // but effects run once — so elements() from the effect path is never called twice
    // The 2 calls come from the useState(() => ...) initializer, not the effect
    expect(mockStripe.elements).toHaveBeenCalledTimes(2);
  });

  it('async Promise in StrictMode: elements() called exactly once', async () => {
    const stripePromise = Promise.resolve(mockStripe) as any;
    render(<StrictMode><Elements stripe={stripePromise}><div /></Elements></StrictMode>);
    await act(async () => { await stripePromise; });
    expect(mockStripe.elements).toHaveBeenCalledTimes(1);
  });

  it('null → sync stripe in StrictMode: elements() called once', async () => {
    let stripe: any = null;
    const {rerender} = render(
      <StrictMode><Elements stripe={stripe}><div /></Elements></StrictMode>
    );
    stripe = mockStripe;
    rerender(<StrictMode><Elements stripe={stripe}><div /></Elements></StrictMode>);
    await act(async () => {});
    expect(mockStripe.elements).toHaveBeenCalledTimes(1);
  });
});
