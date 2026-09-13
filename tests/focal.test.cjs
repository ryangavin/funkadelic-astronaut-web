const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('app.js', 'utf8').split('// Source-space face coordinates')[1].split('// One manually selected introduction;')[0];
test('face positioning covers every edge of the panel and preserves aspect ratio', () => {
  const frame = { clientWidth: 730, clientHeight: 550 };
  const events = {};
  let resize;
  const photo = { naturalWidth: 1500, naturalHeight: 999, src: 'assets/band-22.webp', style: {}, closest: () => frame, addEventListener: (name, fn) => events[name] = fn };
  vm.runInNewContext('// Source-space face coordinates' + source, {
    document: { querySelector: () => photo },
    ResizeObserver: class { constructor(fn) { resize = fn; } observe() {} }
  });
  function check() {
    const w = parseFloat(photo.style.width), h = parseFloat(photo.style.height);
    const x = parseFloat(photo.style.left), y = parseFloat(photo.style.top);
    assert.ok(Math.abs(w / h - photo.naturalWidth / photo.naturalHeight) < .001);
    assert.ok(x <= .01 && y <= .01);
    assert.ok(x + w >= frame.clientWidth - .01);
    assert.ok(y + h >= frame.clientHeight - .01);

  }
  check();
  for (const width of [320, 390, 760, 761, 1024, 1440]) {
    frame.clientWidth = width; frame.clientHeight = width <= 760 ? 500 * width / 390 : 760 * width / 1440; resize(); check();
    for (const src of ['band-13.webp', 'band-21.webp', 'band-22.webp']) { photo.src = 'assets/' + src; events.load(); check(); }
  }
});
