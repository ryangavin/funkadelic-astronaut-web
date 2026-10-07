// Lighthouse CI for the built site: `npm run lighthouse` (after `npm run build`), and the Lighthouse job in
// .github/workflows/ci.yml. It serves dist/ with the same `vite preview` command the e2e tests use
// (playwright.config.ts), audits the home page three times with Lighthouse's default mobile profile (a mid-range
// phone on throttled 4G, simulated) and asserts the budgets below on the median run. Reports are written to
// .lighthouseci/ (the raw runs) and .lighthouseci/reports/ (HTML and JSON per run).
//
// Third parties are blocked (see chromeFlags), so the audit measures the site's own files only. The budgets are what
// the site scores with room for slower CI runners: at the time of writing the median mobile run scores performance
// 0.90, accessibility 1, best practices 1, SEO 1, with LCP 3.5 s, FCP 1.4 s, TBT 0 ms, CLS 0 and 1.32 MB
// transferred. Performance is held to the median less 0.10, because CI's runners spread
// about 0.09 within one job; LCP to it plus 1.5 s. Accessibility and SEO don't depend on timing, so they stay at 1. Raise the budgets when the site gets
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
      // Assert on each metric's median across the three runs, so one slow run neither fails nor passes the build.
      // ('median-run' picks one representative run instead, and on CI it picked a run where a slow CPU moment
      // pushed blocking time to 618 ms while the other two measured 155 ms and 28 ms.)
      aggregationMethod: 'median',
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 1 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 5000 }],
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
