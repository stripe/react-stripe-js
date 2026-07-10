export const createMockElement = () => ({
  mount: jest.fn(),
  destroy: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  update: jest.fn(),
  unmount: jest.fn(),
  blur: jest.fn(),
  clear: jest.fn(),
  collapse: jest.fn(),
  focus: jest.fn(),
});

export const createMockElements = () => ({
  create: jest.fn(),
  getElement: jest.fn().mockReturnValue(null),
  update: jest.fn(),
  fetchUpdates: jest.fn().mockResolvedValue({}),
  submit: jest.fn().mockResolvedValue({}),
});

export const createMockStripe = () => ({
  elements: jest.fn(),
  createToken: jest.fn(),
  createSource: jest.fn(),
  createPaymentMethod: jest.fn().mockResolvedValue({}),
  confirmCardPayment: jest.fn().mockResolvedValue({}),
  confirmPayment: jest.fn().mockResolvedValue({}),
  retrievePaymentIntent: jest.fn().mockResolvedValue({}),
  confirmSetup: jest.fn().mockResolvedValue({}),
  retrieveSetupIntent: jest.fn().mockResolvedValue({}),
  initEmbeddedCheckout: jest.fn().mockResolvedValue({
    mount: jest.fn(),
    unmount: jest.fn(),
    destroy: jest.fn(),
  }),
});
