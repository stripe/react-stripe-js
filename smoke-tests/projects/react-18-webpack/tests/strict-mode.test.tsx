import React, {StrictMode} from 'react';
import {render, act} from '@testing-library/react';
import {Elements} from '@stripe/react-stripe-js';
import {createMockStripe, createMockElements} from './mocks/stripe';

describe('React 18 StrictMode — webpack', () => {
  let mockStripe: ReturnType<typeof createMockStripe>;

  beforeEach(() => {
    mockStripe = createMockStripe();
    mockStripe.elements.mockReturnValue(createMockElements());
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('async stripe: elements() called once', async () => {
    const stripePromise = Promise.resolve(mockStripe);
    render(<StrictMode><Elements stripe={stripePromise}><div /></Elements></StrictMode>);
    await act(async () => { await stripePromise; });
    expect(mockStripe.elements).toHaveBeenCalledTimes(1);
  });

  it('null → sync stripe: elements() called once', async () => {
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
