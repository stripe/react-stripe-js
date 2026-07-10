import {test, expect} from '@playwright/test';

test.describe('EmbeddedCheckout page (React 19 + Next.js 15)', () => {
  test.beforeEach(async ({page}) => {
    await page.addInitScript(() => {
      (window as any).__SMOKE_MOCK_STRIPE__ = true;
    });
  });

  test('renders EmbeddedCheckout page without errors', async ({page}) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/embedded-checkout');
    await page.waitForLoadState('networkidle');
    const criticalErrors = errors.filter(
      e =>
        e.toLowerCase().includes('hydration') ||
        e.toLowerCase().includes('minified react error')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('EmbeddedCheckout container is present', async ({page}) => {
    await page.goto('/embedded-checkout');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="embedded-checkout-page"]')).toBeVisible();
  });
});
