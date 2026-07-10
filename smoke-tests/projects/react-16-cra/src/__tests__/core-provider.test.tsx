import React from 'react'; // required for React 16 classic JSX
import {render} from '@testing-library/react';
import {renderHook, act} from '@testing-library/react-hooks'; // react-hooks package, NOT @testing-library/react
import {Elements, useStripe, useElements} from '@stripe/react-stripe-js';
import {createMockStripe, createMockElements} from '../__mocks__/stripe';

describe('Elements provider — React 16 CRA integration', () => {
  let mockStripe: ReturnType<typeof createMockStripe>;
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
    expect(() => render(<Elements stripe={mockStripe as any}><div /></Elements>)).not.toThrow();
  });

  it('useStripe returns Stripe instance', () => {
    const {result} = renderHook(() => useStripe(), {
      wrapper: ({children}: {children?: React.ReactNode}) => <Elements stripe={mockStripe as any}>{children}</Elements>,
    });
    expect(result.current).toBe(mockStripe);
  });

  it('accepts null stripe (SSR)', () => {
    const {result} = renderHook(() => useStripe(), {
      wrapper: ({children}: {children?: React.ReactNode}) => <Elements stripe={null}>{children}</Elements>,
    });
    expect(result.current).toBe(null);
  });

  it('resolves async Promise', async () => {
    const stripePromise = Promise.resolve(mockStripe) as any;
    const {result, waitForNextUpdate} = renderHook(() => useElements(), {
      wrapper: ({children}: {children?: React.ReactNode}) => <Elements stripe={stripePromise}>{children}</Elements>,
    });
    expect(result.current).toBe(null);
    await waitForNextUpdate();
    expect(result.current).toBe(mockElements);
  });

  it('useStripe outside Elements throws', () => {
    const {result} = renderHook(() => useStripe());
    expect(result.error).toBeTruthy();
    expect((result.error as Error).message).toContain('Could not find Elements context');
  });
});
