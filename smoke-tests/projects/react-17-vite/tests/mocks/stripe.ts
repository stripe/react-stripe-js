import {vi} from 'vitest';

export const createMockElement = () => ({
  mount: vi.fn(),
  destroy: vi.fn(),
  on: vi.fn(),
  update: vi.fn(),
});

export const createMockElements = () => {
  const elements: Record<string, ReturnType<typeof createMockElement>> = {};
  return {
    create: vi.fn((type: string) => {
      elements[type] = createMockElement();
      return elements[type];
    }),
    getElement: vi.fn((type: string) => {
      return elements[type] || null;
    }),
    update: vi.fn(),
  };
};

export const createMockCheckoutSession = () => ({
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
});

export const createMockCheckoutActions = () => ({
  getSession: vi.fn(() => createMockCheckoutSession()),
  applyPromotionCode: vi.fn(),
  removePromotionCode: vi.fn(),
  updateShippingAddress: vi.fn(),
  updateBillingAddress: vi.fn(),
  updatePhoneNumber: vi.fn(),
  updateEmail: vi.fn(),
  updateLineItemQuantity: vi.fn(),
  updateShippingOption: vi.fn(),
  confirm: vi.fn(),
});

export const createMockCheckoutSdk = () => {
  const elements: Record<string, ReturnType<typeof createMockElement>> = {};

  return {
    changeAppearance: vi.fn(),
    loadFonts: vi.fn(),
    createPaymentElement: vi.fn(() => {
      elements.payment = createMockElement();
      return elements.payment;
    }),
    createPaymentFormElement: vi.fn(() => {
      elements.paymentForm = createMockElement();
      return elements.paymentForm;
    }),
    createBillingAddressElement: vi.fn(() => {
      elements.billingAddress = createMockElement();
      return elements.billingAddress;
    }),
    createShippingAddressElement: vi.fn(() => {
      elements.shippingAddress = createMockElement();
      return elements.shippingAddress;
    }),
    createExpressCheckoutElement: vi.fn(() => {
      elements.expressCheckout = createMockElement();
      return elements.expressCheckout;
    }),
    getPaymentElement: vi.fn(() => elements.payment || null),
    getPaymentFormElement: vi.fn(() => elements.paymentForm || null),
    getBillingAddressElement: vi.fn(() => elements.billingAddress || null),
    getShippingAddressElement: vi.fn(() => elements.shippingAddress || null),
    getExpressCheckoutElement: vi.fn(() => elements.expressCheckout || null),
    on: vi.fn((event: string, callback: (session: any) => void) => {
      if (event === 'change') {
        setTimeout(() => callback(createMockCheckoutSession()), 0);
      }
    }),
    loadActions: vi.fn().mockResolvedValue({
      type: 'success',
      actions: createMockCheckoutActions(),
    }),
  };
};

export const createMockEmbeddedCheckout = () => ({
  mount: vi.fn(),
  unmount: vi.fn(),
  destroy: vi.fn(),
});

export const createMockStripe = () => {
  const checkoutSdk = createMockCheckoutSdk();

  return {
    elements: vi.fn(() => createMockElements()),
    createToken: vi.fn(),
    createSource: vi.fn(),
    createPaymentMethod: vi.fn(),
    confirmCardPayment: vi.fn(),
    confirmCardSetup: vi.fn(),
    paymentRequest: vi.fn(),
    registerAppInfo: vi.fn(),
    _registerWrapper: vi.fn(),
    initCheckout: vi.fn(() => checkoutSdk),
    initEmbeddedCheckout: vi.fn(() =>
      Promise.resolve(createMockEmbeddedCheckout())
    ),
  };
};
