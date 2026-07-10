import {test, expect} from '@playwright/test';

test.describe('React 17 Remix v1.x — SSR', () => {
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

  test('index page renders with SSR content', async ({page}) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText('Stripe Smoke Test');
  });

  test('page has links to checkout and embedded-checkout', async ({page}) => {
    await page.goto('/');
    await expect(page.locator('a[href="/checkout"]')).toBeVisible();
    await expect(page.locator('a[href="/embedded-checkout"]')).toBeVisible();
  });

  test('HTML is server-rendered (contains content before hydration)', async ({
    page,
  }) => {
    const response = await page.goto('/');
    const html = await response?.text();
    expect(html).toContain('Stripe Smoke Test');
  });
});
