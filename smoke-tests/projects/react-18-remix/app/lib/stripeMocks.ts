// Used by Playwright e2e tests — injected via window.__SMOKE_MOCK_STRIPE__
export const createMockStripe = () => ({
  elements: () => ({
    create: (type: string, opts: any) => ({
      mount: () => {},
      destroy: () => {},
      on: (ev: string, fn: any) => {
        if (ev === 'ready') fn({});
      },
      off: () => {},
      update: () => {},
    }),
    getElement: () => null,
    update: () => {},
    fetchUpdates: async () => ({}),
    submit: async () => ({}),
  }),
  createToken: async () => ({token: {id: 'tok_test'}}),
  confirmPayment: async () => ({paymentIntent: {status: 'succeeded'}}),
  confirmCardPayment: async () => ({paymentIntent: {status: 'succeeded'}}),
  createPaymentMethod: async () => ({paymentMethod: {id: 'pm_test'}}),
  paymentRequest: () => ({canMakePayment: async () => null, on: () => {}}),
  registerAppInfo: () => {},
  _registerWrapper: () => {},
  initEmbeddedCheckout: async () => ({
    mount: () => {},
    unmount: () => {},
    destroy: () => {},
  }),
  initCheckout: () => null,
});
