import React from 'react';
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {render} from '@testing-library/react';
import {Elements} from '@stripe/react-stripe-js';
import {ClassCheckoutForm} from '../src/ClassCheckoutForm';
import {createMockStripe, createMockElements, createMockElement} from './mocks/stripe';

describe('Class component + ElementsConsumer (React 16 pattern)', () => {
  let mockStripe: ReturnType<typeof createMockStripe>;
  let mockElements: ReturnType<typeof createMockElements>;

  beforeEach(() => {
    mockStripe = createMockStripe();
    mockElements = createMockElements();
    mockElements.create.mockReturnValue(createMockElement());
    mockStripe.elements.mockReturnValue(mockElements);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('renders class component form without errors', () => {
    expect(() =>
      render(
        <Elements stripe={mockStripe}>
          <ClassCheckoutForm />
        </Elements>
      )
    ).not.toThrow();
  });

  it('card element is mounted inside class form', () => {
    render(
      <Elements stripe={mockStripe}>
        <ClassCheckoutForm />
      </Elements>
    );
    expect(mockElements.create).toHaveBeenCalledWith('card', {});
  });
});
