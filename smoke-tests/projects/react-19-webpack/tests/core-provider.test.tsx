import {render, waitFor} from '@testing-library/react';
import {renderHook, act} from '@testing-library/react';
import {Elements, useStripe, useElements} from '@stripe/react-stripe-js';
import {createMockStripe, createMockElements} from './mocks/stripe';

describe('Elements provider — React 19 webpack', () => {
  let mockStripe: any;
  let mockElements: ReturnType<typeof createMockElements>;

  beforeEach(() => {
    mockStripe = createMockStripe();
    mockElements = createMockElements();
    mockStripe.elements.mockReturnValue(mockElements);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('renders without errors', () => {
    expect(() => render(<Elements stripe={mockStripe}><div /></Elements>)).not.toThrow();
  });

  it('useStripe returns the Stripe instance', () => {
    const {result} = renderHook(() => useStripe(), {
      wrapper: ({children}) => <Elements stripe={mockStripe}>{children}</Elements>,
    });
    expect(result.current).toBe(mockStripe);
  });

  it('accepts null stripe for SSR', () => {
    const {result} = renderHook(() => useStripe(), {
      wrapper: ({children}) => <Elements stripe={null}>{children}</Elements>,
    });
    expect(result.current).toBe(null);
  });

  it('resolves async stripe Promise', async () => {
    const stripePromise: Promise<any> = Promise.resolve(mockStripe);
    const {result} = renderHook(() => useElements(), {
      wrapper: ({children}) => <Elements stripe={stripePromise}>{children}</Elements>,
    });
    expect(result.current).toBe(null);
    await waitFor(() => expect(result.current).toBe(mockElements));
  });

  it('useStripe outside Elements throws', () => {
    expect(() => renderHook(() => useStripe())).toThrow('Could not find Elements context');
  });
});
