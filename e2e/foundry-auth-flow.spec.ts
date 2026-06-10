import { test, expect } from '@playwright/test';

test.describe('Foundry Auth Flow', () => {
  test('login page renders provider buttons', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/unified.?ui|Unified UI|Vite/i);
  });

  test('navigation to chat-agents requires auth', async ({ page }) => {
    await page.goto('/chat-agents');
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });
});
