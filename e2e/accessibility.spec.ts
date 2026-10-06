import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, expectPlaying, openSite, test } from './support/fixtures';

/** Accessibility checks that run at every size, and the page for visitors who ask for less motion. */

test('axe finds no serious or critical accessibility violations', async ({ page }) => {
  await openSite(page);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  const blocking = results.violations
    .filter(violation => violation.impact === 'serious' || violation.impact === 'critical')
    .map(violation => ({ rule: violation.id, impact: violation.impact, help: violation.help, where: violation.nodes.map(node => node.target.join(' ')) }));
  expect(blocking).toEqual([]);
});

/** How much on the page is moving: playing videos and running CSS or Web animations. */
const motion = (page: Page) =>
  page.evaluate(() => ({
    playingVideos: [...document.querySelectorAll('video')].filter(video => !video.paused).length,
    runningAnimations: document.getAnimations().filter(animation => animation.playState === 'running').length,
  }));

test.describe('with no motion preference', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('the live set greets visitors with a moving loop', async ({ page }) => {
    await openSite(page);
    // The loop is decorative and hidden from assistive technology, so it has no accessible handle; it is the figure's video.
    await expectPlaying(page.getByRole('figure').locator('video'));
  });
});

test.describe('with reduced motion requested', () => {
  test.use({ reducedMotion: 'reduce' });

  test('nothing moves until the visitor asks it to', async ({ page }) => {
    await openSite(page);
    await expect(page.getByRole('figure').getByRole('button')).toBeVisible();
    // Once everything has loaded (an autoplaying video would have started by then), nothing is moving.
    await page.waitForLoadState('load');
    await expect.poll(() => motion(page)).toEqual({ playingVideos: 0, runningAnimations: 0 });
  });

  test('a visitor can still watch the live set', async ({ page }) => {
    await openSite(page);
    await page.getByRole('figure').getByRole('button').click();
    await expectPlaying(page.getByRole('figure').getByLabel(/\S/));
  });
});
