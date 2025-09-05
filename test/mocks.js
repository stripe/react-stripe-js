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

export const mockCheckoutSession = () => {
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

export const mockCheckoutActions = () => {
  return {
    getSession: jest.fn(() => mockCheckoutSession()),
    applyPromotionCode: jest.fn(),
    removePromotionCode: jest.fn(),
    updateShippingAddress: jest.fn(),
    updateBillingAddress: jest.fn(),
    updatePhoneNumber: jest.fn(),
    updateEmail: jest.fn(),
    updateLineItemQuantity: jest.fn(),
    updateShippingOption: jest.fn(),
    confirm: jest.fn(),
  };
};

export const mockCheckoutSdk = () => {
  const elements = {};

  return {
    changeAppearance: jest.fn(),
    loadFonts: jest.fn(),
    createPaymentElement: jest.fn(() => {
      elements.payment = mockElement();
      return elements.payment;
    }),
    createBillingAddressElement: jest.fn(() => {
      elements.billingAddress = mockElement();
      return elements.billingAddress;
    }),
    createShippingAddressElement: jest.fn(() => {
      elements.shippingAddress = mockElement();
      return elements.shippingAddress;
    }),
    createExpressCheckoutElement: jest.fn(() => {
      elements.expressCheckout = mockElement();
      return elements.expressCheckout;
    }),
    getPaymentElement: jest.fn(() => {
      return elements.payment || null;
    }),
    getBillingAddressElement: jest.fn(() => {
      return elements.billingAddress || null;
    }),
    getShippingAddressElement: jest.fn(() => {
      return elements.shippingAddress || null;
    }),
    getExpressCheckoutElement: jest.fn(() => {
      return elements.expressCheckout || null;
    }),

    on: jest.fn((event, callback) => {
      if (event === 'change') {
        // Simulate initial session call
        setTimeout(() => callback(mockCheckoutSession()), 0);
      }
    }),
    loadActions: jest.fn().mockResolvedValue({
      type: 'success',
      actions: mockCheckoutActions(),
    }),
  };
};

export const mockEmbeddedCheckout = () => ({
  mount: jest.fn(),
  unmount: jest.fn(),
  destroy: jest.fn(),
});

export const mockStripe = () => {
  const checkoutSdk = mockCheckoutSdk();

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
    initCheckout: jest.fn(() => checkoutSdk),
    initEmbeddedCheckout: jest.fn(() =>
      Promise.resolve(mockEmbeddedCheckout())
    ),
  };
};
