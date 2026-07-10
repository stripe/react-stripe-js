// Used by unit tests (jest.fn() equivalents) and injected by Playwright
export const createMockStripe = () => ({
  elements: () => ({
    create: (type: string, opts: any) => ({
      mount: () => {},
      destroy: () => {},
      on: (ev: string, fn: any) => { if (ev === 'ready') fn({}); },
      off: () => {},
      update: () => {},
    }),
    getElement: () => null,
    update: () => {},
    fetchUpdates: async () => ({}),
    submit: async () => ({}),
  }),
  createToken: async () => ({token: {id: 'tok_test'}}),
  createSource: async () => ({source: {id: 'src_test'}}),
  confirmPayment: async () => ({paymentIntent: {status: 'succeeded'}}),
  confirmCardPayment: async () => ({paymentIntent: {status: 'succeeded'}}),
  confirmCardSetup: async () => ({setupIntent: {status: 'succeeded'}}),
  createPaymentMethod: async () => ({paymentMethod: {id: 'pm_test'}}),
  paymentRequest: () => ({canMakePayment: async () => null, on: () => {}}),
  registerAppInfo: () => {},
  _registerWrapper: () => {},
  initEmbeddedCheckout: async () => ({mount: () => {}, unmount: () => {}, destroy: () => {}}),
  initCheckout: () => null,
});
