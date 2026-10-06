import type { APIRequestContext, Page } from '@playwright/test';
import { BANDCAMP_HREF, BOOKING_HREF, EARLIER_RELEASES, FEATURED_RELEASE, LISTEN_HREFS, MEMBERS, SOCIAL_HREFS } from './support/content';
import { bringIntoView, escapeRegExp, expect, expectPlaying, linksTo, openSite, test } from './support/fixtures';

/** The things a promoter or fan comes to the press kit to do. */

// The live set greets visitors with a moving loop unless they ask for less motion; these tests expect the loop.
test.use({ reducedMotion: 'no-preference' });

test.beforeEach(async ({ page }) => {
  await openSite(page);
});

test('a visitor can read a bio for every member', async ({ page }) => {
  // The sheet itself is an article holding everything; each member is an article inside it, without the page's h1.
  const sheet = page.getByRole('heading', { level: 1 });
  for (const member of MEMBERS) {
    await test.step(member.name, async () => {
      const name = page.getByRole('heading', { name: new RegExp(escapeRegExp(member.name)) });
      await expect(name).toBeVisible();
      const column = page.getByRole('article').filter({ has: name }).filter({ hasNot: sheet });

      const portrait = column.getByRole('img');
      await portrait.scrollIntoViewIfNeeded();
      await expect(portrait).toBeVisible();
      await expect
        .poll(() => portrait.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth), { message: 'the portrait has loaded' })
        .toBeGreaterThan(0);

      const bio = column.getByRole('paragraph').first();
      await expect(bio).toBeVisible();
      await expect(bio).toHaveText(/\S/);
    });
  }
});

test('a visitor can listen to the new record in the Bandcamp player', async ({ page }) => {
  const player = page.getByTitle(new RegExp(escapeRegExp(FEATURED_RELEASE.title)));
  await expect(player).toHaveAttribute('src', new RegExp(`^https://bandcamp\\.com/EmbeddedPlayer/album=${FEATURED_RELEASE.albumId}/`));
  await player.scrollIntoViewIfNeeded();
  await expect(player).toBeVisible();
  await expect(page.getByRole('button', { name: new RegExp(escapeRegExp(FEATURED_RELEASE.title)) })).toHaveAttribute('aria-pressed', 'true');
});

test('a visitor can put any earlier record in the player', async ({ page }) => {
  for (const release of EARLIER_RELEASES) {
    const record = page.getByRole('button', { name: new RegExp(escapeRegExp(release.title)) });
    await bringIntoView(record);
    await record.click();
    await expect(record).toHaveAttribute('aria-pressed', 'true');
    const player = page.getByTitle(new RegExp(escapeRegExp(release.title)));
    await expect(player).toHaveAttribute('src', new RegExp(`/album=${release.albumId}/`));
    // On a phone the list is below the player; pressing a record brings the player back into view.
    await expect(player).toBeInViewport();
  }
  await expect(page.getByRole('button', { name: new RegExp(escapeRegExp(FEATURED_RELEASE.title)) })).toHaveAttribute('aria-pressed', 'false');
});

/** The live set is the page's one figure. */
const liveSet = (page: Page) => page.getByRole('figure');
/** The whole set's player, which replaces the button and is named for the set. */
const livePlayer = (page: Page) => liveSet(page).getByLabel(/\S/);
/**
 * The silent loop the live set opens with. It is decorative and hidden from
 * assistive technology, so it has no accessible handle and is found as the
 * figure's video element.
 */
const heroLoop = (page: Page) => liveSet(page).locator('video');

/** The whole set is served from the site as an MP4, and is a different file from the loop. */
async function expectWholeSet(request: APIRequestContext, baseURL: string, src: string, loopSrc: string) {
  const url = new URL(src, baseURL);
  expect(url.origin, 'served from the site').toBe(new URL(baseURL).origin);
  expect(url.pathname).toMatch(/\.mp4$/);
  expect(url.href, 'the whole set, not the loop').not.toBe(new URL(loopSrc, baseURL).href);
  const response = await request.fetch(url.href, { method: 'HEAD' });
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toMatch(/^video\//);
}

async function startAndExpectWholeSet(page: Page, request: APIRequestContext, baseURL: string, start: (page: Page) => Promise<void>) {
  const loopSrc = (await heroLoop(page).getAttribute('src'))!;
  expect(loopSrc).toBeTruthy();
  await expect(livePlayer(page)).toHaveCount(0);

  await start(page);

  const player = livePlayer(page);
  await expect(player).toBeVisible();
  await expect(player).toBeFocused();
  await expectWholeSet(request, baseURL, (await player.getAttribute('src'))!, loopSrc);
  await expectPlaying(player);
}

test('a visitor can watch the live set by pressing its play button', async ({ page, request, baseURL }) => {
  await startAndExpectWholeSet(page, request, baseURL!, async () => {
    const start = liveSet(page).getByRole('button');
    await start.click();
    await expect(start).toBeHidden();
  });
});

test('a keyboard user can watch the live set by pressing Enter', async ({ page, request, baseURL }) => {
  await startAndExpectWholeSet(page, request, baseURL!, async () => {
    await liveSet(page).getByRole('button').focus();
    await page.keyboard.press('Enter');
  });
});

test('a visitor can contact the band for booking', async ({ page }) => {
  const booking = await linksTo(page, BOOKING_HREF);
  expect(booking.length, 'a booking link to the band').toBeGreaterThan(0);
  for (const link of booking) {
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeVisible();
    await expect(link).toHaveAccessibleName(/\S/);
    // A mailto link is handed to the visitor's mail app, so it is checked by destination, not followed.
    await expect(link).toHaveAttribute('href', /^mailto:[^?]+@[^?]+\?subject=\S/);
  }
});

const PLATFORMS = [
  { task: "the band's socials", links: SOCIAL_HREFS },
  { task: "the band's music on streaming services", links: [...LISTEN_HREFS, BANDCAMP_HREF] },
];

for (const { task, links } of PLATFORMS) {
  test(`a visitor can open ${task} in a new tab`, async ({ page, context }) => {
    for (const { platform, href } of links) {
      await test.step(platform, async () => {
        const found = await linksTo(page, href);
        expect(found.length, `a link to ${href}`).toBeGreaterThan(0);
        for (const link of found) {
          await expect(link).toHaveAccessibleName(/\S/);
          await expect(link).toHaveAttribute('target', '_blank');
          // The new tab must not be able to reach back into the press kit.
          await expect(link).toHaveAttribute('rel', /\bnoopener\b|\bnoreferrer\b/);
        }
        await bringIntoView(found[0]);
        const opened = context.waitForEvent('page');
        await found[0].click();
        const tab = await opened;
        await expect(tab).toHaveURL(href);
        await tab.close();
        await expect(page).toHaveURL(/\/$/);
      });
    }
  });
}
