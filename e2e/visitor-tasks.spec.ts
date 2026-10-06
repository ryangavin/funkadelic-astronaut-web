import {
  BANDCAMP_HREF,
  BOOKING_HREF,
  EARLIER_RELEASES,
  FEATURED_RELEASE,
  LISTEN_HREFS,
  liveSetVideoName,
  MEMBERS,
  SOCIAL_HREFS,
} from './support/content';
import { escapeRegExp, expect, linksTo, openSite, test } from './support/fixtures';
import type { Page } from '@playwright/test';

/** The things a promoter or fan comes to the press kit to do. */

test.beforeEach(async ({ page }) => {
  await openSite(page);
});

test('a visitor can read a bio for every member', async ({ page }) => {
  // The sheet itself is an article holding everything; each member is an article inside it, without the page's h1.
  const sheet = page.getByRole('heading', { level: 1 });
  for (const member of MEMBERS) {
    const name = page.getByRole('heading', { name: new RegExp(escapeRegExp(member.name)) });
    await expect(name).toBeVisible();
    const column = page.getByRole('article').filter({ has: name }).filter({ hasNot: sheet });
    await expect(column.getByRole('img')).toBeVisible();
    await expect(column.getByRole('paragraph').first()).toBeVisible();
    await expect(column.getByRole('paragraph').first()).toHaveText(/\S/);
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
    await record.click();
    await expect(record).toHaveAttribute('aria-pressed', 'true');
    const player = page.getByTitle(new RegExp(escapeRegExp(release.title)));
    await expect(player).toHaveAttribute('src', new RegExp(`/album=${release.albumId}/`));
    await expect(player).toBeInViewport();
  }
  await expect(page.getByRole('button', { name: new RegExp(escapeRegExp(FEATURED_RELEASE.title)) })).toHaveAttribute('aria-pressed', 'false');
});

/** The live set is the page's one figure; the player that replaces its button is named for the set. */
const liveSet = (page: Page) => page.getByRole('figure');
const livePlayer = (page: Page) => liveSet(page).getByLabel(/\S/).or(liveSet(page).getByTitle(/\S/));

async function expectWholeSetPlaying(page: Page) {
  const player = livePlayer(page);
  await expect(player).toBeVisible();
  await expect(player).toBeFocused();
  await expect(player).toHaveAttribute('src', new RegExp(`${escapeRegExp(liveSetVideoName())}[^/]*$`));
  await expect.poll(() => player.evaluate(video => !(video as HTMLVideoElement).paused)).toBe(true);
}

test('a visitor can watch the live set by pressing its play button', async ({ page }) => {
  const start = liveSet(page).getByRole('button');
  await expect(start).toBeVisible();
  await expect(livePlayer(page)).toHaveCount(0);
  await start.click();
  await expect(start).toBeHidden();
  await expectWholeSetPlaying(page);
});

test('a keyboard user can watch the live set by pressing Enter', async ({ page }) => {
  const start = liveSet(page).getByRole('button');
  await start.focus();
  await page.keyboard.press('Enter');
  await expectWholeSetPlaying(page);
});

test('a visitor can contact the band for booking', async ({ page }) => {
  const [booking, ...others] = await linksTo(page, BOOKING_HREF);
  expect(others, 'one booking link').toEqual([]);
  expect(booking, 'a booking link to the band').toBeDefined();
  await booking.scrollIntoViewIfNeeded();
  await expect(booking).toBeVisible();
  await expect(booking).toHaveAccessibleName(/\S/);
  // A mailto link is handed to the visitor's mail app, so it is checked by destination, not followed.
  await expect(booking).toHaveAttribute('href', /^mailto:[^?]+@[^?]+\?subject=\S/);
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
