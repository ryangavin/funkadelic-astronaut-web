const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function harness({ reduced = false, blocked = false, startupPause = false, deferred = false, native = false } = {}) {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      handlers: {}, hidden: false, style: {}, textContent: '',
      listeners: {},
      addEventListener(event, fn) {
        (this.listeners[event] ||= []).push(fn);
        this.handlers[event] = (...args) => { for (const listener of [...this.listeners[event]]) listener(...args); };
      },
      removeEventListener(event, fn) { this.listeners[event] = (this.listeners[event] || []).filter(listener => listener !== fn); },
      setAttribute(key, value) { this[key] = value; },
      removeAttribute(key) { delete this[key]; },
      classList: { toggle() {}, add() {}, remove() {} }, append(child) { child.parent = this; },
      contains() { return false; }, focus() {}, querySelector(selector) { return element(selector); },
      showModal() { this.open = true; }, close() { this.open = false; this.handlers.close(); }
    });
    return elements.get(id);
  };
  const video = element('#performance');
  Object.assign(video, { paused: true, muted: true, volume: 1, currentTime: 27, duration: 120,
    canPlayType() { return native ? 'maybe' : ''; }, load() {},
    async play() { this.ended = false; if (startupPause) this.pause(); if (blocked) throw Error('Autoplay denied'); this.paused = false; this.handlers.playing?.(); },
    pause() { this.paused = true; this.handlers.pause?.(); }
  });
  const motion = { matches: reduced, addEventListener(event, fn) { this.change = fn; } };
  let intersect, attached = 0; const instances = [];
  const document = { querySelector: sel => element(sel), body: element('body'), hidden: false, addEventListener(event, fn) { this[event] = fn; } };
  class Hls {
    static isSupported() { return !native; }
    static Events = { MANIFEST_PARSED: 'ready', ERROR: 'error' };
    handlers = {};
    constructor() { instances.push(this); }
    destroy() { this.destroyed = true; }
    on(event, fn) { this.handlers[event] = fn; }
    loadSource(source) { this.source = source; }
    attachMedia() { attached++; if (!deferred) this.handlers.ready(); }
  }
  const pageEvents = {};
  const window = { Hls, addEventListener(event, fn) { pageEvents[event] = fn; } };
  vm.runInNewContext(fs.readFileSync('living-video.js', 'utf8'), {
    document,
    matchMedia: () => motion, window, innerWidth: 1200,
    IntersectionObserver: class { constructor(fn) { intersect = fn; } observe() {} },
  });
  return { element, video, motion, intersect, instances, document, pageEvents, api: window.livingVideo, attached: () => attached };
}
const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
test('landing markup has one shared performance video element', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.equal((html.match(/<video\b/g) || []).length, 1);
  assert.match(html, /<video id="performance"/);
  assert.doesNotMatch(html, /id="ambient-performance"/);
});
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

test('pause keeps transport visible and resumes without rewinding', async () => {
  const h = harness({ startupPause: true });
  h.element('#play-video').handlers.click(); await settle();
  assert.equal(h.element('#play-video').hidden, true);
  assert.equal(h.element('#playback-controls').hidden, false);
  h.video.currentTime = 43;
  h.video.volume = .35; h.video.muted = true;
  h.element('#pause-video').handlers.click();
  assert.equal(h.video.paused, true);
  assert.equal(h.video.currentTime, 43);
  assert.equal(h.element('#play-video').hidden, true);
  assert.equal(h.element('#playback-controls').hidden, false);
  assert.equal(h.element('#pause-video')['aria-label'], 'Play performance');
  h.element('#pause-video').handlers.click(); await settle();
  assert.equal(h.video.currentTime, 43);
  assert.equal(h.video.volume, .35); assert.equal(h.video.muted, true);
  assert.equal(h.element('#playback-controls').hidden, false);
});
test('seek and volume controls update media; external pause retains controls and failure restores retry', async () => {
  const h = harness(); h.element('#play-video').handlers.click(); await settle();
  const seek = h.element('#video-seek'); seek.value = 61; seek.handlers.input();
  assert.equal(h.video.currentTime, 61);
  assert.equal(h.element('#playback-controls').hidden, false);
  const volume = h.element('#video-volume'); volume.value = .35; volume.handlers.input();
  assert.equal(h.video.volume, .35); assert.equal(h.video.muted, false);
  h.element('#mute-video').handlers.click(); assert.equal(h.video.muted, true);
  h.video.pause(); assert.equal(h.element('#playback-controls').hidden, false);
  const denied = harness({ blocked: true });
  denied.element('#play-video').handlers.click(); await settle();
  assert.equal(denied.element('#play-video').hidden, false);
  assert.equal(denied.element('#playback-controls').hidden, true);
});

test('fatal HLS error after playback destroys resolved source and retry attaches fresh media', async () => {
  const h = harness(); h.element('#play-video').handlers.click(); await settle();
  const first = h.instances[0];
  first.handlers.error(null, { fatal: true, type: 'networkError' });
  assert.equal(first.destroyed, true);
  assert.equal(h.element('.video-fallback').hidden, false);
  h.element('#play-video').handlers.click(); await settle();
  assert.equal(h.attached(), 2);
  assert.equal(h.video.paused, false);
  assert.equal(h.element('.video-fallback').hidden, true);
  first.handlers.error(null, { fatal: true });
  assert.equal(h.video.paused, false, 'stale instance must not interrupt retry');
});
test('fatal HLS error before manifest is retryable; nonfatal errors preserve playback', async () => {
  const h = harness({ deferred: true });
  h.element('#play-video').handlers.click();
  h.instances[0].handlers.error(null, { fatal: true, type: 'mediaError' }); await settle();
  h.element('#play-video').handlers.click();
  h.instances[1].handlers.ready(); await settle();
  assert.equal(h.attached(), 2);
  h.instances[1].handlers.error(null, { fatal: false });
  assert.equal(h.video.paused, false);
});
test('ambient startup cannot play after scrolling away or hiding the page', async () => {
  for (const hidden of [false, true]) {
    const h = harness({ deferred: true });
    h.intersect([{ isIntersecting: true }]);
    if (hidden) { h.document.hidden = true; h.document.visibilitychange(); }
    else h.intersect([{ isIntersecting: false }]);
    h.instances[0].handlers.ready(); await settle();
    assert.equal(h.video.paused, true);
    h.document.hidden = false;
    h.intersect([{ isIntersecting: true }]); await settle();
    assert.equal(h.video.paused, false);
    h.document.hidden = true; h.document.visibilitychange();
    assert.equal(h.video.paused, true);
  }
});
test('pagehide suspends ambient playback and pageshow resumes it', async () => {
  const h = harness(); h.intersect([{isIntersecting:true}]); await settle();
  assert.equal(h.video.paused,false);
  h.pageEvents.pagehide(); assert.equal(h.video.paused,true);
  h.pageEvents.pageshow(); await settle(); assert.equal(h.video.paused,false);
  assert.equal(h.attached(),1);
});
test('ending offers compact replay with sound and zero volume can be unmuted', async () => {
  const h = harness(); h.element('#play-video').handlers.click(); await settle();
  h.video.currentTime = 120; h.video.ended = true; h.video.paused = true; h.video.handlers.ended();
  assert.equal(h.element('#pause-video')['aria-label'], 'Replay performance');
  assert.equal(h.element('#playback-controls').hidden, false);
  h.element('#pause-video').handlers.click(); await settle();
  assert.equal(h.video.currentTime, 0);
  h.element('#video-volume').value = 0; h.element('#video-volume').handlers.input();
  assert.equal(h.element('#mute-video')['aria-label'], 'Unmute');
  h.element('#mute-video').handlers.click();
  assert.equal(h.video.volume, 1); assert.equal(h.video.muted, false);
});
test('native HLS requests metadata when MSE is unavailable and retries a media error', async () => {
  const h = harness({ native: true });
  h.element('#play-video').handlers.click(); h.video.handlers.loadedmetadata(); await settle();
  assert.equal(h.attached(), 0); assert.equal(h.video.paused, false);
  assert.equal(h.video.preload, 'metadata');
  h.video.handlers.error(); await settle();
  h.element('#play-video').handlers.click(); h.video.handlers.loadedmetadata(); await settle();
  assert.equal(h.video.paused, false); assert.equal(h.element('.video-fallback').hidden, true);
});

test('one HLS attachment supplies muted ambient frames and restarts at zero for explicit Play', async () => {
 const h = harness(); h.intersect([{isIntersecting:true}]); await settle();
 assert.equal(h.attached(),1); assert.equal(h.video.paused,false);
 assert.equal(h.video.muted,true); assert.equal(h.video.defaultMuted,true); assert.equal(h.video.loop,true);
 h.element('#play-video').handlers.click(); await settle();
 assert.equal(h.attached(),1); assert.equal(h.video.currentTime,0);
 assert.equal(h.video.muted,false); assert.equal(h.video.loop,false);
});

test('ambient local clips remain selectable and explicit Play reattaches the canonical HLS', async () => {
 const h = harness(); h.intersect([{isIntersecting:true}]); await settle();
 const first = h.instances[0];
 h.api.selectAmbientSource({id:'alternate.webm',label:'alternate.webm',url:'/alternate.webm'});
 assert.equal(first.destroyed,true); assert.equal(h.video.src,'/alternate.webm');
 h.video.handlers.loadedmetadata(); await settle();
 assert.equal(h.video.paused,false); assert.equal(h.video.muted,true); assert.equal(h.video.loop,true);
 h.video.currentTime=90; h.element('#play-video').handlers.click(); await settle();
 assert.equal(h.attached(),2); assert.equal(h.instances[1].source.includes('playlist.m3u8'),true);
 assert.equal(h.video.currentTime,0); assert.equal(h.video.muted,false); assert.equal(h.video.loop,false);
});
