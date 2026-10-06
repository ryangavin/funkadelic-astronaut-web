import type { Locator, Page } from '@playwright/test';
import { escapeRegExp } from './fixtures';
import { SECTION_NAMES } from './content';

/**
 * The parts of the press kit as a visitor (and their screen reader) meets
 * them: by role and accessible name. Nothing here selects by class, id or
 * structure, with one exception noted on `heroLoop`.
 */

/** A name to match exactly, ignoring case and surrounding space. */
const named = (name: string) => new RegExp(`^\\s*${escapeRegExp(name)}\\s*$`, 'i');

/** The page's tabs to its own sections. */
export const pageTabs = (page: Page) => page.getByRole('navigation').getByRole('link');

/** The live set: the page's one figure, named by its caption. */
export const liveSet = (page: Page) => page.getByRole('figure');

/** The button that starts the whole set. */
export const liveSetButton = (page: Page) => liveSet(page).getByRole('button');

/** The whole set's player, which replaces the button and is named for the set. */
export const livePlayer = (page: Page) => liveSet(page).getByLabel(/\S/);

/**
 * The silent loop the live set opens with. It is decorative and deliberately
 * hidden from assistive technology (`aria-hidden`), so it has no role or name;
 * this is the suite's one structural locator outside the document head.
 */
export const heroLoop = (page: Page) => liveSet(page).locator('video');

/** The section a page tab's `#hash` leads to, found by its landmark role and name. */
export function sectionFor(page: Page, hash: string): Locator {
  const id = hash.replace(/^#/, '');
  if (id === 'live') return liveSet(page);
  if (id in SECTION_NAMES) return page.getByRole('region', { name: named(SECTION_NAMES[id as keyof typeof SECTION_NAMES]) });
  throw new Error(`No section is known for ${hash}; add it to SECTION_NAMES in e2e/support/content.ts`);
}

/** The record player: Bandcamp's embed, named by its title for whichever record is in it. */
export const recordPlayer = (page: Page, title: string) => page.getByTitle(new RegExp(escapeRegExp(title)));

/**
 * Everything the keyboard should stop on, in reading order: the page's links
 * and buttons. The record player's controls belong to Bandcamp; with the
 * player stubbed it has nothing to focus, so Tab passes over it.
 */
export const tabStops = (page: Page) => page.getByRole('link').or(page.getByRole('button'));

/** Where focus is among the tab stops, or -1 when it is on none of them (on the page body, or off the page). */
export const focusedStop = (stops: Locator) => stops.evaluateAll(elements => (elements as Element[]).indexOf(document.activeElement as Element));
