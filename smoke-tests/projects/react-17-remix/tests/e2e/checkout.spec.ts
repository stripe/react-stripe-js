import {test, expect} from '@playwright/test';

test.describe('React 17 Remix v1.x — Checkout', () => {
  test.beforeEach(async ({page}) => {
    await page.addInitScript(() => {
      (window as any).__SMOKE_MOCK_STRIPE__ = {
        elements: () => ({
          create: (type: string) => ({
            mount: (el: HTMLElement) => {
              const div = document.createElement('div');
              div.setAttribute('data-element', type);
              el.appendChild(div);
            },
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
        confirmCardPayment: async () => ({}),
        confirmPayment: async () => ({}),
      };
    });
  });

  test('checkout page renders', async ({page}) => {
    await page.goto('/checkout');
    await expect(
      page.locator('[data-testid="checkout-form"]')
    ).toBeVisible({timeout: 15000});
  });

  test('submit button is present', async ({page}) => {
    await page.goto('/checkout');
    await expect(
      page.locator('[data-testid="submit-button"]')
    ).toBeVisible({timeout: 15000});
  });

  test('payment status shows idle initially', async ({page}) => {
    await page.goto('/checkout');
    await expect(page.locator('[data-testid="payment-status"]')).toContainText(
      'idle',
      {timeout: 15000}
    );
  });
});
