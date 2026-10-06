import type { Page } from '@playwright/test';
import catalogue from '@content/locales/en.json';
import { BAND_NAME, BOOKING_HREF, BOOKING_LABEL, MEMBERS, SOCIAL_HREFS } from './support/content';
import { escapeRegExp, expect, expectPlaying, linksTo, openSite, test } from './support/fixtures';
import { heroLoop, liveSetButton, sectionFor } from './support/page';

/**
 * Supporting checks: the page arrives already written (the build pre-renders
 * it), so it is all there before, and without, any JavaScript, and the
 * JavaScript then takes it over without a hitch.
 */

const exactly = (text: string) => new RegExp(`^\\s*${escapeRegExp(text)}\\s*$`, 'i');

/** A member's column in the band section: the article headed with their name. */
const column = (page: Page, name: string) =>
  sectionFor(page, '#band')
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: new RegExp(escapeRegExp(name)) }) });

/**
 * A cold load of a link straight to the music, as when a visitor follows a shared link: it opens at the music, and
 * once everything has loaded and the web fonts are in (which can move the page under it), the music is still the
 * section at the top: its heading on screen, the page heading above it scrolled away.
 */
async function expectDeepLinkLands(page: Page) {
  await page.goto('./#music');
  await expect(page).toHaveURL(/#music$/);
  const music = sectionFor(page, '#music');
  await expect(music).toBeInViewport();

  await expect
    .poll(() => page.evaluate(async () => document.readyState === 'complete' && (await document.fonts.ready).status === 'loaded'), {
      message: 'the page has loaded and its fonts are in',
    })
    .toBe(true);
  await expect(music.getByRole('heading').first()).toBeInViewport();
  await expect(page.getByRole('heading', { level: 1, name: exactly(BAND_NAME) })).not.toBeInViewport();
}

test.describe('Without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('a visitor still gets the whole press kit: the band, who is in it, how to book them and where to follow them', async ({ page }) => {
    await openSite(page);
    await expect(page.getByRole('heading', { level: 1, name: exactly(BAND_NAME) })).toBeVisible();

    for (const member of MEMBERS) {
      await test.step(member.name, async () => {
        const own = column(page, member.name);
        await expect(own.getByRole('heading', { name: new RegExp(escapeRegExp(member.name)) })).toBeVisible();
        await expect(own.getByRole('paragraph').first()).toHaveText(/\S/);
      });
    }

    const booking = page.getByRole('link', { name: exactly(BOOKING_LABEL) });
    await expect(booking).toBeVisible();
    await expect(booking).toHaveAttribute('href', BOOKING_HREF);

    for (const { platform, href } of SOCIAL_HREFS) {
      const links = await linksTo(page, href);
      expect(links.length, `a link to ${platform}`).toBeGreaterThan(0);
      for (const link of links) await expect(link).toBeVisible();
    }
  });

  test('a link straight to a section opens at that section', async ({ page }) => {
    await expectDeepLinkLands(page);
  });
});

test.describe('With JavaScript', () => {
  // The fixture fails a test on any console error, and the site logs every hydration mismatch as one.
  test.describe('the page comes alive with no hydration errors when the visitor is happy with motion', () => {
    test.use({ reducedMotion: 'no-preference' });

    test('and the live set starts looping', async ({ page }) => {
      await openSite(page);
      await expectPlaying(heroLoop(page));
    });
  });

  test.describe('the page comes alive with no hydration errors when the visitor asks for reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('and the live set offers its still, to play on request', async ({ page }) => {
      await openSite(page);
      await expect(liveSetButton(page)).toHaveAccessibleName(new RegExp(`^\\s*${escapeRegExp(catalogue.pressKit.live.play)}\\b`, 'i'));
      await expect(heroLoop(page)).toHaveCount(0);
    });
  });

  test('a link straight to a section opens at that section', async ({ page }) => {
    await expectDeepLinkLands(page);
  });
});
