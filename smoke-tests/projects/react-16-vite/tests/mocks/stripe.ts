import {vi} from 'vitest';

export const createMockElement = () => ({
  mount: vi.fn(),
  destroy: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  update: vi.fn(),
  focus: vi.fn(),
  blur: vi.fn(),
  clear: vi.fn(),
  collapse: vi.fn(),
  unmount: vi.fn(),
});

export const createMockElements = () => {
  const elementRegistry: Record<string, ReturnType<typeof createMockElement>> = {};
  return {
    create: vi.fn((type: string, _options?: object) => {
      const el = createMockElement();
      elementRegistry[type] = el;
      return el;
    }),
    getElement: vi.fn((type: string) => elementRegistry[type] ?? null),
    update: vi.fn(),
    fetchUpdates: vi.fn().mockResolvedValue({}),
    submit: vi.fn().mockResolvedValue({}),
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createMockStripe = (): any => {
  const elements = createMockElements();
  return {
    elements: vi.fn(() => elements),
    createToken: vi.fn().mockResolvedValue({}),
    createSource: vi.fn().mockResolvedValue({}),
    createPaymentMethod: vi.fn().mockResolvedValue({}),
    confirmCardPayment: vi.fn().mockResolvedValue({paymentIntent: {status: 'succeeded'}}),
    confirmPayment: vi.fn().mockResolvedValue({paymentIntent: {status: 'succeeded'}}),
    confirmCardSetup: vi.fn().mockResolvedValue({}),
    paymentRequest: vi.fn(() => ({canMakePayment: vi.fn().mockResolvedValue(null), on: vi.fn()})),
    registerAppInfo: vi.fn(),
    _registerWrapper: vi.fn(),
    initCheckout: vi.fn(),
    initEmbeddedCheckout: vi.fn().mockResolvedValue({
      mount: vi.fn(),
      unmount: vi.fn(),
      destroy: vi.fn(),
    }),
  };
};
