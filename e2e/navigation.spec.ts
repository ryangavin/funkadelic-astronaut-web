import type { Locator, Page } from '@playwright/test';
import { BOOKING_HREF } from './support/content';
import { bringIntoView, escapeRegExp, expect, openSite, test } from './support/fixtures';

/** Getting around the page: the tabs at the top, links straight to a section, and the keyboard. */

/**
 * The element the URL's `#fragment` points at. `:target` is the browser's own
 * answer to "where did this link take me"; there is no role-based handle for it.
 */
const target = (page: Page) => page.locator(':target');

/** The in-page tabs' destinations, in the order they are listed. */
const tabHashes = (page: Page) => page.getByRole('navigation').getByRole('link').evaluateAll(links => links.map(link => link.getAttribute('href')!));

/** Whether keyboard focus is now on `section` or somewhere after it in reading order. */
const focusIsAtOrAfter = (section: Locator) =>
  section.evaluate(element => {
    const focused = document.activeElement;
    if (!focused || focused === document.body) return false;
    return element === focused || element.contains(focused) || Boolean(element.compareDocumentPosition(focused) & Node.DOCUMENT_POSITION_FOLLOWING);
  });

/**
 * A section is where a link lands: it is the `:target`, it has an accessible
 * name, and it is on screen. The live set opens the page, so it is on screen
 * at any scroll position and that last check cannot fail for it; its hash and
 * `:target` are still checked.
 */
async function expectLandedOn(page: Page, hash: string, section: Locator = target(page)) {
  await expect(page).toHaveURL(new RegExp(`${escapeRegExp(hash)}$`));
  await expect(section).toHaveCount(1);
  await expect(section).toHaveAccessibleName(/\S/);
  await expect(section).toBeInViewport();
}

/**
 * The section a cold-loaded `#fragment` names. `:target` cannot be used here:
 * the browser resolves it while parsing the HTML, before React has rendered
 * the section, and never sets it afterwards (it still scrolls to it). So the
 * section is found by the id the URL names, with Playwright's `id=` engine.
 */
const namedSection = (page: Page, hash: string) => page.locator(`id=${hash.slice(1)}`);

test('each tab at the top takes a visitor to its section and the keyboard carries on from there', async ({ page }) => {
  await openSite(page);
  const hashes = await tabHashes(page);
  expect(hashes.length).toBeGreaterThan(0);

  for (const [index, hash] of hashes.entries()) {
    await test.step(hash, async () => {
      expect(hash, 'a tab links within the page').toMatch(/^#\S+$/);
      const tab = page.getByRole('navigation').getByRole('link').nth(index);
      await expect(tab).toHaveAccessibleName(/\S/);

      await bringIntoView(tab);
      await tab.click();
      await expectLandedOn(page, hash);

      // The next Tab continues from the section the visitor jumped to, not from the tabs.
      await page.keyboard.press('Tab');
      await expect.poll(() => focusIsAtOrAfter(target(page)), `Tab after ${hash} lands in or after it`).toBe(true);
    });
  }
});

test('a link straight to a section opens the page at that section', async ({ page, context }) => {
  // Known site bug: a cold load of /#music or /#band stays at the top. The browser looks for the fragment while
  // parsing the HTML, before React has rendered the sections, and does not scroll once they appear. The old
  // press-kit.html and classic.html redirects carry the hash over, so they land at the top too. Remove this line
  // when the site scrolls to the fragment after its first render; Playwright then reports the test as passing unexpectedly.
  test.fail(true, 'cold-loaded #section links do not scroll to the section');
  await openSite(page);
  for (const hash of await tabHashes(page)) {
    await test.step(hash, async () => {
      // A cold load in a new tab, as when a visitor follows a shared link, not a hash change on a loaded page.
      const fresh = await context.newPage();
      await fresh.goto(`./${hash}`);
      await expectLandedOn(fresh, hash, namedSection(fresh, hash));
      await fresh.close();
    });
  }
});

/** What has keyboard focus, told apart by what matters to a visitor. */
const focusedStop = (page: Page) =>
  page.evaluate(() => {
    const element = document.activeElement;
    if (!element || element === document.body) return null;
    if (element.tagName === 'IFRAME') return 'embedded player';
    if (element.hasAttribute('href')) return element.getAttribute('href')!;
    if (element.hasAttribute('aria-pressed')) return 'record';
    return 'other';
  });

/**
 * The element holding keyboard focus in the page itself. There is no
 * role-based handle for "whatever is focused", so this is a CSS pseudo-class.
 */
const focused = (page: Page) => page.locator(':focus');

test('Tab reaches the tabs, the live set, the music and booking in reading order, each in view', async ({ page }) => {
  await openSite(page);
  const hashes = await tabHashes(page);
  const liveButton = page.getByRole('figure').getByRole('button');

  // Tab through the whole page once. The page has a few dozen stops; the cap only stops a focus trap running on.
  const stops: string[] = [];
  for (let presses = 0; presses < 60; presses++) {
    await page.keyboard.press('Tab');
    let stop = await focusedStop(page);
    if (stop === null || stop === stops[0]) break; // focus has left the page, or come round again
    if (stop === 'other' && (await liveButton.evaluate(button => button === document.activeElement))) stop = 'live set';
    stops.push(stop);
    // Focus inside an embedded player is the player's own; everything else must be on screen, even under a sticky bar.
    if (stop !== 'embedded player') await expect(focused(page)).toBeInViewport();
  }

  // Whatever comes first (a skip link, say), the tabs come together and in order.
  const firstTab = stops.indexOf(hashes[0]);
  expect(firstTab, 'the first tab is reachable').toBeGreaterThanOrEqual(0);
  expect(stops.slice(firstTab, firstTab + hashes.length), 'the tabs, in order').toEqual(hashes);

  const after = (index: number, match: (stop: string) => boolean) => stops.findIndex((stop, at) => at > index && match(stop));
  const live = after(firstTab + hashes.length - 1, stop => stop === 'live set');
  const platform = after(live, stop => stop.startsWith('https://'));
  const record = after(platform, stop => stop === 'record');
  const booking = after(record, stop => stop === BOOKING_HREF);
  expect(live, 'the live set comes after the tabs').toBeGreaterThan(-1);
  expect(platform, 'the music links come after the live set').toBeGreaterThan(-1);
  expect(record, 'the records come after the music links').toBeGreaterThan(-1);
  expect(booking, 'booking comes after the records').toBeGreaterThan(-1);
});
