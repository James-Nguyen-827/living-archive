import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const names = ['default', 'work', 'notes', 'archive'];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

try {
  for (const name of names) {
    await page.goto(`http://127.0.0.1:4321/og/${name}.svg`, { waitUntil: 'load' });
    const outputPath = fileURLToPath(new URL(`../public/og/${name}.png`, import.meta.url));
    await page.screenshot({
      path: outputPath,
      clip: { x: 0, y: 0, width: 1200, height: 630 },
    });
    console.log(`Captured ${outputPath}`);
  }
} finally {
  await browser.close();
}
