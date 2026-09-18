import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// PREVIEW_URL=http://127.0.0.1:4175 node tests/room-material-origin.browser.mjs
assert.ok(process.env.PREVIEW_URL, 'Set PREVIEW_URL to the assignment-owned unified preview');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 650 } });
  await page.goto(`${process.env.PREVIEW_URL}/storybook/iframe.html?id=debug-room-materials--stable-coverage&viewMode=story`);
  const preview = page.locator('[data-material-preview]');
  await preview.locator('.floor__course').first().waitFor();
  const landmarks = () => preview.evaluate(root => [...root.querySelectorAll('.wall__brick, .floor__butt')].map(element => {
    const box = element.getBoundingClientRect();
    const floor = element.closest('.floor__course');
    return { id: floor ? `floor:${floor.getAttribute('data-course')}:${element.getAttribute('data-material-x')}` : `wall:${element.getAttribute('data-material-cell')}`, x: box.x, y: box.y, style: floor ? floor.querySelector('.floor__bands').getAttribute('style') : `${element.getAttribute('data-tone')}:${element.style.getPropertyValue('--wall-worn')}` };
  }).filter(item => item.x > 20 && item.x < 780 && item.y > 20 && item.y < 450));
  const before = await landmarks();
  const baseline = await preview.screenshot();
  assert.ok(before.some(item => item.id.startsWith('floor:')) && before.some(item => item.id.startsWith('wall:')));
  await page.getByRole('button', { name: 'Toggle coverage' }).click();
  const enlarged = await preview.screenshot();
  const after = new Map((await landmarks()).map(item => [item.id, item]));
  for (const original of before) {
    const current = after.get(original.id);
    assert.ok(current, `${original.id} remains present`);
    assert.ok(Math.abs(original.x - current.x) < 0.15 && Math.abs(original.y - current.y) < 0.15, `${original.id} remains at its physical point`);
    assert.equal(current.style, original.style, `${original.id} retains its texture/wear`);
  }
  const difference = await page.evaluate(async ([a, b]) => {
    async function pixels(data) {
      const image = new Image(); image.src = `data:image/png;base64,${data}`; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
      return context.getImageData(0, 0, canvas.width, canvas.height).data;
    }
    const first = await pixels(a), second = await pixels(b);
    let total = 0, changed = 0;
    for (let index = 0; index < first.length; index++) if (index % 4 !== 3) {
      const delta = Math.abs(first[index] - second[index]); total += delta; if (delta > 8) changed++;
    }
    return { mean: total / (first.length * .75), changed: changed / (first.length * .75) };
  }, [baseline.toString('base64'), enlarged.toString('base64')]);
  // Fractional CSS rasterization can move an antialiased edge by a subpixel.
  assert.ok(difference.mean < 1.5 && difference.changed < .04, JSON.stringify(difference));
  await page.getByRole('button', { name: 'Toggle coverage' }).click();
  assert.deepEqual(await landmarks(), before, 'Contracting coverage restores identical world landmarks');
  console.log(`PASS fixed camera: ${before.length} stable material landmarks; pixel difference ${difference.mean.toFixed(3)}/255`);

  await page.goto(`${process.env.PREVIEW_URL}/storybook/iframe.html?id=debug-scale-bench--physical-setup&viewMode=story`);
  await page.locator('.floor__course').first().waitFor();
  const identity = () => page.locator('.wall__brick').evaluateAll(elements => Object.fromEntries(elements.map(element => [element.getAttribute('data-material-cell'), `${element.getAttribute('data-tone')}:${element.style.getPropertyValue('--wall-worn')}`])));
  const originalCells = await identity();
  const originalOrigin = await page.locator('.wall').getAttribute('data-material-origin');
  await page.getByRole('spinbutton', { name: 'Eye height (mm)', exact: true }).fill('2200');
  await page.getByRole('spinbutton', { name: 'Eye height (mm)', exact: true }).blur();
  await page.setViewportSize({ width: 1100, height: 700 });
  const changedCells = await identity();
  assert.notEqual(await page.locator('.wall').getAttribute('data-material-origin'), originalOrigin, 'Camera change exercised a different coverage crop');
  const shared = Object.keys(originalCells).filter(key => key in changedCells);
  assert.ok(shared.length > 10);
  for (const key of shared) assert.equal(changedCells[key], originalCells[key]);
  assert.ok(await page.locator('.floor__course').count() <= 128, 'The floor course budget is retained');
  console.log(`PASS eye/viewport changes retain ${shared.length} common wall cells and bounded floor courses`);
} finally { await browser.close(); }
