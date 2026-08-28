import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Living Archive playable world', () => {
  test('renders immediate navigation and initializes the enhanced world', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Index', exact: true })).toBeVisible();
    await expect(page.locator('.world-zone-labels')).toBeVisible();
    await expect(page.locator('.world-viewport canvas')).toBeVisible({ timeout: 4_000 });
    await expect(page.locator('.world-explorer')).toHaveAttribute('data-node', 'spawn');
    await expect(page.locator('.world-help')).toBeVisible();
  });

  test('guided travel opens one architectural window and morphs to an entry preview', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.world-viewport canvas')).toBeVisible({ timeout: 4_000 });
    const workLabel = page.locator('.world-zone-labels').getByRole('link', { name: /Work/ });
    await workLabel.click();
    const world = page.locator('.world-explorer');
    await expect(world).toHaveAttribute('data-phase', 'zone-open', { timeout: 8_000 });
    await expect(world).toHaveAttribute('data-node', 'work-zone');
    await expect(page).toHaveURL(/zone=work/);
    await expect(page.locator('.archive-window')).toBeFocused();

    await page.getByRole('button', { name: /Civic Signal/ }).click();
    await expect(page.locator('.archive-window')).toHaveAttribute('data-content', 'entry');
    await expect(page.getByRole('link', { name: 'Open', exact: true })).toHaveAttribute('href', '/work/civic-signal');
    await page.goBack();
    await expect(page.locator('.archive-window')).toHaveAttribute('data-content', 'zone');
    await page.goForward();
    await expect(page.locator('.archive-window')).toHaveAttribute('data-content', 'entry');
    await expect(page.getByRole('link', { name: 'Open', exact: true })).toHaveAttribute('href', '/work/civic-signal');
    await page.goBack();
    await expect(page.locator('.archive-window')).toHaveAttribute('data-content', 'zone');

    await page.keyboard.press('Escape');
    await expect(page.locator('.archive-window')).toHaveCount(0);
    await expect(workLabel).toBeFocused();
    await expect(world).toHaveAttribute('data-node', 'spawn', { timeout: 5_000 });

    await page.locator('.world-zone-labels').getByRole('link', { name: /Hobbies/ }).click();
    await expect(world).toHaveAttribute('data-selected-zone', 'hobbies', { timeout: 5_000 });
    await expect(world).toHaveAttribute('data-node', 'hobbies-zone');
  });

  test('free orbit accepts arbitrary drag angles, follows labels, and ignores locomotion keys', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.world-viewport canvas')).toBeVisible({ timeout: 4_000 });
    const world = page.locator('.world-explorer');
    const workLabel = page.locator('.world-zone-labels li[data-zone="work"]');
    const before = await workLabel.evaluate((element) => getComputedStyle(element).getPropertyValue('--label-x'));
    const box = await page.locator('.world-viewport').boundingBox();
    if (!box) throw new Error('World viewport bounds unavailable.');
    await page.mouse.move(box.x + box.width * .6, box.y + box.height * .45);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * .51, box.y + box.height * .45, { steps: 6 });
    await page.mouse.up();
    await expect.poll(async () => Number(await world.getAttribute('data-angle'))).not.toBe(0);
    const angle = Number(await world.getAttribute('data-angle'));
    expect(Math.abs(angle % (Math.PI / 2))).toBeGreaterThan(.05);
    await expect.poll(async () => workLabel.evaluate((element) => getComputedStyle(element).getPropertyValue('--label-x'))).not.toBe(before);

    await world.focus();
    const node = await world.getAttribute('data-node');
    for (const key of ['w', 'a', 's', 'd', 'ArrowUp', 'ArrowRight']) await page.keyboard.press(key);
    await expect(world).toHaveAttribute('data-node', node!);
    const beforeNudge = Number(await world.getAttribute('data-angle'));
    await page.keyboard.press('e');
    await expect.poll(async () => Number(await world.getAttribute('data-angle'))).toBeCloseTo(beforeNudge + Math.PI / 8, 4);
  });

  test('mid-route selection cancels the old journey and every zone remains directly restorable', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.world-viewport canvas')).toBeVisible({ timeout: 4_000 });
    const labels = page.locator('.world-zone-labels');
    await labels.getByRole('link', { name: /About/ }).click();
    await page.waitForTimeout(180);
    await labels.getByRole('link', { name: /Work/ }).click();
    await expect(page.locator('.world-explorer')).toHaveAttribute('data-selected-zone', 'work', { timeout: 4_000 });
    await expect(page).toHaveURL(/zone=work/);

    for (const zone of ['work', 'field-notes', 'experiments', 'hobbies', 'about']) {
      await page.goto(`/?zone=${zone}`);
      await expect(page.locator('.world-explorer')).toHaveAttribute('data-selected-zone', zone);
      await expect(page.locator('.archive-window')).toBeVisible();
    }
  });

  test('closing after visiting multiple islands returns home in one step', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.world-viewport canvas')).toBeVisible({ timeout: 4_000 });
    const world = page.locator('.world-explorer');
    await page.locator('.world-zone-labels').getByRole('link', { name: /Hobbies/ }).click();
    await expect(world).toHaveAttribute('data-phase', 'zone-open', { timeout: 4_000 });
    await expect(world).toHaveAttribute('data-selected-zone', 'hobbies');
    await page.locator('.world-zone-labels li[data-zone="experiments"] a').evaluate((element: HTMLAnchorElement) => {
      element.click();
    });
    await expect(world).toHaveAttribute('data-selected-zone', 'experiments', { timeout: 4_000 });
    await page.getByRole('button', { name: 'Close archive window' }).click();
    await expect(page.locator('.archive-window')).toHaveCount(0);
    await expect(page).not.toHaveURL(/zone=/);
    await expect(world).toHaveAttribute('data-node', 'spawn', { timeout: 5_000 });
    await expect(page.locator('.archive-window')).toHaveCount(0);
  });

  test('index uses the shared window and browser history restores zones', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open index' }).click();
    await expect(page.getByRole('heading', { name: 'Index' })).toBeVisible();
    await expect(page.locator('.archive-window__zones li')).toHaveCount(5);
    await page.goBack();
    await expect(page.locator('.archive-window')).toHaveCount(0);
    await page.goForward();
    await expect(page.getByRole('heading', { name: 'Index' })).toBeVisible();
    await page.locator('.archive-window__zones').getByRole('button', { name: /Work/ }).click();
    await expect(page.locator('.world-explorer')).toHaveAttribute('data-selected-zone', 'work', { timeout: 8_000 });
    await page.goBack();
    await expect(page.locator('.archive-window')).toHaveCount(0);
    await page.goForward();
    await expect(page.locator('.world-explorer')).toHaveAttribute('data-selected-zone', 'work');
    await expect(page.locator('.archive-window')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.archive-window')).toHaveCount(0);
    await expect(page.locator('.world-zone-labels').getByRole('link', { name: /Work/ })).toBeFocused();
    await expect(page.locator('.world-explorer')).toHaveAttribute('data-node', 'spawn', { timeout: 5_000 });
  });

  test('data-saving visitors receive the complete static fallback', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true } });
    });
    await page.goto('/');
    await expect(page.getByTestId('world-fallback')).toBeVisible();
    await expect(page.getByText(/data saving is enabled/i)).toBeVisible();
    const fallbackLinks = page.getByTestId('world-fallback').getByRole('link');
    await expect(fallbackLinks).toHaveCount(5);
    await fallbackLinks.first().click();
    await expect(page.locator('.archive-window')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.archive-window')).toHaveCount(0);
    await expect(fallbackLinks.first()).toBeFocused();
  });

  test('the conventional index is complete and usable without the world', async ({ page }) => {
    await page.goto('/index');
    for (const label of ['Work', 'Field Notes', 'Experiments', 'Hobbies', 'About']) {
      await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible();
    }
    await expect(page.getByRole('link', { name: 'Civic Signal' })).toHaveAttribute('href', '/work/civic-signal');
  });

  test('long-form pages reflow at 200 percent text sizing without horizontal overflow', async ({ page }) => {
    await page.goto('/work/civic-signal');
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('the complete linked fallback works with JavaScript disabled', async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'The no-JavaScript path is viewport-independent.');
    const page = await browser.newPage({ javaScriptEnabled: false });
    await page.goto(`${testInfo.project.use.baseURL}/`);
    await expect(page.getByTestId('world-fallback').getByRole('link')).toHaveCount(5);
    await expect(page.locator('.world-viewport canvas')).toHaveCount(0);
    await page.close();
  });
});

const accessibilityRoutes = ['/', '/index', '/work/civic-signal', '/notes/designing-with-edges', '/experiments/impossible-stairs', '/hobbies/small-structures', '/about'];
for (const route of accessibilityRoutes) {
  test(`has no automatically detectable accessibility violations at ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

test('has no automatically detectable accessibility violations in night mode', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('portfolio-theme', 'night'));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'night');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
