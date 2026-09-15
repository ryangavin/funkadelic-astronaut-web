const { test } = require('node:test');
const assert = require('node:assert/strict');

class Events {
  listeners = new Map();
  addEventListener(name, handler) { const set = this.listeners.get(name) || new Set(); set.add(handler); this.listeners.set(name, set); }
  removeEventListener(name, handler) { this.listeners.get(name)?.delete(handler); }
  emit(name, event = {}) { this.listeners.get(name)?.forEach(handler => handler(event)); }
  count() { return [...this.listeners.values()].reduce((n, set) => n + set.size, 0); }
}
function fixture() {
  const media = Object.assign(new Events(), { matches: false });
  const timers = new Map();
  let serial = 0;
  const doc = Object.assign(new Events(), { hidden: false, defaultView: {
    matchMedia: () => media,
    setInterval: (frame, cadence) => { const id = ++serial; timers.set(id, { frame, cadence }); return id; },
    clearInterval: id => timers.delete(id),
  } });
  const trigger = Object.assign(new Events(), { ownerDocument: doc, focused: false,
    style: { translate: '12px 8px', rotate: '-6deg', transform: 'scale(.8)' },
    matches() { return this.focused; }, querySelector: () => null,
  });
  const layer = { style: { translate: '', rotate: '' } };
  return { media, timers, doc, trigger, layer };
}

test('jitter uses reference cadence, stays bounded, and leaves base transforms untouched', async () => {
  const { attachJitter } = await import('../src/behaviors/Jitter/motion.ts');
  const f = fixture();
  const cleanup = attachJitter(f.trigger, f.layer);
  assert.equal(f.timers.size, 1);
  assert.equal([...f.timers.values()][0].cadence, 150);
  for (let i = 0; i < 100; i++) {
    [...f.timers.values()][0].frame();
    const [x, y] = f.layer.style.translate.split(' ').map(parseFloat);
    assert.ok(Math.abs(x) <= 1.6 && Math.abs(y) <= 2.3);
    assert.ok(Math.abs(parseFloat(f.layer.style.rotate)) <= .7);
  }
  assert.deepEqual(f.trigger.style, { translate: '12px 8px', rotate: '-6deg', transform: 'scale(.8)' });
  cleanup();
  assert.deepEqual(f.layer.style, { translate: '', rotate: '' });
  assert.equal(f.timers.size, 0);
  assert.equal(f.trigger.count() + f.doc.count() + f.media.count(), 0);
});

test('hover/focus activation resets on exit, ignores touch, and keeps independent instances', async () => {
  const { attachJitter } = await import('../src/behaviors/Jitter/motion.ts');
  const a = fixture(), b = fixture();
  const stopA = attachJitter(a.trigger, a.layer, { activation: 'hover-focus', preset: 'print' });
  const stopB = attachJitter(b.trigger, b.layer, { cadenceMs: 240 });
  assert.equal(a.timers.size, 0);
  a.trigger.emit('pointerenter', { pointerType: 'touch' });
  assert.equal(a.timers.size, 0);
  a.trigger.emit('pointerenter', { pointerType: 'mouse' });
  assert.equal(a.timers.size, 1);
  a.trigger.focused = true;
  a.trigger.emit('focusin');
  a.trigger.emit('pointerleave');
  assert.equal(a.timers.size, 1);
  a.trigger.focused = false;
  a.trigger.emit('focusout');
  assert.equal(a.timers.size, 0);
  assert.equal(a.layer.style.translate, '');
  assert.equal(b.timers.size, 1);
  assert.equal([...b.timers.values()][0].cadence, 240);
  a.trigger.emit('pointerenter', { pointerType: 'mouse' });
  a.trigger.emit('pointercancel');
  assert.equal(a.timers.size, 0);
  stopA(); stopB();
});

test('reduced motion and hidden pages stop/reset and resume; disabled and zero motion never schedule', async () => {
  const { attachJitter } = await import('../src/behaviors/Jitter/motion.ts');
  const f = fixture();
  f.media.matches = true;
  const cleanup = attachJitter(f.trigger, f.layer);
  assert.equal(f.timers.size, 0);
  f.media.matches = false; f.media.emit('change');
  assert.equal(f.timers.size, 1);
  f.doc.hidden = true; f.doc.emit('visibilitychange');
  assert.equal(f.timers.size, 0);
  assert.equal(f.layer.style.rotate, '');
  f.doc.hidden = false; f.doc.emit('visibilitychange');
  assert.equal(f.timers.size, 1);
  f.media.matches = true; f.media.emit('change');
  assert.equal(f.timers.size, 0);
  assert.equal(f.layer.style.translate, '');
  cleanup();
  for (const options of [{ enabled: false }, { x: 0, y: 0, rotation: 0 }]) {
    const g = fixture(); const stop = attachJitter(g.trigger, g.layer, options);
    assert.equal(g.timers.size, 0); stop();
  }
});

test('several layers share one timer, move independently, and each restores its own base transform', async () => {
  const { attachJitter } = await import('../src/behaviors/Jitter/motion.ts');
  const f = fixture();
  const layers = [{ style: { translate: '', rotate: '' } }, { style: { translate: '1px 0px', rotate: '2deg' } }, { style: { translate: '', rotate: '' } }];
  const cleanup = attachJitter(f.trigger, layers, { preset: 'print' });
  assert.equal(f.timers.size, 1);
  let identical = 0;
  for (let i = 0; i < 50; i++) {
    [...f.timers.values()][0].frame();
    const frames = layers.map(({ style }) => `${style.translate} ${style.rotate}`);
    if (frames[0] === frames[1] || frames[1] === frames[2]) identical++;
    for (const { style } of layers) {
      const [x, y] = style.translate.split(' ').map(parseFloat);
      assert.ok(Math.abs(x) <= .45 && Math.abs(y) <= .8 && Math.abs(parseFloat(style.rotate)) <= .55);
    }
  }
  assert.equal(identical, 0);
  cleanup();
  assert.deepEqual(layers.map(({ style }) => style), [{ translate: '', rotate: '' }, { translate: '1px 0px', rotate: '2deg' }, { translate: '', rotate: '' }]);
  assert.equal(f.timers.size, 0);
  const empty = fixture();
  const stop = attachJitter(empty.trigger, []);
  assert.equal(empty.timers.size, 0);
  stop();
});
