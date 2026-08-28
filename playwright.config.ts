import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4322',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && node scripts/static-server.mjs 4322',
    url: 'http://127.0.0.1:4322',
    reuseExistingServer: false,
  },
  projects: [
  {
    name: 'desktop-1440',
    testIgnore: '**/visual-orbit.spec.ts',
    use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
  },
  {
    name: 'tablet-768',
    testIgnore: '**/visual-orbit.spec.ts',
    use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } },
  },
  {
    name: 'mobile-360',
    testIgnore: '**/visual-orbit.spec.ts',
    use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true },
  },
  {
    name: 'desktop-1440-orbit',
    testMatch: '**/visual-orbit.spec.ts',
    dependencies: ['desktop-1440', 'tablet-768', 'mobile-360'],
    use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
  },
  ],
});
