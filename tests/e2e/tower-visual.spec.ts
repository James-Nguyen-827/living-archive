import { expect, test } from '@playwright/test';

const TOWERS = [
  { name: 'Employment', snapshot: 'project-court-active.png' },
  { name: 'Blogs', snapshot: 'index-engine-active.png' },
  { name: 'Projects', snapshot: 'paradox-gate-active.png' },
  { name: 'About', snapshot: 'orrery-beacon-active.png' },
] as const;

for (const tower of TOWERS) {
  test(`${tower.name} tower holds a distinct reduced-motion active pose`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Tower pose audit runs once at desktop resolution.');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const world = page.locator('.world-explorer');
    await expect(page.locator('.world-viewport canvas')).toBeVisible({ timeout: 4_000 });
    await expect(world).toHaveAttribute('data-fallback', 'false');

    await page.locator('.world-zone-labels').getByRole('link', { name: tower.name, exact: true }).click();
    await expect(page.locator('.archive-window')).toBeVisible();
    await expect(world).toHaveAttribute('data-phase', 'zone-open');
    await page.waitForTimeout(200);
    await page.addStyleTag({ content: '.archive-window { display: none !important; }' });

    await expect(page.locator('.world-viewport')).toHaveScreenshot(tower.snapshot, {
      animations: 'disabled',
      maxDiffPixelRatio: 0.02,
    });
  });
}
