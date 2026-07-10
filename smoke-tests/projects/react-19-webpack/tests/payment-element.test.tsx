import {render} from '@testing-library/react';
import {Elements, PaymentElement, CardNumberElement, CardExpiryElement, CardCvcElement} from '@stripe/react-stripe-js';
import {createMockStripe, createMockElements, createMockElement} from './mocks/stripe';

describe('Element components — webpack', () => {
  let mockStripe: any;
  let mockElements: ReturnType<typeof createMockElements>;

  beforeEach(() => {
    mockStripe = createMockStripe();
    mockElements = createMockElements();
    mockElements.create.mockReturnValue(createMockElement());
    mockStripe.elements.mockReturnValue(mockElements);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('PaymentElement mounts and destroys', () => {
    const {unmount} = render(<Elements stripe={mockStripe}><PaymentElement /></Elements>);
    expect(mockElements.create).toHaveBeenCalledWith('payment', {});
    unmount();
    const el = mockElements.create.mock.results[0].value;
    expect(el.destroy).toHaveBeenCalled();
  });

  it('split card elements all mount', () => {
    render(
      <Elements stripe={mockStripe}>
        <CardNumberElement /><CardExpiryElement /><CardCvcElement />
      </Elements>
    );
    expect(mockElements.create).toHaveBeenCalledWith('cardNumber', {});
    expect(mockElements.create).toHaveBeenCalledWith('cardExpiry', {});
    expect(mockElements.create).toHaveBeenCalledWith('cardCvc', {});
  });
});
