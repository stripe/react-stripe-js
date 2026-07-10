import {StrictMode} from 'react';
import {render} from '@testing-library/react';
import {Elements} from '@stripe/react-stripe-js';
import {createMockStripe, createMockElements} from './mocks/stripe';

describe('React 17 StrictMode — webpack', () => {
  let mockStripe: any;

  beforeEach(() => {
    mockStripe = createMockStripe();
    mockStripe.elements.mockReturnValue(createMockElements());
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('renders without errors in StrictMode', () => {
    expect(() =>
      render(<StrictMode><Elements stripe={mockStripe}><div /></Elements></StrictMode>)
    ).not.toThrow();
  });

  it('null → sync stripe: renders without errors', async () => {
    let stripe: any = null;
    const {rerender} = render(
      <StrictMode><Elements stripe={stripe}><div /></Elements></StrictMode>
    );
    stripe = mockStripe;
    rerender(<StrictMode><Elements stripe={stripe}><div /></Elements></StrictMode>);
    expect(mockStripe.elements).toHaveBeenCalledTimes(1);
  });
});
