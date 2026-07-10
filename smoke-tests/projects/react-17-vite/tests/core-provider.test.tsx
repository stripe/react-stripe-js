import React from 'react';
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {render} from '@testing-library/react';
import {renderHook, act} from '@testing-library/react-hooks';
import {Elements, useElements, useStripe} from '@stripe/react-stripe-js';
import {
  createMockStripe,
  createMockElements,
} from './mocks/stripe';

describe('Elements core provider (React 17)', () => {
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

  it('provides elements via useElements hook', () => {
    const wrapper = ({children}: {children?: React.ReactNode}) => (
      <Elements stripe={mockStripe as any}>{children}</Elements>
    );
    const {result} = renderHook(() => useElements(), {wrapper});
    expect(result.current).toBe(mockElements);
  });

  it('provides stripe via useStripe hook', () => {
    const wrapper = ({children}: {children?: React.ReactNode}) => (
      <Elements stripe={mockStripe as any}>{children}</Elements>
    );
    const {result} = renderHook(() => useStripe(), {wrapper});
    expect(result.current).toBe(mockStripe);
  });

  it('allows a transition from null to a valid Stripe object', async () => {
    let stripeProp: any = null;
    const wrapper = ({children}: {children?: React.ReactNode}) => (
      <Elements stripe={stripeProp}>{children}</Elements>
    );
    const {result, rerender} = renderHook(() => useElements(), {wrapper});
    expect(result.current).toBe(null);

    stripeProp = mockStripe;
    rerender();
    expect(result.current).toBe(mockElements);
  });

  it('works with a Promise resolving to a valid Stripe object', async () => {
    const stripePromise = Promise.resolve(mockStripe) as any;
    const wrapper = ({children}: {children?: React.ReactNode}) => (
      <Elements stripe={stripePromise}>{children}</Elements>
    );
    const {result, waitForNextUpdate} = renderHook(() => useElements(), {
      wrapper,
    });
    expect(result.current).toBe(null);

    await waitForNextUpdate();
    expect(result.current).toBe(mockElements);
  });

  it('throws when useElements is called outside Elements context', () => {
    // @testing-library/react-hooks captures errors in result.error instead of re-throwing
    const {result} = renderHook(() => useElements());
    expect(result.error).toEqual(
      expect.objectContaining({
        message: expect.stringContaining(
          'Could not find Elements context'
        ),
      })
    );
  });

  it('throws when useStripe is called outside Elements context', () => {
    // @testing-library/react-hooks captures errors in result.error instead of re-throwing
    const {result} = renderHook(() => useStripe());
    expect(result.error).toEqual(
      expect.objectContaining({
        message: expect.stringContaining(
          'Could not find Elements context'
        ),
      })
    );
  });

  it('errors when stripe prop is undefined', () => {
    expect(() =>
      render(<Elements stripe={undefined as any} />)
    ).toThrow('Invalid prop `stripe` supplied to `Elements`.');
  });

  it('does not allow changes to a set Stripe object', () => {
    const {rerender} = render(<Elements stripe={mockStripe as any} />);
    const mockStripe2 = createMockStripe();
    rerender(<Elements stripe={mockStripe2 as any} />);
    expect(mockStripe.elements).toHaveBeenCalledTimes(1);
    expect(mockStripe2.elements).toHaveBeenCalledTimes(0);
    expect(console.warn).toHaveBeenCalledWith(
      'Unsupported prop change on Elements: You cannot change the `stripe` prop after setting it.'
    );
  });
});
