import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, openSite, test } from './support/fixtures';

/** Accessibility checks that run at every size, and the page for visitors who ask for less motion. */

test('axe finds no serious or critical accessibility violations', async ({ page }) => {
  await openSite(page);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  const blocking = results.violations
    .filter(violation => violation.impact === 'serious' || violation.impact === 'critical')
    .map(violation => ({ rule: violation.id, impact: violation.impact, help: violation.help, where: violation.nodes.map(node => node.target.join(' ')) }));
  expect(blocking).toEqual([]);
});

/** Whether anything on the page is moving: a playing video or a running CSS or Web animation. */
const motion = (page: Page) =>
  page.evaluate(() => ({
    playingVideos: [...document.querySelectorAll('video')].filter(video => !video.paused).length,
    runningAnimations: document.getAnimations().filter(animation => animation.playState === 'running').length,
  }));

test('without a reduced-motion preference the live set greets visitors moving', async ({ page }) => {
  await openSite(page);
  await expect.poll(async () => (await motion(page)).playingVideos).toBeGreaterThan(0);
});

test.describe('with reduced motion requested', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('nothing moves until the visitor asks it to', async ({ page }) => {
    await openSite(page);
    await expect(page.getByRole('figure').getByRole('button')).toBeVisible();
    expect(await motion(page)).toEqual({ playingVideos: 0, runningAnimations: 0 });
  });

  test('a visitor can still watch the live set', async ({ page }) => {
    await openSite(page);
    await page.getByRole('figure').getByRole('button').click();
    await expect.poll(async () => (await motion(page)).playingVideos).toBe(1);
  });
});
