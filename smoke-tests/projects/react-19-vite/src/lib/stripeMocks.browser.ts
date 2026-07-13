
const makeEl = () => ({
  mount: (_node: HTMLElement) => {},
  destroy: () => {},
  on: (_event: string, _cb: (...args: any[]) => void) => {},
  off: (_event: string, _cb: (...args: any[]) => void) => {},
  update: (_opts: object) => {},
  focus: () => {},
  blur: () => {},
  clear: () => {},
  collapse: () => {},
  unmount: () => {},
});

const makeElements = () => ({
  create: (_type: string, _opts?: object) => makeEl(),
  getElement: (_type: string) => null as any,
  update: (_opts: object) => {},
  fetchUpdates: () => Promise.resolve({}),
  submit: () => Promise.resolve({}),
});

const makeCheckoutSdk = () => ({
  loadActions: () =>
    Promise.resolve({
      type: 'success' as const,
      actions: {
        getSession: () => ({
          id: 'cs_test_smoke',
          status: 'open' as const,
          currency: 'usd',
          lineItems: {data: []},
          total: {subtotal: 1099, total: 1099, taxInclusive: 0, taxExclusive: 0, shipping: 0, discount: 0},
          billingAddress: null,
          shippingAddress: null,
          shippingOptions: [],
          selectedShippingOption: null,
          phoneNumberCollection: {enabled: false},
          taxIdCollection: {enabled: false},
          savedPaymentMethods: null,
          discountAmounts: [],
          appliedTaxes: [],
          canConfirm: false,
          paymentMethods: [],
          selectedPaymentMethod: null,
          merchant: {name: 'Smoke Test Merchant'},
        }),
        updateEmail: () => Promise.resolve({type: 'success' as const}),
        updatePhoneNumber: () => Promise.resolve({type: 'success' as const}),
        updateShippingAddress: () => Promise.resolve({type: 'success' as const}),
        updateBillingAddress: () => Promise.resolve({type: 'success' as const}),
        updateSelectedShippingOption: () => Promise.resolve({type: 'success' as const}),
        applyPromotionCode: () => Promise.resolve({type: 'success' as const}),
        removePromotionCode: () => Promise.resolve({type: 'success' as const}),
        confirm: () => Promise.resolve({type: 'success' as const}),
      },
    }),
  on: (_event: string, _cb: (...args: any[]) => void) => {},
  changeAppearance: (_appearance: object) => {},
  loadFonts: (_fonts: object[]) => Promise.resolve(),
  createPaymentFormElement: (_opts?: object) => makeEl(),
  createPaymentElement: (_opts?: object) => makeEl(),
  createShippingAddressElement: (_opts?: object) => makeEl(),
  createBillingAddressElement: (_opts?: object) => makeEl(),
  createExpressCheckoutElement: (_opts?: object) => makeEl(),
  createCurrencySelectorElement: () => makeEl(),
  createTaxIdElement: (_opts?: object) => makeEl(),
});

export const createBrowserMockStripe = (): any => ({
  elements: (_opts?: object) => makeElements(),
  createToken: () => Promise.resolve({token: {id: 'tok_smoke'}}),
  createSource: () => Promise.resolve({source: {id: 'src_smoke'}}),
  createPaymentMethod: () => Promise.resolve({paymentMethod: {id: 'pm_smoke', type: 'card'}}),
  confirmCardPayment: () => Promise.resolve({paymentIntent: {id: 'pi_smoke', status: 'succeeded'}}),
  confirmPayment: () => Promise.resolve({paymentIntent: {id: 'pi_smoke', status: 'succeeded'}}),
  confirmCardSetup: () => Promise.resolve({setupIntent: {id: 'seti_smoke', status: 'succeeded'}}),
  paymentRequest: () => ({canMakePayment: () => Promise.resolve(null), on: () => {}}),
  registerAppInfo: () => {},
  _registerWrapper: () => {},
  initCheckout: (_opts: object) => makeCheckoutSdk(),
  initEmbeddedCheckout: (_opts: object) =>
    Promise.resolve({mount: (_node: HTMLElement) => {}, unmount: () => {}, destroy: () => {}}),
});
