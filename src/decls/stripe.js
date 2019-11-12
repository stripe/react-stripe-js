// @flow

declare type ElementShape = {
  mount: Function,
  destroy: () => ElementShape,
  on: (event: string, handler: Function) => ElementShape,
  off: (event: string, handler: Function) => ElementShape,
  update: (options: MixedObject) => ElementShape,
};

declare type ElementsShape = {
  create: (type: string, options: MixedObject) => ElementShape,
  getElement: (type: string) => null | ElementShape,
};

declare type PaymentRequestShape = {
  on: (event: string, handler: Function) => PaymentRequestShape,
  canMakePayment: () => Promise<MixedObject | null>,
};

declare type StripeShape = {
  elements: (options: MixedObject) => ElementsShape,
  paymentRequest: (options: MixedObject) => PaymentRequestShape,
  createSource: (
    element: ElementShape | MixedObject,
    options: ?{}
  ) => Promise<{|source: MixedObject|} | {|error: Object|}>,
  createToken: (
    type: string | ElementShape,
    options: mixed
  ) => Promise<{|token: MixedObject|} | {|error: Object|}>,
  createPaymentMethod: (
    data: mixed
  ) => Promise<{|paymentMethod: MixedObject|} | {|error: Object|}>,
  confirmCardPayment: (
    clientSecret: string,
    options: mixed
  ) => Promise<{|paymentIntent: MixedObject|} | {|error: Object|}>,
  confirmCardSetup: (
    clientSecret: string,
    options: mixed
  ) => Promise<{|paymentIntent: MixedObject|} | {|error: Object|}>,
};
