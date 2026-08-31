import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

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
      'The Field Notes archive has no published entries yet. The Index Engine is ready for the first note worth keeping.',
      { exact: true },
    )).toBeVisible();
  });

  test('the Blogs archive explains its empty state', async ({ page }) => {
    await page.goto('/?zone=writing');

    await expect(page.locator('.archive-window')).toHaveAttribute('data-content', 'zone');
    await expect(page.getByRole('heading', { name: 'Blogs', exact: true })).toBeVisible();
    await expect(page.locator('.archive-window__entries li')).toHaveCount(0);
    await expect(page.locator('.archive-window__content').getByText(
      'The Field Notes archive has no published entries yet. The Index Engine is ready for the first note worth keeping.',
      { exact: true },
    )).toBeVisible();
  });

  test('draft Interests remain private across routes, indexes, and the world archive', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Draft filtering is viewport-independent.');

    const holdingMessage =
      'The Interests archive is being rebuilt from real notes, recordings, and sketches. It will reopen when the first artifacts are ready.';

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

  test('index uses the shared window and browser history restores zones', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open index' }).click();
    await expect(page.getByRole('heading', { name: 'Index' })).toBeVisible();
    await expect(page.locator('.archive-window__zones li')).toHaveCount(5);
    await page.goBack();
    await expect(page.locator('.archive-window')).toHaveCount(0);
    await page.goForward();
    await expect(page.getByRole('heading', { name: 'Index' })).toBeVisible();
    await page.locator('.archive-window__zones').getByRole('button', { name: /Employment/ }).click();
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
    for (const label of ['Employment', 'Blogs', 'Projects', 'Interests', 'About']) {
      await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible();
    }
    await expect(page.getByRole('link', { name: 'Bioengineering Lab Researcher' })).toHaveAttribute('href', '/employment/bioengineering-lab-researcher');
    await expect(page.locator('.index-link')).toHaveText('Index');
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

  test('the complete linked fallback works with JavaScript disabled', async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'The no-JavaScript path is viewport-independent.');
    const page = await browser.newPage({ javaScriptEnabled: false });
    await page.goto(`${testInfo.project.use.baseURL}/`);
    await expect(page.getByTestId('world-fallback').getByRole('link')).toHaveCount(5);
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
      page.locator('.index-link'),
      page.locator('.world-zone-labels li[data-zone="projects"] a'),
      page.locator('.site-footer a'),
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
  const fallbackTarget = fallbackPage.getByTestId('world-fallback').getByRole('link').first();
  const fallbackBox = await fallbackTarget.boundingBox();
  expect(fallbackBox).not.toBeNull();
  expect(fallbackBox!.width).toBeGreaterThanOrEqual(44);
  expect(fallbackBox!.height).toBeGreaterThanOrEqual(44);
  await fallbackPage.close();
});

test('mobile projected labels stay above the archive sheet and restore when it closes', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-360', 'The bottom sheet is mobile-specific.');

  await page.goto('/');
  await expect(page.locator('.world-viewport canvas')).toBeVisible({ timeout: 4_000 });
  const labels = page.locator('.world-zone-labels li[data-projected="true"]');
  await expect(labels).toHaveCount(5);

  await page.getByRole('button', { name: 'Open index' }).click();
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
