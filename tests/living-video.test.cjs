const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function harness({ reduced = false, blocked = false, startupPause = false } = {}) {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      handlers: {}, hidden: false, style: {}, textContent: '',
      addEventListener(event, fn) { this.handlers[event] = fn; },
      setAttribute(key, value) { this[key] = value; },
      classList: { toggle() {} }, append(child) { child.parent = this; },
      contains() { return false; }, focus() {}, querySelector(selector) { return element(selector); },
      showModal() { this.open = true; }, close() { this.open = false; this.handlers.close(); }
    });
    return elements.get(id);
  };
  const video = element('#performance');
  Object.assign(video, { paused: true, muted: true, volume: 1, currentTime: 27, duration: 120,
    async play() { if (startupPause) this.pause(); if (blocked) throw Error('Autoplay denied'); this.paused = false; this.handlers.play?.(); },
    pause() { this.paused = true; this.handlers.pause?.(); }
  });
  const motion = { matches: reduced, addEventListener(event, fn) { this.change = fn; } };
  let intersect, attached = 0;
  class Hls {
    static isSupported() { return true; }
    static Events = { MANIFEST_PARSED: 'ready', ERROR: 'error' };
    handlers = {};
    on(event, fn) { this.handlers[event] = fn; }
    loadSource() {}
    attachMedia() { attached++; this.handlers.ready(); }
  }
  vm.runInNewContext(fs.readFileSync('living-video.js', 'utf8'), {
    document: { querySelector: element, body: element('body') },
    matchMedia: () => motion, window: { Hls }, innerWidth: 1200,
    IntersectionObserver: class { constructor(fn) { intersect = fn; } observe() {} },
  });
  return { element, video, motion, intersect, attached: () => attached };
}
const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
test('play restarts the same inline media with sound, including repeated clicks', async () => {
  const h = harness(); h.intersect([{ isIntersecting: true }]); await settle();
  assert.equal(h.video.paused, false); assert.equal(h.video.muted, true);
  h.element('#play-video').handlers.click(); await settle();
  assert.equal(h.video.muted, false); assert.equal(h.video.currentTime, 0); assert.equal(h.attached(), 1);
  h.video.currentTime = 65;
  h.element('#play-video').handlers.click(); await settle();
  assert.equal(h.video.currentTime, 0); assert.equal(h.video.muted, false);
  assert.equal(h.video.paused, false); assert.equal(h.attached(), 1);
});
test('reduced motion stays still until an explicit action and pauses when preference changes', async () => {
  const h = harness({ reduced: true }); h.intersect([{ isIntersecting: true }]); await settle();
  assert.equal(h.attached(), 0); assert.equal(h.video.paused, true);
  h.element('#play-video').handlers.click(); await settle(); assert.equal(h.video.paused, false);
  h.motion.change(); assert.equal(h.video.paused, true);
});
test('blocked autoplay leaves an actionable fallback', async () => {
  const h = harness({ blocked: true }); h.intersect([{ isIntersecting: true }]); await settle();
  assert.match(h.element('#video-status').textContent, /play/);
  assert.equal(h.video.paused, true);
  h.element('#play-video').handlers.click(); await settle();
  assert.equal(h.element('.video-fallback').hidden, false);
});

test('successful explicit playback reveals controls; pause resets presentation without rewinding', async () => {
  const h = harness({ startupPause: true });
  h.element('#play-video').handlers.click(); await settle();
  assert.equal(h.element('#play-video').hidden, true);
  assert.equal(h.element('#playback-controls').hidden, false);
  h.video.currentTime = 43;
  h.element('#pause-video').handlers.click();
  assert.equal(h.video.paused, true);
  assert.equal(h.video.currentTime, 43);
  assert.equal(h.element('#play-video').hidden, false);
  assert.equal(h.element('#playback-controls').hidden, true);
  h.element('#play-video').handlers.click(); await settle();
  assert.equal(h.video.currentTime, 0);
  assert.equal(h.element('#playback-controls').hidden, false);
});
test('seek and volume controls update media; external pause and playback failure restore default', async () => {
  const h = harness(); h.element('#play-video').handlers.click(); await settle();
  const seek = h.element('#video-seek'); seek.value = 61; seek.handlers.input();
  assert.equal(h.video.currentTime, 61);
  assert.equal(h.element('#playback-controls').hidden, false);
  const volume = h.element('#video-volume'); volume.value = .35; volume.handlers.input();
  assert.equal(h.video.volume, .35); assert.equal(h.video.muted, false);
  h.element('#mute-video').handlers.click(); assert.equal(h.video.muted, true);
  h.video.pause(); assert.equal(h.element('#playback-controls').hidden, true);
  const denied = harness({ blocked: true });
  denied.element('#play-video').handlers.click(); await settle();
  assert.equal(denied.element('#play-video').hidden, false);
  assert.equal(denied.element('#playback-controls').hidden, true);
});
