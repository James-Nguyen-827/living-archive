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

  await page.locator('.world-zone-labels').getByRole('link', { name: /Employment/ }).click();
  await expect(page.locator('.archive-window')).toBeVisible();
  await expect(page.locator('.world-explorer')).toHaveAttribute('data-phase', 'zone-open');
  await page.waitForTimeout(200);
  await expect(page).toHaveScreenshot(`home-window-${testInfo.project.name}.png`, {
    animations: 'allow',
    fullPage: true,
    maxDiffPixelRatio: 0.015,
  });
  await page.getByRole('button', { name: /Bioengineering Lab Researcher/ }).click();
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

test('read-mode and flagship visual states', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'tablet-768', 'The bounded review covers desktop and mobile endpoints.');
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });

  const states = [
    { route: '/projects/living-archive', name: 'project-living-archive' },
    { route: '/projects/colorcam', name: 'project-colorcam' },
    { route: '/projects/nixos-homelab', name: 'project-nixos-homelab' },
    { route: '/interests', name: 'interests-holding' },
    { route: '/404', name: 'route-not-found' },
  ];

  for (const state of states) {
    await page.goto(state.route);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`${state.name}-${testInfo.project.name}.png`, {
      animations: 'disabled',
      fullPage: true,
      maxDiffPixelRatio: 0.015,
    });
  }

  await page.goto('/projects/living-archive');
  await page.evaluate(() => { document.documentElement.dataset.theme = 'night'; });
  await expect(page).toHaveScreenshot(`project-living-archive-night-${testInfo.project.name}.png`, {
    animations: 'disabled',
    fullPage: true,
    maxDiffPixelRatio: 0.015,
  });
});
