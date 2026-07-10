// smoke-tests/projects/react-18-vite/tests/payment-element.test.tsx
import React from 'react';
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {render} from '@testing-library/react';
import {
  Elements,
  PaymentElement,
  CardElement,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  AddressElement,
  LinkAuthenticationElement,
} from '@stripe/react-stripe-js';
import {createMockStripe, createMockElements, createMockElement} from './mocks/stripe';

function makeWrapper(stripe: any) {
  return ({children}: any) => <Elements stripe={stripe}>{children}</Elements>;
}

describe('PaymentElement — merchant integration', () => {
  let mockStripe: ReturnType<typeof createMockStripe>;
  let mockElements: ReturnType<typeof createMockElements>;
  let mockEl: ReturnType<typeof createMockElement>;

  beforeEach(() => {
    mockStripe = createMockStripe();
    mockElements = createMockElements();
    mockEl = createMockElement();
    mockStripe.elements.mockReturnValue(mockElements);
    mockElements.create.mockReturnValue(mockEl);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('mounts the payment element', () => {
    render(<Elements stripe={mockStripe}><PaymentElement id="pay" /></Elements>);
    expect(mockElements.create).toHaveBeenCalledWith('payment', {});
    expect(mockEl.mount).toHaveBeenCalled();
  });

  it('passes options to create', () => {
    render(
      <Elements stripe={mockStripe}>
        <PaymentElement options={{layout: 'tabs'}} />
      </Elements>
    );
    expect(mockElements.create).toHaveBeenCalledWith('payment', {layout: 'tabs'});
  });

  it('calls onReady', () => {
    const onReady = vi.fn();
    mockEl.on = vi.fn((ev: string, fn: any) => { if (ev === 'ready') fn({}); });
    render(<Elements stripe={mockStripe}><PaymentElement onReady={onReady} /></Elements>);
    expect(onReady).toHaveBeenCalled();
  });

  it('calls onChange', () => {
    const onChange = vi.fn();
    mockEl.on = vi.fn((ev: string, fn: any) => { if (ev === 'change') fn({complete: true}); });
    render(<Elements stripe={mockStripe}><PaymentElement onChange={onChange} /></Elements>);
    expect(onChange).toHaveBeenCalledWith({complete: true});
  });

  it('destroys element on unmount', () => {
    const {unmount} = render(<Elements stripe={mockStripe}><PaymentElement /></Elements>);
    unmount();
    expect(mockEl.destroy).toHaveBeenCalled();
  });

  it('renders empty container when stripe is null (SSR)', () => {
    const {container} = render(
      <Elements stripe={null}><PaymentElement id="ssr-test" /></Elements>
    );
    expect(container.querySelector('#ssr-test')).toBeTruthy();
    expect(mockElements.create).not.toHaveBeenCalled();
  });
});

describe('CardElement', () => {
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

  it('mounts card element with options', () => {
    render(
      <Elements stripe={mockStripe}>
        <CardElement options={{style: {base: {color: '#32325d'}}}} />
      </Elements>
    );
    expect(mockElements.create).toHaveBeenCalledWith('card', {style: {base: {color: '#32325d'}}});
  });
});

describe('Split card (CardNumber + Expiry + CVC)', () => {
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

  it('creates all three split card elements', () => {
    render(
      <Elements stripe={mockStripe}>
        <CardNumberElement />
        <CardExpiryElement />
        <CardCvcElement />
      </Elements>
    );
    expect(mockElements.create).toHaveBeenCalledWith('cardNumber', {});
    expect(mockElements.create).toHaveBeenCalledWith('cardExpiry', {});
    expect(mockElements.create).toHaveBeenCalledWith('cardCvc', {});
  });
});

describe('AddressElement', () => {
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

  it('mounts in billing mode', () => {
    render(
      <Elements stripe={mockStripe}>
        <AddressElement options={{mode: 'billing'}} />
      </Elements>
    );
    expect(mockElements.create).toHaveBeenCalledWith('address', {mode: 'billing'});
  });

  it('mounts in shipping mode', () => {
    render(
      <Elements stripe={mockStripe}>
        <AddressElement options={{mode: 'shipping'}} />
      </Elements>
    );
    expect(mockElements.create).toHaveBeenCalledWith('address', {mode: 'shipping'});
  });
});
