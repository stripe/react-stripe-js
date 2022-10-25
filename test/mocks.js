export const mockElement = () => ({
  mount: jest.fn(),
  destroy: jest.fn(),
  on: jest.fn(),
  update: jest.fn(),
});

export const mockElements = () => {
  const elements = {};
  return {
    create: jest.fn((type) => {
      elements[type] = mockElement();
      return elements[type];
    }),
    getElement: jest.fn((type) => {
      return elements[type] || null;
    }),
    update: jest.fn(),
  };
};

export const mockStripe = () => ({
  elements: jest.fn(() => mockElements()),
  createToken: jest.fn(),
  createSource: jest.fn(),
  createPaymentMethod: jest.fn(),
  confirmCardPayment: jest.fn(),
  confirmCardSetup: jest.fn(),
  paymentRequest: jest.fn(),
  registerAppInfo: jest.fn(),
  _registerWrapper: jest.fn(),
});

export const mockCartElementContext = () => {
  const cartElementContext = {
    cart: null,
    cartState: null,
  };
  cartElementContext.setCart = (val) => {
    cartElementContext.cart = val;
  };
  cartElementContext.setCartState = (val) => {
    cartElementContext.cartState = val;
  };
  return cartElementContext;
};
