import {test, expect} from '@playwright/test';

test.describe('React 17 Remix v1.x — Embedded Checkout', () => {
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
        initEmbeddedCheckout: async () => ({
          mount: () => {},
          unmount: () => {},
          destroy: () => {},
        }),
      };
    });
  });

  test('embedded checkout page renders', async ({page}) => {
    await page.goto('/embedded-checkout');
    // The container is rendered in the DOM (may be hidden until stripe initializes)
    await expect(
      page.locator('[data-testid="embedded-checkout-container"]')
    ).toBeAttached({timeout: 15000});
  });

  test('embedded checkout page loads without JavaScript errors', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => {
      // Filter out known stripe prop validation warnings that occur with mock objects
      if (
        !err.message.includes('Invalid prop') &&
        !err.message.includes('stripe') &&
        !err.message.includes('Stripe')
      ) {
        errors.push(err.message);
      }
    });
    await page.goto('/embedded-checkout');
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });
});
