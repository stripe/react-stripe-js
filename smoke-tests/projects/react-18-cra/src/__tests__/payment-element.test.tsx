import React from 'react';
import {render} from '@testing-library/react';
import {Elements, PaymentElement, CardElement} from '@stripe/react-stripe-js';
import type {Stripe} from '@stripe/stripe-js';
import {createMockStripe, createMockElements, createMockElement} from '../__mocks__/stripe';

describe('PaymentElement — CRA integration', () => {
  let mockStripe: ReturnType<typeof createMockStripe>;
  let mockElements: ReturnType<typeof createMockElements>;
  let mockEl: ReturnType<typeof createMockElement>;

  beforeEach(() => {
    mockStripe = createMockStripe();
    mockElements = createMockElements();
    mockEl = createMockElement();
    mockStripe.elements.mockReturnValue(mockElements);
    mockElements.create.mockReturnValue(mockEl);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('mounts and destroys PaymentElement', () => {
    const {unmount} = render(
      <Elements stripe={mockStripe as unknown as Stripe}><PaymentElement /></Elements>
    );
    expect(mockElements.create).toHaveBeenCalledWith('payment', {});
    expect(mockEl.mount).toHaveBeenCalled();
    unmount();
    expect(mockEl.destroy).toHaveBeenCalled();
  });

  it('mounts CardElement', () => {
    render(
      <Elements stripe={mockStripe as unknown as Stripe}><CardElement /></Elements>
    );
    expect(mockElements.create).toHaveBeenCalledWith('card', {});
  });

  it('renders empty container when stripe is null', () => {
    const {container} = render(
      <Elements stripe={null}><PaymentElement id="ssr-el" /></Elements>
    );
    expect(container.querySelector('#ssr-el')).toBeTruthy();
    expect(mockElements.create).not.toHaveBeenCalled();
  });
});
