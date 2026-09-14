const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('app.js', 'utf8').split('// Source-space face coordinates')[1].split('// One manually selected introduction;')[0];
test('member photos retain source focal points without full-bleed inline geometry', () => {
  const frame = { clientWidth: 730, clientHeight: 550 };
  const events = {};
  const photo = { naturalWidth: 1500, naturalHeight: 999, src: 'assets/band-22.webp', style: {}, closest: () => frame, addEventListener: (name, fn) => events[name] = fn };
  vm.runInNewContext('// Source-space face coordinates' + source, {
    document: { querySelector: () => photo }
  });
  assert.equal(photo.style.objectPosition, '66% 15%');
  assert.deepEqual([photo.style.width,photo.style.height,photo.style.left,photo.style.top],['','','','']);
  for (const width of [320, 390, 760, 761, 1024, 1440]) {
    frame.clientWidth = width; frame.clientHeight = width <= 760 ? 500 * width / 390 : 760 * width / 1440;
    for (const [src,position] of [['band-13.webp','33.5% 24%'], ['band-21.webp','21% 33%'], ['band-22.webp','66% 15%']]) {
      photo.src = 'assets/' + src; events.load(); assert.equal(photo.style.objectPosition,position);
      assert.deepEqual([photo.style.width,photo.style.height,photo.style.left,photo.style.top],['','','','']);
    }
  }
  assert.match(fs.readFileSync('styles/sections.css','utf8'),/aspect-ratio:\s*1500 \/ 999/);
});
