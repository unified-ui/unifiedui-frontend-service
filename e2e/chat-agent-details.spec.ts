import { test, expect } from '@playwright/test';

test.describe('Chat Agent Details', () => {
  test('protected route redirects when unauthenticated', async ({ page }) => {
    await page.goto('/chat-agents/some-id/embed-chat');
    await page.waitForURL(/\/login|\/unauthorized/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/login|\/unauthorized/);
  });

  test('embed chat public route loads', async ({ page }) => {
    const response = await page.goto('/embed/chat/test-agent-id');
    expect(response?.status() ?? 0).toBeLessThan(500);
  });
});
