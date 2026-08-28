import { expect, test } from '@playwright/test';

test('homepage visual states', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.world-explorer')).toBeVisible();
  await page.waitForTimeout(500);
  await expect(page).toHaveScreenshot(`home-day-${testInfo.project.name}.png`, {
    animations: 'allow',
    fullPage: true,
    maxDiffPixelRatio: 0.015,
  });

  await page.getByRole('button', { name: 'Switch to night theme' }).click();
  await expect(page.locator('.world-explorer')).toHaveAttribute('data-theme', 'night');
  await page.waitForTimeout(1_200);
  await expect(page).toHaveScreenshot(`home-night-${testInfo.project.name}.png`, {
    animations: 'disabled',
    fullPage: true,
    maxDiffPixelRatio: 0.015,
    timeout: 15_000,
  });

  await page.locator('.world-zone-labels').getByRole('link', { name: /Work/ }).click();
  await expect(page.locator('.archive-window')).toBeVisible();
  await expect(page.locator('.world-explorer')).toHaveAttribute('data-phase', 'zone-open');
  await page.waitForTimeout(200);
  await expect(page).toHaveScreenshot(`home-window-${testInfo.project.name}.png`, {
    animations: 'allow',
    fullPage: true,
    maxDiffPixelRatio: 0.015,
  });
  await page.getByRole('button', { name: /Civic Signal/ }).click();
  await expect(page).toHaveScreenshot(`home-preview-${testInfo.project.name}.png`, {
    animations: 'allow',
    fullPage: true,
    maxDiffPixelRatio: 0.015,
  });
});

test('fallback visual state', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true } });
  });
  await page.goto('/');
  await expect(page.getByTestId('world-fallback')).toBeVisible();
  await expect(page).toHaveScreenshot(`home-fallback-${testInfo.project.name}.png`, { animations: 'allow', fullPage: true });
});
