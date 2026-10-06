import type { Locator, Page } from '@playwright/test';
import { expect, openSite, test } from './support/fixtures';

/** Getting around the page: the tabs at the top, and the keyboard. */

test.beforeEach(async ({ page }) => {
  await openSite(page);
});

/**
 * The element a `#fragment` points at. The fragment is the address a visitor
 * can share and the link declares, so the target is found by that id; a
 * section has no other handle that is not its wording.
 */
const fragmentTarget = (page: Page, hash: string) => page.locator(`[id="${hash.slice(1)}"]`);

/** Whether keyboard focus is now on `target` or somewhere after it in reading order. */
const focusIsAtOrAfter = (target: Locator) =>
  target.evaluate(element => {
    const focused = document.activeElement;
    if (!focused || focused === document.body) return false;
    return element === focused || element.contains(focused) || Boolean(element.compareDocumentPosition(focused) & Node.DOCUMENT_POSITION_FOLLOWING);
  });

test('each tab at the top takes a visitor to its section and the keyboard carries on from there', async ({ page }) => {
  const tabs = page.getByRole('navigation').getByRole('link');
  expect(await tabs.count()).toBeGreaterThan(0);

  for (const tab of await tabs.all()) {
    const hash = (await tab.getAttribute('href'))!;
    await test.step(hash, async () => {
      expect(hash, 'a tab links within the page').toMatch(/^#\S+$/);
      await expect(tab).toHaveAccessibleName(/\S/);
      const target = fragmentTarget(page, hash);
      await expect(target, `${hash} exists`).toHaveCount(1);

      await tab.click();
      await expect(page).toHaveURL(new RegExp(`${hash}$`));
      await expect(target).toBeInViewport();

      // The next Tab continues from the section the visitor jumped to, not from the tabs.
      await page.keyboard.press('Tab');
      await expect.poll(() => focusIsAtOrAfter(target), `Tab after ${hash} lands in or after it`).toBe(true);
    });
  }
});

test('a link straight to a section opens the page at that section', async ({ page }) => {
  for (const tab of await page.getByRole('navigation').getByRole('link').all()) {
    const hash = (await tab.getAttribute('href'))!;
    await page.goto(`./${hash}`);
    await expect(fragmentTarget(page, hash)).toBeInViewport();
  }
});

/**
 * The element holding keyboard focus. There is no role-based handle for
 * "whatever is focused", so this is the one CSS selector the suite uses.
 */
const focused = (page: Page) => page.locator('*:focus');

test('Tab reaches the tabs, the live set, the music and booking in reading order, each in view', async ({ page }) => {
  const tabs = await page.getByRole('navigation').getByRole('link').all();
  for (const tab of tabs) {
    await page.keyboard.press('Tab');
    await expect(tab).toBeFocused();
  }

  await page.keyboard.press('Tab');
  await expect(page.getByRole('figure').getByRole('button')).toBeFocused();

  // From there, keep tabbing to the end of the page: everything that takes focus is on screen when it does.
  const reached: string[] = [];
  for (let presses = 0; presses < 80; presses++) {
    await page.keyboard.press('Tab');
    // Links are told apart by destination, the record buttons by their pressed state.
    const entry = await page.evaluate(() => {
      const element = document.activeElement;
      if (!element || element === document.body) return null;
      return element.getAttribute('href') ?? (element.hasAttribute('aria-pressed') ? 'record' : 'other');
    });
    if (entry === null) break; // focus has left the page
    reached.push(entry);
    // Focus inside an embedded player belongs to the player's own page; everything else must be on screen.
    const current = focused(page);
    if ((await current.count()) === 0) continue;
    await expect(current).toBeVisible();
    await expect(current).toBeInViewport();
  }

  const order = (match: (entry: string) => boolean) => reached.findIndex(match);
  const firstPlatform = order(entry => entry.startsWith('https://'));
  const firstRecord = order(entry => entry === 'record');
  const booking = order(entry => entry.startsWith('mailto:'));
  expect(firstPlatform, 'the music links are reachable').toBeGreaterThanOrEqual(0);
  expect(firstRecord, 'the records are reachable').toBeGreaterThan(firstPlatform);
  expect(booking, 'booking is reachable after the records').toBeGreaterThan(firstRecord);
});
