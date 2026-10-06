import { expect, openSite, test } from './support/fixtures';

/**
 * At every size (the phone, tablet and desktop projects) the whole page is
 * usable. These tests deliberately say nothing about how it is laid out:
 * only that nothing runs off the side, and that everything can be seen and
 * pressed once it is scrolled to.
 */

test.beforeEach(async ({ page }) => {
  await openSite(page);
});

test('the page never scrolls sideways', async ({ page }) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, 'width beyond the window, in px').toBeLessThanOrEqual(0);
});

test('every link and button can be scrolled to and pressed without anything covering it', async ({ page }) => {
  const controls = await page.getByRole('link').or(page.getByRole('button')).all();
  expect(controls.length).toBeGreaterThan(0);
  for (const control of controls) {
    await control.scrollIntoViewIfNeeded();
    await expect(control).toBeInViewport();
    // A trial click runs every actionability check, including that this control, not something over it, gets the pointer.
    await control.click({ trial: true });
  }
});

test('every heading, picture and player can be scrolled to and seen', async ({ page }) => {
  const things = await page.getByRole('heading').or(page.getByRole('img')).or(page.getByTitle(/\S/)).all();
  expect(things.length).toBeGreaterThan(0);
  for (const thing of things) {
    await thing.scrollIntoViewIfNeeded();
    await expect(thing).toBeVisible();
    await expect(thing).toBeInViewport();
  }
});
