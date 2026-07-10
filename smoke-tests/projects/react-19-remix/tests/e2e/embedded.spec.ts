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

test.describe('React 19 React Router v7 — EmbeddedCheckout route', () => {
  test.beforeEach(async ({page}) => {
    await page.addInitScript(`window.__SMOKE_MOCK_STRIPE__ = (${mockStripe.toString()})();`);
  });

  test('renders without errors', async ({page}) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/embedded-checkout');
    await page.waitForLoadState('networkidle');
    const criticalErrors = errors.filter(
      (e) =>
        e.toLowerCase().includes('hydration') ||
        e.toLowerCase().includes('minified react error')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('embedded checkout container is present', async ({page}) => {
    await page.goto('/embedded-checkout');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="embedded-checkout-page"]')).toBeAttached();
  });
});
