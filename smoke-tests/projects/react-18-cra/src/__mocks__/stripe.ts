export const createMockElement = () => ({
  mount: jest.fn(),
  destroy: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  update: jest.fn(),
  focus: jest.fn(),
  blur: jest.fn(),
  clear: jest.fn(),
  collapse: jest.fn(),
  unmount: jest.fn(),
});

export const createMockElements = () => {
  const registry: Record<string, ReturnType<typeof createMockElement>> = {};
  return {
    create: jest.fn((type: string) => {
      registry[type] = createMockElement();
      return registry[type];
    }),
    getElement: jest.fn((type: string) => registry[type] ?? null),
    update: jest.fn(),
    fetchUpdates: jest.fn().mockResolvedValue({}),
    submit: jest.fn().mockResolvedValue({}),
  };
};

export const createMockStripe = () => {
  const elements = createMockElements();
  return {
    elements: jest.fn(() => elements),
    createToken: jest.fn().mockResolvedValue({}),
    createPaymentMethod: jest.fn().mockResolvedValue({}),
    confirmPayment: jest.fn().mockResolvedValue({paymentIntent: {status: 'succeeded'}}),
    confirmCardPayment: jest.fn().mockResolvedValue({}),
    paymentRequest: jest.fn(() => ({canMakePayment: jest.fn().mockResolvedValue(null), on: jest.fn()})),
    registerAppInfo: jest.fn(),
    _registerWrapper: jest.fn(),
    initEmbeddedCheckout: jest.fn().mockResolvedValue({mount: jest.fn(), unmount: jest.fn(), destroy: jest.fn()}),
    initCheckout: jest.fn(),
  };
};
