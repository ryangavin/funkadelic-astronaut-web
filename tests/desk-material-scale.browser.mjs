import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// PREVIEW_URL=http://127.0.0.1:4177 node tests/desk-material-scale.browser.mjs
assert.ok(process.env.PREVIEW_URL, 'Set PREVIEW_URL to an assignment-owned unified preview');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1152, height: 850 } });
  const compare = async (a, b) => page.evaluate(async ([first, second]) => {
    const width = 576, height = 324;
    async function read(source) {
      const image = new Image(); image.src = `data:image/png;base64,${source}`; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
      const context = canvas.getContext('2d');
      // Suppress subpixel pore aliasing, while preserving the much larger grain landmarks.
      context.filter = 'blur(2px)'; context.drawImage(image, 0, 0, width, height);
      return context.getImageData(0, 0, width, height).data;
    }
    const x = await read(first), y = await read(second);
    let total = 0, changed = 0, samples = 0;
    for (let row = 5; row < height - 5; row++) for (let col = 5; col < width - 5; col++) for (let channel = 0; channel < 3; channel++) {
      const index = (row * width + col) * 4 + channel, difference = Math.abs(x[index] - y[index]);
      total += difference; if (difference > 3) changed++; samples++;
    }
    return { mean: total / samples, changed: changed / samples };
  }, [a.toString('base64'), b.toString('base64')]);
  const stable = (result, label) => {
    assert.ok(result.mean < .9 && result.changed < .02, `${label}: ${JSON.stringify(result)}`);
    console.log(`PASS ${label}: mean ${result.mean.toFixed(3)}/255, ${(result.changed * 100).toFixed(2)}% samples differ >3`);
  };
  await page.goto(`${process.env.PREVIEW_URL}/storybook/iframe.html?id=foundations-layout-desk--bare&viewMode=story`);
  await page.locator('.desk__grain').waitFor();
  const large = await page.locator('.desk__top').screenshot();
  await page.setViewportSize({ width: 576, height: 850 });
  const small = await page.locator('.desk__top').screenshot();
  stable(await compare(large, small), 'Responsive display scale 1152→576');
  assert.equal(await page.locator('.desk__pores').getAttribute('viewBox'), '0 0 1440 810');

  await page.setViewportSize({ width: 1000, height: 800 });
  await page.goto(`${process.env.PREVIEW_URL}/storybook/iframe.html?id=debug-scale-bench--physical-setup&viewMode=story`);
  await page.locator('.desk__grain').waitFor();
  const textureState = () => page.locator('.desk').evaluate(root => ({
    grain: root.querySelector('.desk__grain').getAttribute('viewBox'), pores: root.querySelector('.desk__pores').getAttribute('viewBox'),
    noise: [...root.querySelectorAll('feTurbulence')].map(element => element.outerHTML),
  }));
  const originalState = await textureState();
  // Read the actual camera-dependent layout scale, then inspect the same desktop
  // face-on at that scale. Perspective itself legitimately changes screen pixels.
  const sample = async () => {
    const width = await page.locator('.room .desk').evaluate(root => {
      const width = parseFloat(getComputedStyle(root).width);
      const clone = root.cloneNode(true); clone.id = 'material-sample';
      Object.assign(clone.style, { position: 'fixed', left: '0px', top: '0px', width: `${width}px`, zIndex: '2147483647' });
      clone.querySelector('.desk__things').remove();
      document.body.append(clone); return width;
    });
    const image = await page.locator('#material-sample .desk__top').screenshot();
    await page.locator('#material-sample').evaluate(element => element.remove());
    return { image, width };
  };
  const before = await sample();
  await page.getByRole('spinbutton', { name: 'Desk height (mm)', exact: true }).fill('1100');
  await page.getByRole('spinbutton', { name: 'Desk height (mm)', exact: true }).blur();
  const after = await sample();
  assert.ok(Math.abs(before.width - after.width) > 10, 'Desk height changes exercised a different camera-dependent display scale');
  assert.deepEqual(await textureState(), originalState, 'Desk height retains grain and pore coordinates/seeds');
  stable(await compare(before.image, after.image), `Desk height 750→1100mm (display ${before.width.toFixed(1)}→${after.width.toFixed(1)}px)`);
} finally { await browser.close(); }
