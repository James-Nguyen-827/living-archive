import { expect, test } from '@playwright/test';

test.describe('route-wide theme synchronization', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Theme synchronization is viewport-independent.');
  });

  test('default, live, and stored theme surfaces stay synchronized', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'day');
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#ffffff');
    expect(await page.evaluate(() => localStorage.getItem('portfolio-theme'))).toBeNull();

    await page.getByRole('button', { name: 'Switch to night theme' }).click();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'night');
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#191919');
    expect(await page.evaluate(() => localStorage.getItem('portfolio-theme'))).toBe('night');

    await page.goto('/about', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'night');
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#191919');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'night');
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#191919');
  });
});
