import type { APIRequestContext, Page } from '@playwright/test';
import { BAND_NAME, EARLIER_RELEASES, FEATURED_RELEASE, MEMBERS, memberPart } from '../support/content';
import { bringIntoView, escapeRegExp, expect, expectPlaying, linksTo, openSite, test } from '../support/fixtures';
import { heroLoop, livePlayer, liveSetButton, recordPlayer, sectionFor } from '../support/page';

/**
 * What the press kit must do for anyone who opens it: say whose it is, let
 * them hear and see the band, and tell them who the band are.
 */

// The live set greets visitors with a moving loop unless they ask for less motion; these tests expect the loop.
test.use({ reducedMotion: 'no-preference' });

test.beforeEach(async ({ page }) => {
  await openSite(page);
});

const exactly = (text: string) => new RegExp(`^\\s*${escapeRegExp(text)}\\s*$`, 'i');

test.describe('Anyone landing on the page', () => {
  test('sees the band name first, on the first screen, without scrolling', async ({ page }) => {
    const nameplate = page.getByRole('heading', { level: 1, name: exactly(BAND_NAME) });
    await expect(nameplate).toBeVisible();
    await expect(page.getByRole('heading').first()).toHaveAccessibleName(exactly(BAND_NAME));
    expect(await page.evaluate(() => window.scrollY), 'the page has not scrolled').toBe(0);
    await expect(nameplate).toBeInViewport();
  });

  test.fixme('can tell what kind of band this is from the first screen', async () => {
    // Gap: the genre ("future rock") is only free text in the copy catalogue (inside the dateline and as a
    // section heading), not band data in src/content, so there is no identity to look for.
  });
});

test.describe('Anyone who wants to hear the band', () => {
  test('finds the record player one tab away, loaded with the new record and ready to play', async ({ page }) => {
    // The page's tab to its music: the one link to #music.
    const [listen] = await linksTo(page, '#music');
    await expect(listen).toBeInViewport();
    await listen.click();

    const player = recordPlayer(page, FEATURED_RELEASE.title);
    await expect(player).toBeInViewport();
    await expect(player).toHaveAttribute('src', new RegExp(`^https://bandcamp\\.com/EmbeddedPlayer/album=${FEATURED_RELEASE.albumId}/`));
    await expect(sectionFor(page, '#music')).toBeInViewport();
    await expect(page.getByRole('button', { name: new RegExp(escapeRegExp(FEATURED_RELEASE.title)) })).toHaveAttribute('aria-pressed', 'true');
  });

  test('can put any earlier record in the player with one press', async ({ page }) => {
    for (const release of EARLIER_RELEASES) {
      const record = page.getByRole('button', { name: new RegExp(escapeRegExp(release.title)) });
      await bringIntoView(record);
      await record.click();
      await expect(record).toHaveAttribute('aria-pressed', 'true');
      const player = recordPlayer(page, release.title);
      await expect(player).toHaveAttribute('src', new RegExp(`/album=${release.albumId}/`));
      // On a phone the list is below the player; pressing a record brings the player back into view.
      await expect(player).toBeInViewport();
    }
    await expect(page.getByRole('button', { name: new RegExp(escapeRegExp(FEATURED_RELEASE.title)) })).toHaveAttribute('aria-pressed', 'false');
  });
});

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

async function expectOnePressPlaysTheSet(page: Page, request: APIRequestContext, baseURL: string, press: () => Promise<void>) {
  await expect(liveSetButton(page)).toBeInViewport();
  // The loop is given its file only once the page has loaded.
  await expect(heroLoop(page)).toHaveAttribute('src', /\S/);
  const loopSrc = (await heroLoop(page).getAttribute('src'))!;
  expect(loopSrc).toBeTruthy();
  await expect(livePlayer(page)).toHaveCount(0);

  await press();

  const player = livePlayer(page);
  await expect(player).toBeVisible();
  await expect(player).toBeFocused();
  await expectWholeSet(request, baseURL, (await player.getAttribute('src'))!, loopSrc);
  await expectPlaying(player);
}

test.describe('Anyone who wants to see the band live', () => {
  test('can watch the live set with one click', async ({ page, request, baseURL }) => {
    await expectOnePressPlaysTheSet(page, request, baseURL!, async () => {
      await liveSetButton(page).click();
      await expect(liveSetButton(page)).toBeHidden();
    });
  });

  test('can watch the live set with one press of Enter', async ({ page, request, baseURL }) => {
    await expectOnePressPlaysTheSet(page, request, baseURL!, async () => {
      await liveSetButton(page).focus();
      await page.keyboard.press('Enter');
    });
  });
});

test.describe('Anyone who wants to learn about the band', () => {
  /** A member's column: the article (inside the page's own article) that their name heads. */
  const column = (page: Page, name: string) =>
    page
      .getByRole('article')
      .filter({ has: page.getByRole('heading', { name: new RegExp(escapeRegExp(name)) }) })
      .filter({ hasNot: page.getByRole('heading', { level: 1 }) });

  test('can see who is in the band, with a photo of each', async ({ page }) => {
    const band = sectionFor(page, '#band');
    for (const member of MEMBERS) {
      await test.step(member.name, async () => {
        await expect(band.getByRole('heading', { name: new RegExp(escapeRegExp(member.name)) })).toBeVisible();
        const portrait = column(page, member.name).getByRole('img', { name: /\S/ });
        await bringIntoView(portrait);
        await expect
          .poll(() => portrait.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth), { message: 'the portrait has loaded' })
          .toBeGreaterThan(0);
      });
    }
  });

  test('can see what each member plays', async ({ page }) => {
    for (const member of MEMBERS) {
      // The part is printed with the name, so the member's heading carries both.
      await expect(page.getByRole('heading', { name: new RegExp(`${escapeRegExp(member.name)}.*${escapeRegExp(memberPart(member.id))}`) })).toBeVisible();
    }
  });

  test('can read a bio for every member', async ({ page }) => {
    for (const member of MEMBERS) {
      const bio = column(page, member.name).getByRole('paragraph').first();
      await expect(bio).toBeVisible();
      await expect(bio).toHaveText(/\S/);
    }
  });

  test.fixme('can see where the band is from', async () => {
    // Gap: the hometown ("New Jersey", "NJ") is only free text in the copy catalogue's dateline and lede, not
    // band data in src/content, so there is no identity to look for.
  });
});
