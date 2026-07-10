import React from 'react';
import {render, screen, waitFor} from '@testing-library/react';
import {renderHook} from '@testing-library/react';
import {Elements, useStripe, useElements, ElementsConsumer} from '@stripe/react-stripe-js';
import type {Stripe} from '@stripe/stripe-js';
import {createMockStripe, createMockElements} from '../__mocks__/stripe';

describe('Elements provider — React 18 CRA integration', () => {
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
    expect(() =>
      render(<Elements stripe={mockStripe as unknown as Stripe}><div /></Elements>)
    ).not.toThrow();
  });

  it('useStripe returns Stripe instance', () => {
    const {result} = renderHook(() => useStripe(), {
      wrapper: ({children}) => <Elements stripe={mockStripe as unknown as Stripe}>{children}</Elements>,
    });
    expect(result.current).toBe(mockStripe);
  });

  it('useElements returns Elements instance', () => {
    const {result} = renderHook(() => useElements(), {
      wrapper: ({children}) => <Elements stripe={mockStripe as unknown as Stripe}>{children}</Elements>,
    });
    expect(result.current).toBe(mockElements);
  });

  it('accepts null stripe (SSR) — hooks return null', () => {
    const {result} = renderHook(() => useStripe(), {
      wrapper: ({children}) => <Elements stripe={null}>{children}</Elements>,
    });
    expect(result.current).toBe(null);
  });

  it('resolves async stripe Promise', async () => {
    const stripePromise = Promise.resolve(mockStripe as unknown as Stripe);
    const {result} = renderHook(() => useElements(), {
      wrapper: ({children}) => <Elements stripe={stripePromise}>{children}</Elements>,
    });
    expect(result.current).toBe(null);
    await waitFor(() => expect(result.current).toBe(mockElements));
  });

  it('ElementsConsumer receives stripe and elements', () => {
    let s: any, e: any;
    render(
      <Elements stripe={mockStripe as unknown as Stripe}>
        <ElementsConsumer>
          {({stripe, elements}) => { s = stripe; e = elements; return null; }}
        </ElementsConsumer>
      </Elements>
    );
    expect(s).toBe(mockStripe);
    expect(e).toBe(mockElements);
  });

  it('useStripe outside Elements throws', () => {
    expect(() => renderHook(() => useStripe())).toThrow('Could not find Elements context');
  });
});
