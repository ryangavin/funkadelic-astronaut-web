import { BOOKING_HREF, BOOKING_LABEL, SHARED_STAGES } from '../support/content';
import { bringIntoView, escapeRegExp, expect, linksTo, openSite, test } from '../support/fixtures';
import { sectionFor } from '../support/page';

/** What the press kit must do for a promoter or booking agent deciding whether to book the band. */

test.beforeEach(async ({ page }) => {
  await openSite(page);
});

test.describe('A prospective booking agent', () => {
  test('can reach the booking email from the tabs on the first screen', async ({ page }) => {
    // The page's tab to booking: the one link to #book, on screen as the page opens.
    const [bookTab] = await linksTo(page, '#book');
    await expect(bookTab).toBeInViewport();
    await bookTab.click();

    const booking = page.getByRole('link', { name: new RegExp(`^\\s*${escapeRegExp(BOOKING_LABEL)}\\s*$`, 'i') });
    await expect(sectionFor(page, '#book')).toBeInViewport();
    await expect(booking).toBeInViewport();
    await expect(booking).toHaveAttribute('href', BOOKING_HREF);
  });

  test('can send a booking email to the band, with the subject filled in', async ({ page }) => {
    const booking = await linksTo(page, BOOKING_HREF);
    expect(booking.length, 'a booking link to the band').toBeGreaterThan(0);
    for (const link of booking) {
      await bringIntoView(link);
      await expect(link).toHaveAccessibleName(/\S/);
      // A mailto link is handed to the visitor's mail app, so it is checked by destination, not followed.
      await expect(link).toHaveAttribute('href', /^mailto:[^?]+@[^?]+\?subject=\S/);
    }
  });

  test("can judge the band's experience from the bands they have shared stages with", async ({ page }) => {
    for (const band of SHARED_STAGES) {
      await expect(page.getByText(band).first()).toBeVisible();
    }
  });
});
