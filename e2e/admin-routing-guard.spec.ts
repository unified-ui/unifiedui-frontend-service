import { test, expect } from '@playwright/test';

test.describe('Admin Routing Guard', () => {
  const adminPaths = [
    '/admin',
    '/admin/analytics/chat-agents',
    '/admin/analytics/workflows',
  ];

  for (const path of adminPaths) {
    test(`${path} redirects unauthenticated`, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL(/\/login|\/unauthorized/, { timeout: 10000 });
      expect(page.url()).toMatch(/\/login|\/unauthorized/);
    });
  }
});
