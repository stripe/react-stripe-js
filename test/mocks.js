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

export const mockCustomCheckoutSession = () => {
  return {
    lineItems: [],
    currency: 'usd',
    shippingOptions: [],
    total: {
      subtotal: 1099,
      taxExclusive: 0,
      taxInclusive: 0,
      shippingRate: 0,
      discount: 0,
      total: 1099,
    },
    confirmationRequirements: [],
    canConfirm: true,
  };
};

export const mockCustomCheckoutSdk = () => {
  const elements = {};

  return {
    changeAppearance: jest.fn(),
    createElement: jest.fn((type) => {
      elements[type] = mockElement();
      return elements[type];
    }),
    getElement: jest.fn((type) => {
      return elements[type] || null;
    }),
    session: jest.fn(() => mockCustomCheckoutSession()),
    applyPromotionCode: jest.fn(),
    removePromotionCode: jest.fn(),
    updateShippingAddress: jest.fn(),
    updateBillingAddress: jest.fn(),
    updatePhoneNumber: jest.fn(),
    updateEmail: jest.fn(),
    updateLineItemQuantity: jest.fn(),
    updateShippingOption: jest.fn(),
    confirm: jest.fn(),
    on: jest.fn(),
  };
};

export const mockEmbeddedCheckout = () => ({
  mount: jest.fn(),
  unmount: jest.fn(),
  destroy: jest.fn(),
});

export const mockStripe = () => {
  const customCheckoutSdk = mockCustomCheckoutSdk();
  return {
    elements: jest.fn(() => mockElements()),
    createToken: jest.fn(),
    createSource: jest.fn(),
    createPaymentMethod: jest.fn(),
    confirmCardPayment: jest.fn(),
    confirmCardSetup: jest.fn(),
    paymentRequest: jest.fn(),
    registerAppInfo: jest.fn(),
    _registerWrapper: jest.fn(),
    initCustomCheckout: jest.fn().mockResolvedValue(customCheckoutSdk),
    initEmbeddedCheckout: jest.fn(() =>
      Promise.resolve(mockEmbeddedCheckout())
    ),
  };
};

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
