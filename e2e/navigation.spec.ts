import type { Locator, Page } from '@playwright/test';
import { bringIntoView, escapeRegExp, expect, openSite, test } from './support/fixtures';
import { focusedStop, pageTabs, sectionFor, tabStops } from './support/page';

/** Supporting checks: getting around the page with its tabs, links straight to a section, and the keyboard. */

/** The page tabs' destinations, in the order they are listed. */
const tabHashes = (page: Page) => pageTabs(page).evaluateAll(links => links.map(link => link.getAttribute('href')!));

/**
 * A section is where a link lands: the URL carries its hash, and the section
 * (found by its landmark role and name) is on screen. The live set opens the
 * page, so it is on screen at any scroll position and that check cannot fail
 * for it; its hash still is checked.
 */
async function expectLandedOn(page: Page, hash: string) {
  await expect(page).toHaveURL(new RegExp(`${escapeRegExp(hash)}$`));
  await expect(sectionFor(page, hash)).toBeInViewport();
}

/** The first tab stop in or after `section`, in reading order: where the next Tab should go once a visitor has jumped there. */
const firstStopFrom = async (section: Locator, stops: Locator) =>
  section.evaluate(
    (element, candidates) =>
      candidates.findIndex(
        candidate => element === candidate || element.contains(candidate) || Boolean(element.compareDocumentPosition(candidate) & Node.DOCUMENT_POSITION_FOLLOWING),
      ),
    await stops.elementHandles(),
  );

test('each tab at the top takes a visitor to its section and the keyboard carries on from there', async ({ page }) => {
  await openSite(page);
  const hashes = await tabHashes(page);
  expect(hashes.length).toBeGreaterThan(0);
  const stops = tabStops(page);

  for (const [index, hash] of hashes.entries()) {
    await test.step(hash, async () => {
      expect(hash, 'a tab links within the page').toMatch(/^#\S+$/);
      const tab = pageTabs(page).nth(index);
      await expect(tab).toHaveAccessibleName(/\S/);

      await bringIntoView(tab);
      await tab.click();
      await expectLandedOn(page, hash);

      // The next Tab continues from the section the visitor jumped to, not from the tabs.
      const expected = await firstStopFrom(sectionFor(page, hash), stops);
      expect(expected, `there is something to tab to from ${hash}`).toBeGreaterThanOrEqual(0);
      await page.keyboard.press('Tab');
      await expect(stops.nth(expected)).toBeFocused();
    });
  }
});

test('a link straight to a section opens the page at that section', async ({ page, context }) => {
  // The sections are rendered by React after the browser has looked for the fragment, so the site lands on it itself.
  await openSite(page);
  for (const hash of await tabHashes(page)) {
    await test.step(hash, async () => {
      // A cold load in a new tab, as when a visitor follows a shared link, not a hash change on a loaded page.
      const fresh = await context.newPage();
      await fresh.goto(`./${hash}`);
      await expectLandedOn(fresh, hash);
      await fresh.close();
    });
  }
});

test('an old press-kit.html link to a section opens the page at that section, the keyboard carrying on from there', async ({ page }) => {
  await page.goto('./press-kit.html#music');
  await expectLandedOn(page, '#music');

  const stops = tabStops(page);
  const expected = await firstStopFrom(sectionFor(page, '#music'), stops);
  expect(expected, 'there is something to tab to from #music').toBeGreaterThanOrEqual(0);
  await page.keyboard.press('Tab');
  await expect(stops.nth(expected)).toBeFocused();
});

test('Tab visits every link and button in reading order, each on screen as it takes focus', async ({ page }) => {
  await openSite(page);
  const stops = tabStops(page);
  const count = await stops.count();
  expect(count).toBeGreaterThan(0);

  // Tab through the whole page once: a few dozen presses, capped so a focus trap cannot run on.
  const visited: number[] = [];
  for (let presses = 0; presses < count + 5; presses++) {
    await page.keyboard.press('Tab');
    const index = await focusedStop(stops);
    if (index === -1 || (visited.length > 0 && index === visited[0])) break; // focus has left the page, or come round again
    visited.push(index);
    const stop = stops.nth(index);
    await expect(stop).toBeFocused();
    // Even under a sticky bar, whatever has focus is on screen.
    await expect(stop).toBeInViewport();
  }

  // Every stop, once each, in reading order; a skip link or anything else would simply be among them.
  expect(visited).toEqual([...Array(count).keys()]);
});
