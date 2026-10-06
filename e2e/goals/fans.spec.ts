import { BANDCAMP_HREF, LISTEN_HREFS, SOCIAL_HREFS } from '../support/content';
import { openSite, test } from '../support/fixtures';
import { expectEachOpensInNewTab } from '../support/links';

/** What the press kit must do for a fan: find the band elsewhere, buy or stream the music, and catch a show. */

test.beforeEach(async ({ page }) => {
  await openSite(page);
});

test.describe('A prospective fan', () => {
  test('can find the band on every social profile, each opening in a new tab', async ({ page, context }) => {
    await expectEachOpensInNewTab(page, context, SOCIAL_HREFS);
  });

  test('can buy the music on Bandcamp or stream it on every service, each opening in a new tab', async ({ page, context }) => {
    await expectEachOpensInNewTab(page, context, [BANDCAMP_HREF, ...LISTEN_HREFS]);
  });

  test("can find the band's live dates on Bandsintown", async ({ page, context }) => {
    // src/content/links.ts lists Bandsintown as where the band's dates are listed.
    await expectEachOpensInNewTab(
      page,
      context,
      SOCIAL_HREFS.filter(link => link.platform === 'bandsintown'),
    );
  });

  test.fixme('can see upcoming shows on the page itself', async () => {
    // Gap: src/content has no upcoming shows (dates or venues). src/content/stages.ts lists bands the band has
    // shared bills with, which the booking-agent goals check; live dates are only reachable through Bandsintown.
  });
});
