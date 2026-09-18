import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// Run against an assignment-owned unified preview: PREVIEW_URL=http://127.0.0.1:4176 node tests/room-controls-layout.browser.mjs
const origin = process.env.PREVIEW_URL;
assert.ok(origin, 'Set PREVIEW_URL to the unified preview being tested');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  for (const story of ['debug-scale-bench', 'foundations-room', 'pages-perspective-desk']) {
    for (const viewport of [{ width: 1280, height: 800 }, { width: 1000, height: 600 }, { width: 583, height: 460 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      await page.goto(`${origin}/storybook/iframe.html?id=${story}--physical-setup&viewMode=story`);
      const scene = page.locator('.room-controls__scene .room');
      const sidebar = page.getByRole('complementary', { name: 'Room controls' });
      await scene.waitFor();
      const before = await scene.boundingBox();
      const status = await page.locator('.room__diagnostic[role=status]').boundingBox();
      assert.ok(status.y >= before.y + before.height - 1, 'Camera status is below the scene');
      assert.equal(await page.getByText(/Scale bench · 1 meter/).count(), 0, 'Scale Bench banner is removed');
      const fps = page.getByRole('checkbox', { name: 'Show FPS overlay' });
      assert.equal(await fps.isChecked(), false, 'FPS starts off');
      assert.equal(await page.getByRole('group', { name: 'Animation frame timing' }).count(), 0);
      await fps.check();
      await page.getByRole('group', { name: 'Animation frame timing' }).waitFor();
      await fps.uncheck();
      assert.equal(await page.getByRole('group', { name: 'Animation frame timing' }).count(), 0, 'FPS unmounts when disabled');
      const controls = await sidebar.boundingBox();
      assert.ok(before.width >= (viewport.width > 700 ? 400 : viewport.width > 520 ? 340 : 350), 'Preview remains usefully sized');
      assert.ok(before.y + before.height <= viewport.height + 1, 'Scene fits in the viewport');
      if (viewport.width > 520) assert.ok(controls.x + controls.width <= before.x + 1, 'Desktop controls sit beside the scene');
      else assert.ok(controls.y >= before.y + before.height, 'Narrow controls sit below the scene');
      await sidebar.evaluate(element => { element.scrollTop = element.scrollHeight; });
      assert.ok(await sidebar.evaluate(element => element.scrollTop > 0), 'Controls scroll independently');
      assert.deepEqual(await scene.boundingBox(), before, 'Control scrolling leaves scene fixed');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight + 1), 'No document scrolling needed');
      const width = page.getByRole('spinbutton', { name: 'Desk width (mm)', exact: true });
      await width.fill('3400');
      await width.blur();
      assert.equal(await width.inputValue(), '3400', 'Typed dimensions remain unrestricted');
      assert.equal(await page.getByLabel('Desk width (mm) inches', { exact: true }).textContent(), '133.86 in');
      assert.equal(await page.getByRole('slider', { name: 'Desk width (mm) slider', exact: true }).inputValue(), '3000');
      console.log(`PASS ${story} ${viewport.width}×${viewport.height}`);
    }
  }
} finally {
  await browser.close();
}
