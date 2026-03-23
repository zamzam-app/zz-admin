import { test, expect } from '@playwright/test';

test('cafe user is blocked from admin route', async ({ page }) => {
  await page.goto('/infrastructure');
  await expect(page).toHaveURL(/\/$|\/overview$/);
});
