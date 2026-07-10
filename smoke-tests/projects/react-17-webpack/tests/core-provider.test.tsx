import {render, waitFor} from '@testing-library/react';
import {renderHook, act} from '@testing-library/react-hooks';
import {Elements, useStripe, useElements} from '@stripe/react-stripe-js';
import {createMockStripe, createMockElements} from './mocks/stripe';

describe('Elements provider — React 17 webpack', () => {
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
      wrapper: ({children}: {children: React.ReactNode}) => <Elements stripe={mockStripe}>{children}</Elements>,
    });
    expect(result.current).toBe(mockStripe);
  });

  it('accepts null stripe for SSR', () => {
    const {result} = renderHook(() => useStripe(), {
      wrapper: ({children}: {children: React.ReactNode}) => <Elements stripe={null}>{children}</Elements>,
    });
    expect(result.current).toBe(null);
  });

  it('resolves async Promise', async () => {
    const stripePromise: Promise<any> = Promise.resolve(mockStripe);
    const {result, waitForNextUpdate} = renderHook(() => useElements(), {
      wrapper: ({children}: {children: React.ReactNode}) => <Elements stripe={stripePromise}>{children}</Elements>,
    });
    expect(result.current).toBe(null);
    await waitForNextUpdate();
    expect(result.current).toBe(mockElements);
  });

  it('useStripe outside Elements throws', () => {
    const {result} = renderHook(() => useStripe());
    expect(result.error).toBeDefined();
    expect((result.error as Error).message).toContain('Could not find Elements context');
  });
});
