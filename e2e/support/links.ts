import type { BrowserContext, Page } from '@playwright/test';
import { bringIntoView, expect, linksTo, test } from './fixtures';

/**
 * Opens every link in `links` the way a visitor would and checks it: each
 * link to that destination has a name, opens in a new tab that cannot reach
 * back into the press kit, and the tab opens at the destination (stubbed, so
 * nothing leaves the machine).
 */
export async function expectEachOpensInNewTab(page: Page, context: BrowserContext, links: readonly { platform: string; href: string }[]) {
  for (const { platform, href } of links) {
    await test.step(platform, async () => {
      const found = await linksTo(page, href);
      expect(found.length, `a link to ${href}`).toBeGreaterThan(0);
      for (const link of found) {
        await expect(link).toHaveAccessibleName(/\S/);
        await expect(link).toHaveAttribute('target', '_blank');
        await expect(link).toHaveAttribute('rel', /\bnoopener\b|\bnoreferrer\b/);
      }
      await bringIntoView(found[0]);
      const opened = context.waitForEvent('page');
      await found[0].click();
      const tab = await opened;
      await expect(tab).toHaveURL(href);
      await tab.close();
      await expect(page).toHaveURL(/\/$/);
    });
  }
}
