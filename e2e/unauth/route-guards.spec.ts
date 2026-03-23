import { test, expect } from '@playwright/test';

for (const path of ['/overview', '/reviews', '/infrastructure', '/form-builder']) {
  test(`redirects unauthenticated users from ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
  });
}
