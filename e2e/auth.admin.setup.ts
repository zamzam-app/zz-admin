import { mkdirSync } from 'node:fs';
import { expect, test as setup } from '@playwright/test';

const authFile = 'playwright/.auth/admin.json';

setup('authenticate admin', async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD must be set before running admin auth setup',
    );
  }

  mkdirSync('playwright/.auth', { recursive: true });

  await page.goto('/login');
  await page.getByPlaceholder('Email address').fill(email);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page).toHaveURL(/\/overview$/);
  await page.context().storageState({ path: authFile });
});
