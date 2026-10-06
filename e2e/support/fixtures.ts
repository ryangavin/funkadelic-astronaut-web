import { test as base, expect, type Locator, type Page } from '@playwright/test';

/**
 * Every test gets two automatic fixtures:
 *
 * - `stubThirdParties`: the site never reaches a third party. Any request to
 *   another origin (Bandcamp's player, the platforms the band links to) is
 *   answered here: a page load with a tiny stub page, anything else with 204.
 *   Tests assert what the site asks for (a link's destination, an embed's
 *   src), never what the third party does.
 * - `failOnErrors`: the test fails if the site logs a console error, throws an
 *   uncaught error, or one of its own requests fails or answers 4xx/5xx (so a
 *   missing built asset fails every test that loads the page).
 */
type Fixtures = {
  stubThirdParties: void;
  failOnErrors: void;
};

const STUB_PAGE = '<!doctype html><html lang="en"><head><title>Stub</title></head><body><main><h1>Stubbed third-party page</h1></main></body></html>';

export const test = base.extend<Fixtures>({
  stubThirdParties: [
    async ({ context, baseURL }, use) => {
      const ownOrigin = new URL(baseURL!).origin;
      await context.route(
        url => url.origin !== ownOrigin,
        route => {
          const request = route.request();
          return request.resourceType() === 'document'
            ? route.fulfill({ status: 200, contentType: 'text/html', body: STUB_PAGE })
            : route.fulfill({ status: 204 });
        },
      );
      await use();
    },
    { auto: true },
  ],

  failOnErrors: [
    async ({ context, baseURL }, use) => {
      const ownOrigin = new URL(baseURL!).origin;
      const errors: string[] = [];
      const watch = (page: Page) => {
        page.on('console', message => {
          if (message.type() === 'error') errors.push(`console error: ${message.text()}`);
        });
        page.on('pageerror', error => errors.push(`uncaught error: ${error.message}`));
        page.on('requestfailed', request => {
          if (new URL(request.url()).origin !== ownOrigin) return;
          // A video element cancels its own range requests as it seeks and buffers; that is not a failure.
          if (request.resourceType() === 'media' && request.failure()?.errorText === 'net::ERR_ABORTED') return;
          errors.push(`request failed: ${request.url()} (${request.failure()?.errorText})`);
        });
        page.on('response', response => {
          if (new URL(response.url()).origin === ownOrigin && response.status() >= 400) {
            errors.push(`HTTP ${response.status()}: ${response.url()}`);
          }
        });
      };
      context.pages().forEach(watch);
      context.on('page', watch);
      await use();
      expect(errors, 'the site logged errors or failed to load its own files').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** Escapes text for use inside a RegExp, so content values can be matched as names. */
export const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Every link on the page that goes to `href`. Links are found by role and
 * matched on their destination, which is what identifies them; their wording
 * belongs to the Storybook stories.
 */
export async function linksTo(page: Page, href: string): Promise<Locator[]> {
  const matches: Locator[] = [];
  for (const link of await page.getByRole('link').all()) {
    if ((await link.getAttribute('href')) === href) matches.push(link);
  }
  return matches;
}

/** Opens the site and waits until it has rendered. */
export async function openSite(page: Page, path = './') {
  await page.goto(path);
  await expect(page.getByRole('main')).toBeVisible();
}
