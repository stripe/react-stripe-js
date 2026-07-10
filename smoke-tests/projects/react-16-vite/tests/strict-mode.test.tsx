import React, {StrictMode} from 'react';
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {render} from '@testing-library/react';
import {act} from '@testing-library/react-hooks';
import {Elements} from '@stripe/react-stripe-js';
import {createMockStripe, createMockElements} from './mocks/stripe';

describe('React 16 StrictMode — effects run once', () => {
  let mockStripe: ReturnType<typeof createMockStripe>;
  let mockElements: ReturnType<typeof createMockElements>;

  beforeEach(() => {
    mockStripe = createMockStripe();
    mockElements = createMockElements();
    mockStripe.elements.mockReturnValue(mockElements);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('renders without errors in StrictMode', () => {
    expect(() =>
      render(<StrictMode><Elements stripe={mockStripe}><div /></Elements></StrictMode>)
    ).not.toThrow();
  });

  it('async stripe in StrictMode: elements() called once', async () => {
    const stripePromise = Promise.resolve(mockStripe);
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
