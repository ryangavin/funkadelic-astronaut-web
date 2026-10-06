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
          // A video element cancels its own range requests when it seeks, buffers ahead or is unmounted (the hero
          // loop gives way to the whole set). Chromium reports only that cancellation as ERR_ABORTED; a response
          // the server cuts short fails with a different code (ERR_CONTENT_LENGTH_MISMATCH, ERR_INCOMPLETE_CHUNKED_ENCODING,
          // ERR_CONNECTION_RESET) and is still caught, as is any aborted request that was not a media range request.
          const cancelledRange =
            request.resourceType() === 'media' && 'range' in request.headers() && request.failure()?.errorText === 'net::ERR_ABORTED';
          if (cancelledRange) return;
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

/**
 * Waits until the page has finished changing shape: everything it loads up
 * front has loaded, its web fonts are in, and every lazy image has been
 * brought into view once and has loaded. Then it goes back to the top.
 */
export async function settle(page: Page) {
  await page.waitForLoadState('load');
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const image of [...document.images]) {
      image.scrollIntoView({ block: 'center' });
      await new Promise(requestAnimationFrame);
    }
  });
  await expect
    .poll(() => page.evaluate(() => [...document.images].every(image => image.complete)), { message: 'every image has loaded' })
    .toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
}

/**
 * Scrolls `target` into view and waits until the page has stopped moving
 * under it, as a visitor would before tapping. Two things move the page
 * after a scroll: the site's own smooth scroll (pressing a record brings the
 * player back into view), and Chrome itself, which routes a click by hit-test
 * data a frame behind a long programmatic jump. Without this, a click
 * straight after Playwright's scroll can land on whatever used to be there.
 */
export async function bringIntoView(target: Locator) {
  let previous: string | undefined;
  await expect
    .poll(
      async () => {
        await target.scrollIntoViewIfNeeded();
        const box = JSON.stringify(await target.boundingBox());
        const still = box === previous;
        previous = box;
        return still;
      },
      { message: 'the page has stopped moving' },
    )
    .toBe(true);
  await expect(target).toBeInViewport();
}

/** HTMLMediaElement.HAVE_FUTURE_DATA: enough is decoded to play on from here. */
const HAVE_FUTURE_DATA = 3;

/** Asserts that a video is really playing: it has decoded data to play and its playhead moves. */
export async function expectPlaying(video: Locator) {
  const state = () => video.evaluate((element: HTMLVideoElement) => ({ readyState: element.readyState, time: element.currentTime }));
  await expect.poll(async () => (await state()).readyState, { message: 'the video has decoded data to play' }).toBeGreaterThanOrEqual(HAVE_FUTURE_DATA);
  const start = (await state()).time;
  await expect.poll(async () => (await state()).time, { message: 'the playhead moves' }).toBeGreaterThan(start);
}
