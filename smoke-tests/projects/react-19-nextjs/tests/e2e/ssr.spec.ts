import {test, expect} from '@playwright/test';

test.describe('SSR + Hydration (React 19 + Next.js 15)', () => {
  test.beforeEach(async ({page}) => {
    // Inject mock flag BEFORE page navigates — runs in every page context
    await page.addInitScript(() => {
      (window as any).__SMOKE_MOCK_STRIPE__ = true;
    });
  });

  test('home page renders without React errors', async ({page}) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const hydrationErrors = errors.filter(
      e =>
        e.toLowerCase().includes('hydration') ||
        e.toLowerCase().includes('did not match') ||
        e.toLowerCase().includes('minified react error')
    );
    expect(hydrationErrors).toHaveLength(0);
  });

  test('checkout page: initial SSR renders with null stripe, then hydrates', async ({page}) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');

    // Page should render
    await expect(page.locator('[data-testid="checkout-page"]')).toBeVisible();

    // No React hydration mismatches
    const hydrationErrors = consoleErrors.filter(
      e =>
        e.toLowerCase().includes('hydration') || e.toLowerCase().includes('did not match')
    );
    expect(hydrationErrors).toHaveLength(0);
  });

  test('checkout page: payment element container is in the DOM after hydration', async ({page}) => {
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    // The PaymentElement renders a div with id="payment-element"
    await expect(page.locator('#payment-element')).toBeAttached();
  });

  test('checkout page: submit button becomes enabled when stripe is ready', async ({page}) => {
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    // After mock stripe is set, the button label changes from 'Loading…' to 'Pay now'
    await expect(page.locator('[data-testid="submit-btn"]')).toHaveText('Pay now', {
      timeout: 5000,
    });
  });

  test('checkout page: no console errors during full page lifecycle', async ({page}) => {
    const allErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') allErrors.push(msg.text());
    });
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // let any async effects settle
    const nonStripeErrors = allErrors.filter(
      e => !e.includes('stripe') && !e.includes('Stripe') // ignore CDN load failures in test
    );
    expect(nonStripeErrors).toHaveLength(0);
  });
});
