import { BOOKING_HREF, FEATURED_RELEASE, MEMBERS } from './support/content';
import { escapeRegExp, expect, linksTo, openSite, settle, test } from './support/fixtures';
import { liveSetButton, recordPlayer, sectionFor } from './support/page';

/**
 * At every size (the phone, tablet and desktop projects) the whole page is
 * usable. These tests deliberately say nothing about how it is laid out:
 * only that nothing runs off the side, that what a visitor came for can be
 * seen, and that every control can be pressed without anything covering it.
 */

test.beforeEach(async ({ page }) => {
  await openSite(page);
  // Fonts and lazy images change the page's shape as they arrive; check the page they leave.
  await settle(page);
});

test('the page never scrolls sideways', async ({ page }) => {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), {
      message: 'width beyond the window, in px',
    })
    .toBeLessThanOrEqual(0);
});

test('every link and button can be pressed without anything covering it', async ({ page }) => {
  const controls = page.getByRole('link').or(page.getByRole('button'));
  const count = await controls.count();
  expect(count).toBeGreaterThan(0);
  for (let index = 0; index < count; index++) {
    // Looked up afresh each time, so a control the page re-renders is never checked through a stale handle.
    const control = controls.nth(index);
    await expect(control).toBeVisible();
    // A trial click scrolls the control into view and waits until it is stable, enabled and receives the pointer
    // itself (nothing over it), without pressing it.
    await control.click({ trial: true });
  }
});

test('everything a visitor came for is visible', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('navigation')).toBeVisible();
  await expect(liveSetButton(page)).toBeVisible();
  await expect(recordPlayer(page, FEATURED_RELEASE.title)).toBeVisible();
  for (const hash of ['#music', '#band', '#book']) await expect(sectionFor(page, hash)).toBeVisible();
  const sheet = page.getByRole('heading', { level: 1 });
  for (const member of MEMBERS) {
    const name = page.getByRole('heading', { name: new RegExp(escapeRegExp(member.name)) });
    await expect(name).toBeVisible();
    const column = page.getByRole('article').filter({ has: name }).filter({ hasNot: sheet });
    await expect(column.getByRole('img')).toBeVisible();
    await expect(column.getByRole('paragraph').first()).toBeVisible();
  }
  const [booking] = await linksTo(page, BOOKING_HREF);
  await expect(booking).toBeVisible();
});
