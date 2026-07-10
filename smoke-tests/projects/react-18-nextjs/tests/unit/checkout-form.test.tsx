import React from 'react';
import {render, screen} from '@testing-library/react';
import {Elements} from '@stripe/react-stripe-js';
import {CheckoutForm} from '@/app/checkout/_components/CheckoutForm';
import {createMockStripe} from '@/lib/stripeMocks';

jest.mock('@stripe/stripe-js', () => ({loadStripe: jest.fn()}));

describe('React 18 + Next.js 14', () => {
  it('renders submit button as loading when stripe is null', () => {
    render(
      <Elements stripe={null}><CheckoutForm /></Elements>
    );
    expect(screen.getByTestId('submit-btn')).toHaveTextContent('Loading…');
    expect(screen.getByTestId('submit-btn')).toBeDisabled();
  });

  it('enables submit button when stripe is ready', () => {
    const mockStripe = createMockStripe() as any;
    render(
      <Elements stripe={mockStripe}><CheckoutForm /></Elements>
    );
    expect(screen.getByTestId('submit-btn')).toHaveTextContent('Pay now');
    expect(screen.getByTestId('submit-btn')).not.toBeDisabled();
  });
});
