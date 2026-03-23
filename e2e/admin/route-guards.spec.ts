import { test, expect } from '@playwright/test';

test('admin can access admin route', async ({ page }) => {
  await page.goto('/infrastructure');
  await expect(page).not.toHaveURL(/\/login$/);
  await expect(page).not.toHaveURL(/\/$/);
});
