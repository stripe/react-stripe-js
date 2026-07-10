export const createRuntimeStripeMock = () => ({
  elements: () => ({
    create: () => ({
      mount: () => {},
      destroy: () => {},
      on: () => {},
      update: () => {},
    }),
    getElement: () => null,
    update: () => {},
    fetchUpdates: async () => ({}),
    submit: async () => ({}),
  }),
  createToken: async () => ({}),
  createPaymentMethod: async () => ({}),
  confirmPayment: async () => ({}),
  confirmCardPayment: async () => ({}),
  retrievePaymentIntent: async () => ({}),
  initEmbeddedCheckout: async () => ({
    mount: () => {},
    unmount: () => {},
    destroy: () => {},
  }),
});
