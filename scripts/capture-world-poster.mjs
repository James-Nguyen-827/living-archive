import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const outputPath = fileURLToPath(new URL('../public/world-poster.png', import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 760 }, reducedMotion: 'reduce' });

try {
  await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });
  const canvas = page.locator('.world-viewport canvas');
  await canvas.waitFor({ state: 'visible', timeout: 10_000 });
  await page.waitForTimeout(500);
  await page.addStyleTag({
    content: '.world-explorer__caption, .world-zone-labels, .world-controls, .world-help { opacity: 0 !important; }',
  });
  await page.waitForTimeout(100);
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas bounds were unavailable.');
  await page.screenshot({
    path: outputPath,
    clip: { x: box.x, y: box.y, width: box.width, height: box.height - 40 },
  });
  console.log(`Captured ${outputPath}`);
} finally {
  await browser.close();
}
