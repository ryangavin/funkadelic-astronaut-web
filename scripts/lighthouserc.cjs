// Lighthouse CI for the built site: `npm run lighthouse` (after `npm run build`), and the Lighthouse job in
// .github/workflows/ci.yml. It serves dist/ with the same `vite preview` command the e2e tests use
// (playwright.config.ts), audits the home page three times with Lighthouse's default mobile profile (a mid-range
// phone on throttled 4G, simulated) and asserts the budgets below on the median run. Reports are written to
// .lighthouseci/ (the raw runs) and .lighthouseci/reports/ (HTML and JSON per run).
//
// Third parties are blocked (see chromeFlags), so the audit measures the site's own files only. The budgets are what
// the site scores with room for slower CI runners: at the time of writing the median mobile run scores performance
// 0.84, accessibility 1, best practices 1, SEO 1, with LCP 4.5 s, FCP 1.65 s, TBT 0 ms, CLS 0 and 1.51 MB
// transferred. Accessibility and SEO don't depend on timing, so they stay at 1. Raise the budgets when the site gets
// faster; never lower them to let a regression through.
const PORT = 4180;

module.exports = {
  ci: {
    collect: {
      startServerCommand: `npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
      startServerReadyPattern: 'Local',
      url: [`http://127.0.0.1:${PORT}/`],
      numberOfRuns: 3,
      settings: {
        // Chrome in a CI container has no sandbox to drop into. The audit is hermetic: every host but the preview
        // server resolves to nothing, so Bandcamp's player, YouTube and anything they pull in never load and can't
        // move the scores. The budgets measure the site's own files only.
        chromeFlags: '--no-sandbox --headless=new --host-resolver-rules="MAP * ~NOTFOUND, EXCLUDE 127.0.0.1"',
        // Belt and braces for the embeds the page names, should the resolver rule ever be ignored.
        blockedUrlPatterns: ['*bandcamp.com*', '*bcbits.com*', '*youtube*', '*google*', '*doubleclick*'],
      },
    },
    assert: {
      // Assert on the median of the three runs, so one slow run neither fails nor passes the build.
      aggregationMethod: 'median-run',
      assertions: {
        'categories:performance': ['error', { minScore: 0.75 }],
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 1 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 6000 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.05 }],
        'total-byte-weight': ['error', { maxNumericValue: 1800000 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci/reports',
    },
  },
};
