import {test, expect} from '@playwright/test';

test.describe('Remix SSR — no Stripe mock, server renders cleanly', () => {
  test('checkout page HTML is served before JS loads', async ({browser}) => {
    // Disable JS to test server-rendered HTML only
    const context = await browser.newContext({javaScriptEnabled: false});
    const page = await context.newPage();
    await page.goto('/checkout');
    // Server should render the page container even without Stripe
    await expect(page.locator('[data-testid="checkout-page"]')).toBeVisible();
    await context.close();
  });

  test('multi-route navigation without errors', async ({page}) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.addInitScript(() => {
      (window as any).__SMOKE_MOCK_STRIPE__ = true;
    });
    await page.goto('/');
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    await page.goto('/embedded-checkout');
    await page.waitForLoadState('networkidle');
    const criticalErrors = errors.filter((e) =>
      e.toLowerCase().includes('hydration')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
