// Lighthouse CI for the built site: `npm run lighthouse` (after `npm run build`), and the Lighthouse job in
// .github/workflows/ci.yml. It serves dist/ with the same `vite preview` command the e2e tests use
// (playwright.config.ts), audits the home page three times with Lighthouse's default mobile profile (a mid-range
// phone on throttled 4G, simulated) and asserts the budgets below on the median run. Reports are written to
// .lighthouseci/ (the raw runs) and .lighthouseci/reports/ (HTML and JSON per run).
//
// The budgets are what the site scores, less a small margin for run-to-run noise: at the time of writing the median
// mobile run scores performance 0.82, accessibility 1, best practices 0.96 (Bandcamp's embed sets third-party
// cookies), SEO 1, with LCP 4.9 s, FCP 1.2 s, TBT 0 ms, CLS 0 and 2.13 MB transferred (0.62 MB of it Bandcamp's
// player). Raise them when the site gets faster; never lower them to let a regression through.
const PORT = 4180;

module.exports = {
  ci: {
    collect: {
      startServerCommand: `npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
      startServerReadyPattern: 'Local',
      url: [`http://127.0.0.1:${PORT}/`],
      numberOfRuns: 3,
      settings: {
        // Chrome in a CI container has no sandbox to drop into.
        chromeFlags: '--no-sandbox --headless=new',
      },
    },
    assert: {
      // Assert on the median of the three runs, so one slow run neither fails nor passes the build.
      aggregationMethod: 'median-run',
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 1 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 5500 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.02 }],
        'total-byte-weight': ['error', { maxNumericValue: 2600000 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci/reports',
    },
  },
};
