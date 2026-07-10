// smoke-tests/projects/react-18-vite/tests/embedded-checkout.test.tsx
import React from 'react';
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {render, act, waitFor} from '@testing-library/react';
import {EmbeddedCheckoutProvider, EmbeddedCheckout} from '@stripe/react-stripe-js';
import {createMockStripe} from './mocks/stripe';

describe('EmbeddedCheckoutProvider + EmbeddedCheckout', () => {
  let mockStripe: ReturnType<typeof createMockStripe>;
  const options = {clientSecret: 'cs_test_embedded_123'};

  beforeEach(() => {
    mockStripe = createMockStripe();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('renders without errors', async () => {
    await act(async () => {
      render(
        <EmbeddedCheckoutProvider stripe={mockStripe} options={options}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      );
    });
  });

  it('calls initEmbeddedCheckout with options', async () => {
    await act(async () => {
      render(
        <EmbeddedCheckoutProvider stripe={mockStripe} options={options}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      );
    });
    expect(mockStripe.initEmbeddedCheckout).toHaveBeenCalledWith(options);
  });

  it('mounts embedded checkout widget', async () => {
    const mockEmbedded = {mount: vi.fn(), unmount: vi.fn(), destroy: vi.fn()};
    mockStripe.initEmbeddedCheckout.mockResolvedValue(mockEmbedded);
    await act(async () => {
      render(
        <EmbeddedCheckoutProvider stripe={mockStripe} options={options}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      );
    });
    await waitFor(() => expect(mockEmbedded.mount).toHaveBeenCalled());
  });

  it('destroys on unmount', async () => {
    const mockEmbedded = {mount: vi.fn(), unmount: vi.fn(), destroy: vi.fn()};
    mockStripe.initEmbeddedCheckout.mockResolvedValue(mockEmbedded);
    let unmount!: () => void;
    await act(async () => {
      ({unmount} = render(
        <EmbeddedCheckoutProvider stripe={mockStripe} options={options}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      ));
    });
    await waitFor(() => expect(mockEmbedded.mount).toHaveBeenCalled());
    act(() => unmount());
    await waitFor(() => expect(mockEmbedded.destroy).toHaveBeenCalled());
  });

  it('accepts null stripe for SSR', () => {
    expect(() =>
      render(
        <EmbeddedCheckoutProvider stripe={null} options={options}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      )
    ).not.toThrow();
  });
});
