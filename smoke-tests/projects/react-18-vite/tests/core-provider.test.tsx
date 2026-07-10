// smoke-tests/projects/react-18-vite/tests/core-provider.test.tsx
import React from 'react';
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {render, renderHook, waitFor, act} from '@testing-library/react';
import {Elements, ElementsConsumer, useStripe, useElements} from '@stripe/react-stripe-js';
import {createMockStripe, createMockElements} from './mocks/stripe';

describe('Elements provider — core integration (React 18)', () => {
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

  it('renders without errors', () => {
    expect(() =>
      render(<Elements stripe={mockStripe}><div /></Elements>)
    ).not.toThrow();
  });

  it('useStripe returns the Stripe instance immediately', () => {
    const {result} = renderHook(() => useStripe(), {
      wrapper: ({children}) => <Elements stripe={mockStripe}>{children}</Elements>,
    });
    expect(result.current).toBe(mockStripe);
  });

  it('useElements returns the Elements instance immediately', () => {
    const {result} = renderHook(() => useElements(), {
      wrapper: ({children}) => <Elements stripe={mockStripe}>{children}</Elements>,
    });
    expect(result.current).toBe(mockElements);
  });

  it('accepts null stripe for SSR — both hooks return null', () => {
    const {result: stripeResult} = renderHook(() => useStripe(), {
      wrapper: ({children}) => <Elements stripe={null}>{children}</Elements>,
    });
    const {result: elementsResult} = renderHook(() => useElements(), {
      wrapper: ({children}) => <Elements stripe={null}>{children}</Elements>,
    });
    expect(stripeResult.current).toBe(null);
    expect(elementsResult.current).toBe(null);
  });

  it('resolves async stripe Promise', async () => {
    const stripePromise = Promise.resolve(mockStripe);
    const {result} = renderHook(() => useElements(), {
      wrapper: ({children}) => <Elements stripe={stripePromise}>{children}</Elements>,
    });
    expect(result.current).toBe(null);
    await waitFor(() => expect(result.current).toBe(mockElements));
  });

  it('transitions from null to sync stripe', async () => {
    let stripe: any = null;
    const {result, rerender} = renderHook(() => useStripe(), {
      wrapper: ({children}) => <Elements stripe={stripe}>{children}</Elements>,
    });
    expect(result.current).toBe(null);
    stripe = mockStripe;
    rerender();
    await waitFor(() => expect(result.current).toBe(mockStripe));
  });

  it('transitions from null to async Promise', async () => {
    let stripe: any = null;
    const {result, rerender} = renderHook(() => useElements(), {
      wrapper: ({children}) => <Elements stripe={stripe}>{children}</Elements>,
    });
    const stripePromise = Promise.resolve(mockStripe);
    stripe = stripePromise;
    rerender();
    await waitFor(() => expect(result.current).toBe(mockElements));
  });

  it('ElementsConsumer receives stripe and elements', () => {
    let capturedStripe: any;
    let capturedElements: any;
    render(
      <Elements stripe={mockStripe}>
        <ElementsConsumer>
          {({stripe, elements}) => { capturedStripe = stripe; capturedElements = elements; return null; }}
        </ElementsConsumer>
      </Elements>
    );
    expect(capturedStripe).toBe(mockStripe);
    expect(capturedElements).toBe(mockElements);
  });

  it('warns when stripe prop changes after initial set', () => {
    const differentStripe = createMockStripe();
    differentStripe.elements.mockReturnValue(createMockElements());
    const {rerender} = render(<Elements stripe={mockStripe}><div /></Elements>);
    rerender(<Elements stripe={differentStripe}><div /></Elements>);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('cannot change the `stripe` prop')
    );
  });

  it('passes options to elements()', () => {
    const options = {clientSecret: 'pi_test_123_secret_456'};
    render(<Elements stripe={mockStripe} options={options}><div /></Elements>);
    expect(mockStripe.elements).toHaveBeenCalledWith(options);
  });

  it('calls elements.update() when allowed options change', () => {
    const {rerender} = render(
      <Elements stripe={mockStripe} options={{appearance: {theme: 'stripe'}}}><div /></Elements>
    );
    rerender(
      <Elements stripe={mockStripe} options={{appearance: {theme: 'flat'}}}><div /></Elements>
    );
    expect(mockElements.update).toHaveBeenCalledWith({appearance: {theme: 'flat'}});
  });

  it('useStripe outside Elements throws with actionable message', () => {
    expect(() => renderHook(() => useStripe())).toThrow(
      'Could not find Elements context; You need to wrap the part of your app that calls useStripe() in an <Elements> provider.'
    );
  });

  it('useElements outside Elements throws with actionable message', () => {
    expect(() => renderHook(() => useElements())).toThrow(
      'Could not find Elements context; You need to wrap the part of your app that calls useElements() in an <Elements> provider.'
    );
  });
});
