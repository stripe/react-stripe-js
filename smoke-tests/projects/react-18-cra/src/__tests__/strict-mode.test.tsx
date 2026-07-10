import React, {StrictMode} from 'react';
import {render, act} from '@testing-library/react';
import {Elements} from '@stripe/react-stripe-js';
import type {Stripe} from '@stripe/stripe-js';
import {createMockStripe, createMockElements} from '../__mocks__/stripe';

describe('React 18 StrictMode — CRA', () => {
  let mockStripe: ReturnType<typeof createMockStripe>;

  beforeEach(() => {
    mockStripe = createMockStripe();
    mockStripe.elements.mockReturnValue(createMockElements());
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('async stripe in StrictMode: elements() called once', async () => {
    const stripePromise = Promise.resolve(mockStripe as unknown as Stripe);
    render(<StrictMode><Elements stripe={stripePromise}><div /></Elements></StrictMode>);
    await act(async () => { await stripePromise; });
    expect(mockStripe.elements).toHaveBeenCalledTimes(1);
  });

  it('null → sync stripe in StrictMode: elements() called once', async () => {
    const {rerender} = render(
      <StrictMode><Elements stripe={null}><div /></Elements></StrictMode>
    );
    rerender(<StrictMode><Elements stripe={mockStripe as unknown as Stripe}><div /></Elements></StrictMode>);
    await act(async () => {});
    expect(mockStripe.elements).toHaveBeenCalledTimes(1);
  });
});
