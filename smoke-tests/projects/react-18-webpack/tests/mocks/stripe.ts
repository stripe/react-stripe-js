import type {Stripe, StripeElements} from '@stripe/stripe-js';

export const createMockElement = () => ({
  mount: jest.fn(),
  destroy: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  update: jest.fn(),
  unmount: jest.fn(),
  blur: jest.fn(),
  clear: jest.fn(),
  focus: jest.fn(),
  collapse: jest.fn(),
});

export const createMockElements = () =>
  ({
    create: jest.fn().mockReturnValue(createMockElement()),
    getElement: jest.fn().mockReturnValue(null),
    update: jest.fn(),
    fetchUpdates: jest.fn(),
    submit: jest.fn(),
  } as unknown as StripeElements & {
    create: jest.Mock;
    getElement: jest.Mock;
    update: jest.Mock;
    fetchUpdates: jest.Mock;
    submit: jest.Mock;
  });

export const createMockStripe = () =>
  ({
    elements: jest.fn(),
    confirmPayment: jest.fn(),
    confirmCardPayment: jest.fn(),
    createPaymentMethod: jest.fn(),
    retrievePaymentIntent: jest.fn(),
    confirmSetup: jest.fn(),
    createToken: jest.fn(),
    redirectToCheckout: jest.fn(),
  } as unknown as Stripe & {
    elements: jest.Mock;
    confirmPayment: jest.Mock;
    confirmCardPayment: jest.Mock;
    createPaymentMethod: jest.Mock;
    retrievePaymentIntent: jest.Mock;
    confirmSetup: jest.Mock;
    createToken: jest.Mock;
    redirectToCheckout: jest.Mock;
  });
