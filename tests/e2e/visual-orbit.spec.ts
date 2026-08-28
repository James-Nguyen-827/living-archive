import { expect, test } from '@playwright/test';

test('arbitrary orbit angles retain clean square joins', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440-orbit', 'Angle audit runs once at desktop resolution.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [name, presses] of [['022', 1], ['067', 3], ['157', 7], ['247', 11]] as const) {
    await page.goto('/');
    const world = page.locator('.world-explorer');
    await expect(page.locator('.world-viewport canvas')).toBeVisible({ timeout: 4_000 });
    await expect(world).toHaveAttribute('data-fallback', 'false');
    await world.focus();
    for (let index = 0; index < presses; index += 1) await page.keyboard.press('e');
    await expect.poll(async () => Number(await world.getAttribute('data-angle'))).toBeCloseTo(presses * Math.PI / 8, 5);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await expect(page.locator('.world-zone-labels li[data-projected="true"]')).toHaveCount(5);
    let previous = '';
    await expect.poll(async () => {
      const signature = await page.locator('.world-zone-labels li').evaluateAll((elements) => elements.map((element) => {
        const style = getComputedStyle(element);
        return `${style.getPropertyValue('--label-x')}:${style.getPropertyValue('--label-y')}`;
      }).join('|'));
      const stable = signature === previous && signature.length > 0;
      previous = signature;
      return stable;
    }).toBe(true);
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let frames = 0;
        const step = () => {
          frames += 1;
          if (frames >= 12) resolve();
          else requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    });
    await expect(page.locator('.world-viewport')).toHaveScreenshot(`world-angle-${name}.png`, {
      animations: 'disabled',
      maxDiffPixelRatio: 0.02,
    });
  }
});
