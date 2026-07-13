// smoke-tests/projects/react-19-vite/tests/e2e/smoke.spec.ts
import {test, expect} from '@playwright/test';

const setup = async (page: any) => {
  await page.addInitScript(() => {
    (window as any).__SMOKE_MOCK_STRIPE__ = true;
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
};

test.describe('react-19-vite smoke tests', () => {
  test('page loads without JavaScript errors', async ({page}) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await setup(page);
    const relevant = errors.filter(
      (e) =>
        !e.includes('stripe.js') &&
        !e.includes('js.stripe.com') &&
        !e.includes('Failed to load resource'),
    );
    expect(relevant).toHaveLength(0);
  });

  test('standard Elements section: all element containers present', async ({page}) => {
    await setup(page);
    for (const id of [
      'payment-element',
      'card-element',
      'split-card-number',
      'split-card-expiry',
      'split-card-cvc',
      'address-billing',
      'express-checkout',
      'link-auth',
      'pmme',
      'iban',
    ]) {
      await expect(page.locator(`[data-testid="${id}"]`)).toBeAttached();
    }
  });

  test('EmbeddedCheckout: section is present', async ({page}) => {
    await setup(page);
    await expect(page.locator('[data-testid="embedded-section"]')).toBeAttached();
  });

  test('CheckoutProvider: checkout elements appear after SDK initialises', async ({page}) => {
    await setup(page);
    for (const id of [
      'checkout-payment-form',
      'checkout-payment',
      'checkout-currency',
      'checkout-billing',
      'checkout-shipping',
    ]) {
      await page.locator(`[data-testid="${id}"]`).waitFor({state: 'attached', timeout: 5_000});
    }
  });
});
