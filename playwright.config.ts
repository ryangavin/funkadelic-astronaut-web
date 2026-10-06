import { defineConfig } from '@playwright/test';

// Not `npm run preview`'s 4173, so the tests can run while a preview (or another project's) is already on that port.
const PORT = 4180;
const baseURL = `http://127.0.0.1:${PORT}/`;

/**
 * End-to-end tests of the released site: the production build in dist/,
 * served by `vite preview`, driven in Chromium at a phone, a tablet and a
 * desktop size. See e2e/ and AGENTS.md.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Flakes should fail loudly, not pass on a second try.
  retries: 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : [['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    browserName: 'chromium',
    // Google Chrome rather than Playwright's Chromium: the live set is H.264/AAC MP4, which open-source Chromium
    // builds do not decode on Linux, and the tests check that it really plays. GitHub's Ubuntu runners ship Chrome.
    channel: 'chrome',
  },
  projects: [
    { name: 'phone', use: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } },
    { name: 'tablet', use: { viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    // Serves dist/ as `npm run preview` does. Build it first: `npm run test:e2e` does, so a build failure shows as one.
    command: `npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
