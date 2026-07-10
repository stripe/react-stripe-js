type MockElement = {
  mount: (el: HTMLElement | string) => void;
  destroy: () => void;
  on: (event: string, handler: (...args: any[]) => void) => void;
  update: (options: any) => void;
};

type MockElements = {
  create: (type: string, options?: any) => MockElement;
  getElement: (type: string) => MockElement | null;
  update: (options: any) => void;
  fetchUpdates: () => Promise<any>;
  submit: () => Promise<any>;
};

type MockStripe = {
  elements: (options?: any) => MockElements;
  confirmPayment: (options: any) => Promise<any>;
  confirmSetup: (options: any) => Promise<any>;
  retrievePaymentIntent: (clientSecret: string) => Promise<any>;
};

function createMockElement(): MockElement {
  return {
    mount: (_el: HTMLElement | string) => {},
    destroy: () => {},
    on: (_event: string, _handler: (...args: any[]) => void) => {},
    update: (_options: any) => {},
  };
}

function createMockElements(): MockElements {
  return {
    create: (_type: string, _options?: any) => createMockElement(),
    getElement: (_type: string) => null,
    update: (_options: any) => {},
    fetchUpdates: async () => ({}),
    submit: async () => ({}),
  };
}

export function createMockStripe(): MockStripe {
  return {
    elements: (_options?: any) => createMockElements(),
    confirmPayment: async (_options: any) => ({}),
    confirmSetup: async (_options: any) => ({}),
    retrievePaymentIntent: async (_clientSecret: string) => ({paymentIntent: null}),
  };
}
