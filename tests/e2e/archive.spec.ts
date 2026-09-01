import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function swipeTouch(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  const session = await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] });
  for (let step = 1; step <= 4; step += 1) {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{
        x: from.x + (to.x - from.x) * step / 4,
        y: from.y + (to.y - from.y) * step / 4,
      }],
    });
    await page.waitForTimeout(35);
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await session.detach();
}

test.describe('James Nguyen portfolio world', () => {
  test('renders immediate navigation and initializes the enhanced world', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Index', exact: true })).toBeVisible();
    await expect(page.locator('.world-zone-labels')).toBeVisible();
    await expect(page.locator('.world-viewport canvas')).toBeVisible({ timeout: 4_000 });
    await expect(page.locator('.world-explorer')).toHaveAttribute('data-node', 'spawn');
    await expect(page.locator('.world-help')).toBeVisible();
  });

  test('desktop and mobile guidance explains both travel and orbiting', async ({ page }, testInfo) => {
    await page.goto('/');
    if (testInfo.project.name === 'mobile-360') {
      await expect(page.locator('.world-help__mobile')).toHaveText(
        'Tap a place; the traveler opens its archive · drag to orbit',
      );
      await expect(page.locator('.world-help__mobile')).toBeVisible();
    } else if (testInfo.project.name === 'desktop-1440') {
      await expect(page.locator('.world-help__desktop')).toHaveText(
        'Drag to orbit · choose a place; the traveler opens its archive',
      );
      await expect(page.locator('.world-help__desktop')).toBeVisible();
    } else {
      test.skip(true, 'Exact guidance is covered at the desktop and mobile endpoints.');
    }
  });

  test('guided travel opens one architectural window and morphs to an entry preview', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.world-viewport canvas')).toBeVisible({ timeout: 4_000 });
    const employmentLabel = page.locator('.world-zone-labels').getByRole('link', { name: /Employment/ });
    await employmentLabel.click();
    const world = page.locator('.world-explorer');
    await expect(world).toHaveAttribute('data-phase', 'zone-open', { timeout: 8_000 });
    await expect(world).toHaveAttribute('data-node', 'employment-zone');
    await expect(page).toHaveURL(/zone=employment/);
    await expect(page.locator('.archive-window')).toBeFocused();

    await page.getByRole('button', { name: /Bioengineering Lab Researcher/ }).click();
    await expect(page.locator('.archive-window')).toHaveAttribute('data-content', 'entry');
    await expect(page.getByRole('link', { name: 'Open', exact: true })).toHaveAttribute('href', '/employment/bioengineering-lab-researcher');
    await page.goBack();
    await expect(page.locator('.archive-window')).toHaveAttribute('data-content', 'zone');
    await page.goForward();
    await expect(page.locator('.archive-window')).toHaveAttribute('data-content', 'entry');
    await expect(page.getByRole('link', { name: 'Open', exact: true })).toHaveAttribute('href', '/employment/bioengineering-lab-researcher');
    await page.goBack();
    await expect(page.locator('.archive-window')).toHaveAttribute('data-content', 'zone');

    await page.keyboard.press('Escape');
    await expect(page.locator('.archive-window')).toHaveCount(0);
    await expect(employmentLabel).toBeFocused();
    await expect(world).toHaveAttribute('data-node', 'spawn', { timeout: 5_000 });

    await page.locator('.world-zone-labels').getByRole('link', { name: /Interests/ }).click();
    await expect(world).toHaveAttribute('data-selected-zone', 'interests', { timeout: 5_000 });
    await expect(world).toHaveAttribute('data-node', 'interests-zone');
  });

  test('project selection shows a concise archive preview before opening the full entry', async ({ page }) => {
    await page.goto('/?zone=projects');
    await expect(page.locator('.archive-window')).toHaveAttribute('data-content', 'zone');

    await page.getByRole('button', { name: /ColorCam/ }).click();

    await expect(page.locator('.archive-window')).toHaveAttribute('data-content', 'entry');
    await expect(page.getByRole('heading', { name: 'ColorCam' })).toBeVisible();
    await expect(page.locator('.archive-window__content')).toContainText(
      'A Raspberry Pi lab platform that turns a 3D printer into an automated well-plate imager and exports repeatable colorimetric assay data.',
    );
    await expect(page.getByRole('link', { name: 'Open', exact: true })).toHaveAttribute('href', '/projects/colorcam');
  });

  test('new marketplace projects provide concise archive previews before their full entries', async ({ page }) => {
    await page.goto('/?zone=projects');
    await page.getByRole('button', { name: /GatorTrade/ }).click();

    await expect(page.getByRole('heading', { name: 'GatorTrade' })).toBeVisible();
    await expect(page.locator('.archive-window__content')).toContainText(
      'A student marketplace for the SFSU community, connecting account flows, listings, search, and messaging through a React and Node/Express application.',
    );
    await expect(page.getByRole('link', { name: 'Open', exact: true })).toHaveAttribute('href', '/projects/gatortrade');

    await page.goBack();
    await expect(page.locator('.archive-window')).toHaveAttribute('data-content', 'zone');
    await page.getByRole('button', { name: /Apples/ }).click();

    await expect(page.getByRole('heading', { name: 'Apples' })).toBeVisible();
    await expect(page.locator('.archive-window__content')).toContainText(
      'An early team-built storefront that organized a small apple-product catalog into clear pages, navigation, sign-up, and a checkout prototype.',
    );
    await expect(page.getByRole('link', { name: 'Open', exact: true })).toHaveAttribute('href', '/projects/apples');
  });

  test('blogs clearly presents an intentional blank slate before the first post', async ({ page }) => {
    await page.goto('/writing');

    await expect(page.getByRole('heading', { name: 'Blogs', exact: true })).toBeVisible();
    await expect(page.locator('.indexed-list li')).toHaveCount(0);
    await expect(page.getByText(
      "The Blogs archive is empty for now. I'm still figuring out what I want to write about.",
      { exact: true },
    )).toBeVisible();
  });

  test('the Blogs archive explains its empty state', async ({ page }) => {
    await page.goto('/?zone=writing');

    await expect(page.locator('.archive-window')).toHaveAttribute('data-content', 'zone');
    await expect(page.getByRole('heading', { name: 'Blogs', exact: true })).toBeVisible();
    await expect(page.locator('.archive-window__entries li')).toHaveCount(0);
    await expect(page.locator('.archive-window__content').getByText(
      "The Blogs archive is empty for now. I'm still figuring out what I want to write about.",
      { exact: true },
    )).toBeVisible();
  });

  test('the About archive shows its summary', async ({ page }) => {
    await page.goto('/?zone=about');

    await expect(page.locator('.archive-window')).toHaveAttribute('data-content', 'zone');
    await expect(page.getByRole('heading', { name: 'About', exact: true })).toBeVisible();
    await expect(page.locator('.archive-window__entries li')).toHaveCount(0);
    await expect(page.locator('.archive-window__summary')).toContainText('likes building things');
    await expect(page.locator('.archive-window__summary')).toContainText('something you can actually explore.');
  });

  test('draft Interests remain private across routes, indexes, and the world archive', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Draft filtering is viewport-independent.');

    const holdingMessage =
      'Still working on this—there are a lot of interests to catalog.';

    await page.goto('/interests');
    await expect(page.locator('.indexed-list li')).toHaveCount(0);
    await expect(page.getByText(holdingMessage, { exact: true })).toBeVisible();

    await page.goto('/index');
    for (const title of ['Small Structures', 'Urban Field Recordings', 'Weekend Transit']) {
      await expect(page.getByRole('link', { name: title, exact: true })).toHaveCount(0);
    }

    await page.goto('/?zone=interests');
    await expect(page.locator('.archive-window__entries li')).toHaveCount(0);
    await expect(page.locator('.archive-window__content').getByText(holdingMessage, { exact: true })).toBeVisible();

    const response = await page.goto('/interests/small-structures');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Route not found', exact: true })).toBeVisible();
  });

  test('employment archive contains the CV-backed roles and no startup entry', async ({ page }) => {
    await page.goto('/?zone=employment');

    const entries = page.locator('.archive-window__entries li');
    await expect(entries).toHaveCount(4);
    for (const role of [
      'Bioengineering Lab Researcher',
      'Makerspace Technical Program Mentor',
      'ChatGPT Campus Ambassador',
      'Computer Science Lab Manager',
    ]) {
      await expect(entries.getByRole('button', { name: new RegExp(role) })).toBeVisible();
    }
    await expect(page.locator('.archive-window__content')).not.toContainText('MoldiBlocks');
  });

  test('free orbit accepts arbitrary drag angles, follows labels, and ignores locomotion keys', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.world-viewport canvas')).toBeVisible({ timeout: 4_000 });
    const world = page.locator('.world-explorer');
    const employmentLabel = page.locator('.world-zone-labels li[data-zone="employment"]');
    const before = await employmentLabel.evaluate((element) => getComputedStyle(element).getPropertyValue('--label-x'));
    const box = await page.locator('.world-viewport').boundingBox();
    if (!box) throw new Error('World viewport bounds unavailable.');
    await page.mouse.move(box.x + box.width * .6, box.y + box.height * .45);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * .51, box.y + box.height * .45, { steps: 6 });
    await page.mouse.up();
    await expect.poll(async () => Number(await world.getAttribute('data-angle'))).not.toBe(0);
    const angle = Number(await world.getAttribute('data-angle'));
    expect(Math.abs(angle % (Math.PI / 2))).toBeGreaterThan(.05);
    await expect.poll(async () => employmentLabel.evaluate((element) => getComputedStyle(element).getPropertyValue('--label-x'))).not.toBe(before);

    await world.focus();
    const node = await world.getAttribute('data-node');
    for (const key of ['w', 'a', 's', 'd', 'ArrowUp', 'ArrowRight']) await page.keyboard.press(key);
    await expect(world).toHaveAttribute('data-node', node!);
    const beforeNudge = Number(await world.getAttribute('data-angle'));
    await page.keyboard.press('e');
    await expect.poll(async () => Number(await world.getAttribute('data-angle'))).toBeCloseTo(beforeNudge + Math.PI / 8, 4);
  });

  test('clicking a 3D island opens its archive', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.world-viewport canvas')).toBeVisible({ timeout: 4_000 });
    const employmentLabel = page.locator('.world-zone-labels li[data-zone="employment"]');
    await expect(employmentLabel).toHaveAttribute('data-projected', 'true', { timeout: 4_000 });
    const labelBox = await employmentLabel.boundingBox();
    if (!labelBox) throw new Error('Employment label bounds unavailable.');
    // Labels anchor above each island; the sculpture sits below the pill.
    await page.mouse.click(labelBox.x + labelBox.width / 2, labelBox.y + labelBox.height + 52);
    await expect(page.locator('.world-explorer')).toHaveAttribute('data-selected-zone', 'employment', { timeout: 8_000 });
    await expect(page.getByRole('heading', { name: 'Employment' })).toBeVisible();
  });

  test('mid-route selection cancels the old journey and every zone remains directly restorable', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.world-viewport canvas')).toBeVisible({ timeout: 4_000 });
    const labels = page.locator('.world-zone-labels');
    await labels.getByRole('link', { name: /About/ }).click();
    await page.waitForTimeout(180);
    await labels.getByRole('link', { name: /Employment/ }).click();
    await expect(page.locator('.world-explorer')).toHaveAttribute('data-selected-zone', 'employment', { timeout: 4_000 });
    await expect(page).toHaveURL(/zone=employment/);

    for (const zone of ['employment', 'writing', 'projects', 'interests', 'about']) {
      await page.goto(`/?zone=${zone}`);
      await expect(page.locator('.world-explorer')).toHaveAttribute('data-selected-zone', zone);
      await expect(page.locator('.archive-window')).toBeVisible();
    }
  });

  test('closing after visiting multiple islands returns home in one step', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.world-viewport canvas')).toBeVisible({ timeout: 4_000 });
    const world = page.locator('.world-explorer');
    await page.locator('.world-zone-labels').getByRole('link', { name: /Interests/ }).click();
    await expect(world).toHaveAttribute('data-phase', 'zone-open', { timeout: 4_000 });
    await expect(world).toHaveAttribute('data-selected-zone', 'interests');
    await page.locator('.world-zone-labels li[data-zone="projects"] a').evaluate((element: HTMLAnchorElement) => {
      element.click();
    });
    await expect(world).toHaveAttribute('data-selected-zone', 'projects', { timeout: 4_000 });
    await page.getByRole('button', { name: 'Close archive window' }).click();
    await expect(page.locator('.archive-window')).toHaveCount(0);
    await expect(page).not.toHaveURL(/zone=/);
    await expect(world).toHaveAttribute('data-node', 'spawn', { timeout: 5_000 });
    await expect(page.locator('.archive-window')).toHaveCount(0);
  });

  test('browser history restores zones from the shared archive window', async ({ page }) => {
    await page.goto('/');
    await page.locator('.world-zone-labels li[data-zone="projects"] a').click();
    await expect(page.locator('.world-explorer')).toHaveAttribute('data-selected-zone', 'projects', { timeout: 8_000 });
    await page.goBack();
    await expect(page.locator('.archive-window')).toHaveCount(0);
    await page.goForward();
    await expect(page.locator('.world-explorer')).toHaveAttribute('data-selected-zone', 'projects');
    await expect(page.locator('.archive-window')).toBeVisible();
    await page.locator('.world-zone-labels li[data-zone="employment"] a').click();
    await expect(page.locator('.world-explorer')).toHaveAttribute('data-selected-zone', 'employment', { timeout: 8_000 });
    await page.goBack();
    await expect(page.locator('.archive-window')).toHaveCount(0);
    await page.goForward();
    await expect(page.locator('.world-explorer')).toHaveAttribute('data-selected-zone', 'employment');
    await expect(page.locator('.archive-window')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.archive-window')).toHaveCount(0);
    await expect(page.locator('.world-zone-labels').getByRole('link', { name: /Employment/ })).toBeFocused();
    await expect(page.locator('.world-explorer')).toHaveAttribute('data-node', 'spawn', { timeout: 5_000 });
  });

  test('data-saving visitors receive the poster-only static fallback', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true } });
    });
    await page.goto('/');
    await expect(page.getByTestId('world-fallback')).toBeVisible();
    await expect(page.getByText(/data saving is enabled/i)).toBeVisible();
    await expect(page.getByTestId('world-fallback').getByRole('link')).toHaveCount(0);

    await page.goto('/?zone=employment');
    await expect(page.locator('.archive-window')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.archive-window')).toHaveCount(0);
  });

  test('the conventional index is complete and usable without the world', async ({ page }) => {
    await page.goto('/index');
    for (const label of ['Employment', 'Blogs', 'Projects', 'Interests', 'About']) {
      await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible();
    }
    await expect(page.getByRole('link', { name: 'Bioengineering Lab Researcher' })).toHaveAttribute('href', '/employment/bioengineering-lab-researcher');
  });

  test('conventional routes carry their landmark-derived section marks', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Section marks are viewport-independent.');

    for (const [route, section] of [
      ['/employment', 'employment'],
      ['/writing', 'writing'],
      ['/projects', 'projects'],
      ['/interests', 'interests'],
      ['/about', 'about'],
      ['/index', 'utility'],
      ['/404', 'utility'],
    ] as const) {
      await page.goto(route);
      await expect(page.locator(`.section-mark[data-section="${section}"]`)).toBeVisible();
    }

    await page.goto('/projects/living-archive');
    await expect(page.locator('.section-mark[data-section="projects"]')).toBeVisible();
  });

  test('the not-found page gives exact recovery guidance', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'The not-found copy is viewport-independent.');

    await page.goto('/404');
    await expect(page.getByRole('heading', { name: 'Route not found', exact: true })).toBeVisible();
    await expect(page.getByText('The traveler cannot reach this coordinate. Return to the World or open the complete Index.', { exact: true })).toBeVisible();
    const recovery = page.locator('#main-content');
    await expect(recovery.getByRole('link', { name: 'World', exact: true })).toHaveAttribute('href', '/');
    await expect(recovery.getByRole('link', { name: 'Index', exact: true })).toHaveAttribute('href', '/index');
  });

  test('long-form pages reflow at 200 percent text sizing without horizontal overflow', async ({ page }) => {
    await page.goto('/employment/bioengineering-lab-researcher');
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const titleBox = await page.locator('.article-head h1').boundingBox();
    expect(titleBox).not.toBeNull();
    expect(titleBox!.x).toBeGreaterThanOrEqual(0);
    expect(titleBox!.x + titleBox!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
  });

  test('the poster-only fallback works with JavaScript disabled', async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'The no-JavaScript path is viewport-independent.');
    const page = await browser.newPage({ javaScriptEnabled: false });
    await page.goto(`${testInfo.project.use.baseURL}/`);
    await expect(page.getByTestId('world-fallback').getByRole('link')).toHaveCount(0);
    await expect(page.locator('.site-header nav a')).toHaveCount(5);
    await expect(page.locator('.world-viewport canvas')).toHaveCount(0);
    await page.close();
  });
});

const accessibilityRoutes = ['/', '/index', '/employment/bioengineering-lab-researcher', '/writing', '/projects/living-archive', '/interests', '/about', '/404'];
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

test('navigation, world, fallback, and archive actions expose full interaction targets', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('.world-viewport canvas')).toBeVisible({ timeout: 4_000 });
  await expect(page.locator('.world-explorer')).toHaveAttribute('data-fallback', 'false', { timeout: 8_000 });

  const baseTargets = [
    ...await page.locator('.site-header nav a').all(),
    ...await page.locator('.world-controls button:visible').all(),
  ];
  if (testInfo.project.name === 'mobile-360') {
    baseTargets.push(
      page.locator('.site-mark'),
      page.locator('.world-zone-labels li[data-zone="projects"] a'),
    );
  }

  for (const target of baseTargets) {
    const box = await target.boundingBox();
    expect(box, `missing box for ${await target.evaluate((element) => element.outerHTML)}`).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }

  await page.locator('.world-zone-labels li[data-zone="projects"] a').click();
  await expect(page.locator('.archive-window')).toBeVisible();

  for (const target of [
    page.getByRole('button', { name: 'Close archive window' }),
    page.locator('.archive-window__primary'),
  ]) {
    const box = await target.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }

  if (testInfo.project.name !== 'mobile-360') return;

  const archiveResults = await new AxeBuilder({ page }).include('.archive-window').analyze();
  expect(archiveResults.violations).toEqual([]);

  const fallbackPage = await page.context().newPage();
  await fallbackPage.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true } });
  });
  await fallbackPage.goto('/');
  const themeToggle = fallbackPage.getByRole('button', { name: /Switch to (day|night) theme/i });
  const themeBox = await themeToggle.boundingBox();
  expect(themeBox).not.toBeNull();
  expect(themeBox!.width).toBeGreaterThanOrEqual(44);
  expect(themeBox!.height).toBeGreaterThanOrEqual(44);
  await fallbackPage.close();
});

test('mobile projected labels stay above the archive sheet and restore when it closes', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-360', 'The bottom sheet is mobile-specific.');

  await page.goto('/');
  await expect(page.locator('.world-viewport canvas')).toBeVisible({ timeout: 4_000 });
  const labels = page.locator('.world-zone-labels li[data-projected="true"]');
  await expect(labels).toHaveCount(5);

  await page.locator('.world-zone-labels li[data-zone="projects"] a').click();
  const archive = page.locator('.archive-window');
  await expect(archive).toHaveAttribute('data-phase', 'opening-window');

  let sheetTop = 0;
  const expectLabelsAboveSheet = async () => {
    const sheetBox = await archive.boundingBox();
    expect(sheetBox).not.toBeNull();
    sheetTop = sheetBox!.y;
    for (const label of await labels.all()) {
      const labelBox = await label.boundingBox();
      expect(labelBox).not.toBeNull();
      expect(labelBox!.y + labelBox!.height).toBeLessThanOrEqual(sheetBox!.y - 1);
    }
  };

  await expectLabelsAboveSheet();
  await expect(archive).toHaveAttribute('data-phase', 'zone-open');
  await expectLabelsAboveSheet();

  await page.getByRole('button', { name: 'Close archive window' }).click();
  await expect(archive).toHaveAttribute('data-phase', 'closing-window');
  await expectLabelsAboveSheet();
  await expect(archive).toHaveCount(0);

  await expect.poll(async () => Math.max(...await labels.evaluateAll((elements) => elements.map((element) => {
    const bounds = element.getBoundingClientRect();
    return bounds.bottom;
  })))).toBeGreaterThan(sheetTop + 1);
});

test('short mobile viewport keeps the site header visible when an archive opens', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-360', 'The short visual viewport regression is mobile-specific.');

  await page.setViewportSize({ width: 360, height: 600 });
  await page.goto('/');
  await expect(page.locator('.world-viewport canvas')).toBeVisible({ timeout: 4_000 });
  await page.locator('.world-zone-labels li[data-zone="projects"] a').click();
  await expect(page.locator('.world-explorer')).toHaveAttribute('data-phase', 'zone-open', { timeout: 8_000 });

  const layout = await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>('.site-header')!.getBoundingClientRect();
    const archive = document.querySelector<HTMLElement>('.archive-window')!.getBoundingClientRect();
    return {
      scrollY: window.scrollY,
      headerTop: header.top,
      archiveBottom: archive.bottom,
      viewportHeight: window.innerHeight,
    };
  });

  expect(layout.scrollY).toBe(0);
  expect(layout.headerTop).toBeGreaterThanOrEqual(0);
  expect(layout.archiveBottom).toBeLessThanOrEqual(layout.viewportHeight + 1);
});

test('mobile touch keeps horizontal orbit and releases vertical page panning', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-360', 'Touch-axis ownership is mobile-specific.');

  await page.setViewportSize({ width: 360, height: 600 });
  await page.goto('/');
  const canvas = page.locator('.world-viewport canvas');
  const world = page.locator('.world-explorer');
  await expect(canvas).toBeVisible({ timeout: 4_000 });

  const touchAction = await canvas.evaluate((element) => getComputedStyle(element).touchAction);
  expect(touchAction).toBe('pan-y');

  const beforeHorizontal = Number(await world.getAttribute('data-angle'));
  await swipeTouch(page, { x: 20, y: 160 }, { x: 140, y: 160 });
  await expect.poll(async () => Number(await world.getAttribute('data-angle'))).not.toBe(beforeHorizontal);

  await page.evaluate(() => window.scrollTo(0, 80));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(80);
  const beforeVertical = Number(await world.getAttribute('data-angle'));
  await swipeTouch(page, { x: 20, y: 160 }, { x: 20, y: 320 });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(40);
  await expect.poll(async () => Number(await world.getAttribute('data-angle'))).toBeCloseTo(beforeVertical, 4);
});

test('mobile archive route action follows every entry without overlap', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-360', 'The bottom-sheet flow is mobile-specific.');

  await page.setViewportSize({ width: 360, height: 600 });
  await page.goto('/?zone=projects');
  const content = page.locator('.archive-window__content');
  await expect(content).toBeVisible();

  const measurements = [];
  for (const fraction of [0, 0.5, 1]) {
    measurements.push(await content.evaluate((element, scrollFraction) => {
      const scrollport = element as HTMLElement;
      scrollport.scrollTop = (scrollport.scrollHeight - scrollport.clientHeight) * scrollFraction;
      const action = scrollport.querySelector<HTMLElement>('.archive-window__primary')!.getBoundingClientRect();
      const entries = [...scrollport.querySelectorAll<HTMLElement>('.archive-window__entries li')]
        .map((entry) => entry.getBoundingClientRect());
      const navigation = document.querySelector<HTMLElement>('.site-header nav')!.getBoundingClientRect();
      return {
        overlap: Math.max(0, ...entries.map((entry) => (
          Math.min(entry.bottom, action.bottom) - Math.max(entry.top, action.top)
        ))),
        lastEntryBottom: entries.at(-1)!.bottom,
        actionTop: action.top,
        actionBottom: action.bottom,
        navigationTop: navigation.top,
      };
    }, fraction));
  }

  for (const measurement of measurements) expect(measurement.overlap).toBeLessThanOrEqual(0);
  const final = measurements.at(-1)!;
  expect(final.lastEntryBottom).toBeLessThanOrEqual(final.actionTop);
  expect(final.actionBottom).toBeLessThanOrEqual(final.navigationTop);
});

test('flagship projects present structured, captioned evidence while legacy projects remain compatible', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', 'Case-study structure is viewport-independent.');

  const flagships = [
    {
      route: '/projects/living-archive',
      diagram: 'dual-path',
      next: '/projects/colorcam',
      heroName: /orthographic low-poly portfolio habitat/i,
    },
    {
      route: '/projects/colorcam',
      diagram: 'well-plate',
      next: '/projects/nixos-homelab',
      heroName: /camera view through a clear multi-well plate/i,
    },
    {
      route: '/projects/nixos-homelab',
      diagram: 'deploy-pipeline',
      next: '/projects/living-archive',
    },
  ];

  for (const flagship of flagships) {
    await page.goto(flagship.route);
    await expect(page.locator('.article-summary')).toBeVisible();
    await expect(page.locator('.case-study-overview')).toBeVisible();
    await expect(page.locator('.case-study-overview dt')).toHaveCount(4);
    await expect(page.locator(`.case-study-diagram[data-variant="${flagship.diagram}"]`)).toBeVisible();
    await expect(page.locator('.case-study-diagram figcaption')).toBeVisible();
    await expect(page.locator('.case-study-overview').getByRole('link', { name: /repository/i })).toHaveAttribute('href', /^https:\/\/github\.com\//);
    await expect(page.locator('.next-project')).toHaveAttribute('href', flagship.next);
    if (flagship.heroName) await expect(page.getByRole('img', { name: flagship.heroName })).toBeVisible();
  }

  await page.goto('/projects/apples');
  await expect(page.locator('.case-study-overview')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Apples' })).toBeVisible();
  await expect(page.locator('.article-body')).toContainText('coursework project');
});

test('flagship preview images carry through the architectural archive', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', 'Archive preview semantics are viewport-independent.');

  await page.goto('/?zone=projects');
  await page.getByRole('button', { name: /Living Archive/ }).click();
  await expect(page.locator('.archive-window__media img')).toHaveAttribute('src', '/world-poster.png');
  await expect(page.locator('.archive-window__media img')).toHaveAttribute('alt', /orthographic low-poly portfolio habitat/i);
});
