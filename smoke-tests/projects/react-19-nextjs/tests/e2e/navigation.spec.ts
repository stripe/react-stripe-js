import {test, expect} from '@playwright/test';

test.describe('Multi-page navigation smoke', () => {
  test.beforeEach(async ({page}) => {
    await page.addInitScript(() => {
      (window as any).__SMOKE_MOCK_STRIPE__ = true;
    });
  });

  test('can navigate between pages without errors', async ({page}) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    await page.goto('/embedded-checkout');
    await page.waitForLoadState('networkidle');

    const criticalErrors = errors.filter(
      e =>
        e.toLowerCase().includes('hydration') ||
        e.toLowerCase().includes('minified react error')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
