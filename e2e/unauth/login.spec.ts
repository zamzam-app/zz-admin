import { test, expect } from '@playwright/test';

test.describe('login page', () => {
  test('shows validation for empty fields', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('toggles password visibility', async ({ page }) => {
    await page.goto('/login');
    const passwordInput = page.getByPlaceholder('Password');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await page
      .locator('button[type="button"]')
      .filter({ has: page.locator('svg') })
      .first()
      .click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });
});
