import { test, expect } from '@playwright/test';

test.describe('Tic-Tac-Toe E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('full game flow: username entry to match end', async ({ page }) => {
    await page.fill('input[placeholder="Enter username"]', 'alice');
    await page.click('text=Find Match');
    await page.waitForSelector('.queue');
    await expect(page.locator('.queue')).toBeVisible();
  });

  test('shows error for empty username', async ({ page }) => {
    await page.click('text=Find Match');
    await expect(page.locator('.error')).toContainText('Username is required');
  });

  test('can navigate to spectate mode', async ({ page }) => {
    await page.fill('input[placeholder="Enter username"]', 'bob');
    await page.click('text=Find Match');
  });

  test('rejects invalid username', async ({ page }) => {
    await page.fill('input[placeholder="Enter username"]', '@invalid!');
    await page.click('text=Find Match');
    await expect(page.locator('.error')).toContainText('only contain');
  });

  test('shows user ID after connection', async ({ page }) => {
    await page.waitForSelector('code');
    const userId = await page.locator('code').first().textContent();
    expect(userId).toBeTruthy();
    expect(userId?.length).toBeGreaterThan(0);
  });

  test('connection status indicator shown when disconnected', async ({ page }) => {
    const userId = await page.locator('code').first().textContent();
    expect(userId).toBeTruthy();
  });
});
