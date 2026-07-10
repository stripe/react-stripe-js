import {test, expect} from '@playwright/test';

const mockStripe = () => ({
  elements: () => ({
    create: (type: string) => ({
      mount: (el: HTMLElement) => {
        const div = document.createElement('div');
        div.setAttribute('data-element', type);
        el.appendChild(div);
      },
      destroy: () => {},
      on: () => {},
      off: () => {},
      update: () => {},
    }),
    getElement: () => null,
    update: () => {},
    fetchUpdates: async () => ({}),
    submit: async () => ({}),
  }),
  createToken: async () => ({}),
  createPaymentMethod: async () => ({}),
  confirmCardPayment: async () => ({}),
  confirmPayment: async () => ({}),
  initEmbeddedCheckout: async () => ({
    mount: () => {},
    unmount: () => {},
    destroy: () => {},
  }),
  _registerWrapper: () => {},
  registerAppInfo: () => {},
});

test.describe('React 19 React Router v7 — SSR', () => {
  test('checkout page HTML is served before JS loads', async ({browser}) => {
    // Create a new context with JS disabled to test server-rendered HTML only
    const context = await browser.newContext({javaScriptEnabled: false});
    const page = await context.newPage();
    await page.goto('http://localhost:3005/checkout');
    await expect(page.locator('[data-testid="checkout-page"]')).toBeVisible();
    await context.close();
  });

  test('multi-route navigation without errors', async ({page}) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.addInitScript(`window.__SMOKE_MOCK_STRIPE__ = (${mockStripe.toString()})();`);
    await page.goto('/');
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    await page.goto('/embedded-checkout');
    await page.waitForLoadState('networkidle');
    const criticalErrors = errors.filter((e) => e.toLowerCase().includes('hydration'));
    expect(criticalErrors).toHaveLength(0);
  });
});
