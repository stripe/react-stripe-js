import {render} from '@testing-library/react';
import {Elements, PaymentElement, CardElement} from '@stripe/react-stripe-js';
import {createMockStripe, createMockElements, createMockElement} from '../__mocks__/stripe';

describe('PaymentElement — React 17 CRA', () => {
  let mockStripe: ReturnType<typeof createMockStripe>;
  let mockElements: ReturnType<typeof createMockElements>;

  beforeEach(() => {
    mockStripe = createMockStripe();
    mockElements = createMockElements();
    mockElements.create.mockReturnValue(createMockElement());
    mockStripe.elements.mockReturnValue(mockElements);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('mounts PaymentElement', () => {
    render(<Elements stripe={mockStripe as any}><PaymentElement /></Elements>);
    expect(mockElements.create).toHaveBeenCalledWith('payment', {});
  });

  it('mounts CardElement', () => {
    render(<Elements stripe={mockStripe as any}><CardElement /></Elements>);
    expect(mockElements.create).toHaveBeenCalledWith('card', {});
  });

  it('renders empty container when stripe is null', () => {
    const {container} = render(<Elements stripe={null}><PaymentElement id="ssr-el" /></Elements>);
    expect(container.querySelector('#ssr-el')).toBeTruthy();
    expect(mockElements.create).not.toHaveBeenCalled();
  });
});
