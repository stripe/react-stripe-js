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
  _registerWrapper: () => {},
  registerAppInfo: () => {},
});

test.describe('React 19 React Router v7 — Checkout route', () => {
  test.beforeEach(async ({page}) => {
    await page.addInitScript(`window.__SMOKE_MOCK_STRIPE__ = (${mockStripe.toString()})();`);
  });

  test('renders without hydration errors', async ({page}) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    const hydrationErrors = errors.filter(
      (e) =>
        e.toLowerCase().includes('hydration') ||
        e.toLowerCase().includes('did not match') ||
        e.toLowerCase().includes('minified react error')
    );
    expect(hydrationErrors).toHaveLength(0);
  });

  test('checkout page is visible', async ({page}) => {
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="checkout-page"]')).toBeVisible();
  });

  test('payment element container is in the DOM', async ({page}) => {
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#payment-element')).toBeAttached();
  });

  test('submit button becomes enabled after hydration', async ({page}) => {
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="submit-btn"]')).toHaveText('Pay now', {
      timeout: 5000,
    });
  });
});
