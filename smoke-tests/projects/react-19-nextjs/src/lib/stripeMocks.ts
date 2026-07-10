// src/lib/stripeMocks.ts
// Plain runtime mock — no jest.fn(). Used in browser via window.__SMOKE_MOCK_STRIPE__ injection.
export const createMockStripe = () => ({
  elements: (options?: Record<string, unknown>) => ({
    create: (type: string, elementOptions?: Record<string, unknown>) => ({
      mount: (container: HTMLElement | string) => {
        const el =
          typeof container === 'string'
            ? document.querySelector(container)
            : container;
        if (el) {
          const div = document.createElement('div');
          div.setAttribute('data-stripe-element', type);
          (el as HTMLElement).appendChild(div);
        }
      },
      destroy: () => {},
      on: () => {},
      off: () => {},
      update: () => {},
      unmount: () => {},
    }),
    getElement: () => null,
    update: () => {},
    fetchUpdates: async () => ({}),
    submit: async () => ({}),
  }),
  createToken: () => Promise.resolve({token: null, error: undefined}),
  createSource: () => Promise.resolve({source: null, error: undefined}),
  createPaymentMethod: () => Promise.resolve({paymentMethod: null, error: undefined}),
  confirmCardPayment: () => Promise.resolve({paymentIntent: null, error: undefined}),
  confirmPayment: () => Promise.resolve({paymentIntent: null, error: undefined}),
  retrievePaymentIntent: () => Promise.resolve({paymentIntent: null, error: undefined}),
  confirmSetup: () => Promise.resolve({setupIntent: null, error: undefined}),
  retrieveSetupIntent: () => Promise.resolve({setupIntent: null, error: undefined}),
  initEmbeddedCheckout: async () => ({
    mount: (selector: string) => {
      const el = document.querySelector(selector);
      if (el) {
        const div = document.createElement('div');
        div.textContent = 'Embedded Checkout (mock)';
        el.appendChild(div);
      }
    },
    unmount: () => {},
    destroy: () => {},
  }),
});
