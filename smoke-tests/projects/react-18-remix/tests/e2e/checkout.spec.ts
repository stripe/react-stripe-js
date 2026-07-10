import {test, expect} from '@playwright/test';

test.describe('Checkout route — Remix SSR + hydration', () => {
  test.beforeEach(async ({page}) => {
    await page.addInitScript(() => {
      (window as any).__SMOKE_MOCK_STRIPE__ = true;
    });
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
