const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
function setup({ contextAvailable = true, reduced = false } = {}) {
  const make = () => ({
    events: {},
    addEventListener(name, fn) {
      (this.events[name] ||= []).push(fn);
    },
    emit(name) {
      for (const fn of this.events[name] || []) fn();
    },
  });
  const video = Object.assign(make(), {
    readyState: 4,
    videoWidth: 1280,
    videoHeight: 720,
    paused: false,
    ended: false,
    seeking: false,
    currentTime: 12,
    volume: 0.4,
    muted: true,
    playbackRate: 1,
    play() { this.paused = false; this.emit("playing"); return Promise.resolve(); },
    pause() { this.paused = true; this.emit("pause"); },
    load() { this.loads = (this.loads || 0) + 1; },
  });
  const classes = new Set();
  const sceneClasses = new Set();
  const scene = { style: { setProperty() {} }, classList: { contains: (name) => sceneClasses.has(name) } };
  const player = {
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
    },
  };
  const frames = [];
  let throwDraw = false;
  const context = {
    drawImage(source, x, y, w, h) {
      if (throwDraw) throw Error("copy unsupported");
      frames.push({ time: source.currentTime, w, h });
    },
  };
  const canvas = Object.assign(make(), {
    width: 300,
    height: 150,
    getContext: () => (contextAvailable ? context : null),
  });
  const attrs = new Map();
  const node = (selector) => ({setAttribute(k,v) {attrs.set(`${selector}:${k}`, v);}});
  const filter = {
    querySelector: (selector) => node(selector),
    querySelectorAll: (selector) => [node(`${selector}:1`), node(`${selector}:2`), node(`${selector}:3`)],
  };
  const motion = {matches: reduced, addEventListener(name, fn) {this.change=fn;}};
  const document = Object.assign(make(), {
    hidden: false,
    querySelector: (sel) =>
      ({
        "#performance": video,
        "#performance-print": canvas,
        "#inline-player": player,
        "#listen": scene, "#ambient-print-finish": filter,
      })[sel],
  });
  const page = make(),
    timers = new Map();
  let id = 0,
    intersect,
    disconnected = 0,
    observations = 0;
  let modeChanged;
  const selectedSources = [];
  const window = {AmbientTreatment: require('../ambient-treatment.js'), ambientVideoSources: [
    {id:'original-performance-hls',label:'Original full performance · 8:42',type:'hls'},
    {id:'repainted-performance.mp4',url:'/default.mp4'}, {id:'alternate.webm',url:'/alternate.webm'}],
    livingVideo:{selectAmbientSource(source){selectedSources.push(source.id);}}};
  const scope = {
    window, matchMedia: () => motion,
    MutationObserver: class {
      constructor(fn) {
        modeChanged = fn;
      }
      observe() {}
      disconnect() {}
    },
    document,
    innerWidth: 1280,
    addEventListener: page.addEventListener.bind(page),
    setInterval(fn, ms) {
      timers.set(++id, { fn, ms });
      return id;
    },
    clearInterval(id) {
      timers.delete(id);
    },
    IntersectionObserver: class {
      constructor(fn) {
        intersect = fn;
      }
      observe() {
        observations++;
      }
      disconnect() {
        disconnected++;
      }
    },
  };
  vm.createContext(scope);
  vm.runInContext(
    fs.readFileSync("print-cadence.js", "utf8") +
      fs.readFileSync("performance-print.js", "utf8"),
    scope,
  );
  return {
    video,
    api: window.ambientVideoStudio, attr: (selector, name) => attrs.get(`${selector}:${name}`), motion, selectedSources,
    canvas,
    document,
    page,
    scope,
    frames,
    mode(active) {
      if (active) sceneClasses.add("sound-enabled");
      else sceneClasses.delete("sound-enabled");
      modeChanged();
    },
    timers,
    classes,
    intersect: (visible = true) => intersect?.([{ isIntersecting: visible }]),
    fail: () => {
      throwDraw = true;
    },
    tick() {
      for (const { fn } of [...timers.values()]) fn();
    },
    disconnected: () => disconnected,
    observations: () => observations,
  };
}
test("baked ambient filter is strictly monochrome without palette or contour stages", () => {
  const html = fs.readFileSync("index.html", "utf8");
  const filter = html.match(/<filter id="ambient-print-finish"[\s\S]+?<\/filter>/)?.[0] || "";
  assert.match(filter, /id="ambient-monochrome" type="saturate" values="0"/);
  assert.match(filter, /id="ambient-levels"/);
  assert.doesNotMatch(filter, /palette|edge|feMorphology|feFlood|discrete/);
});
test("one held-frame blit per independent 100ms tick; ambient stays silent", () => {
  const h = setup();
  assert.equal(h.frames.length, 0);
  h.intersect();
  assert.equal(h.frames.length, 1);
  assert.equal(h.timers.size, 1);
  assert.equal([...h.timers.values()][0].ms, 100);
  h.video.currentTime = 12.05;
  assert.equal(h.frames[0].time, 12);
  h.tick();
  assert.equal(h.frames.length, 2);
  assert.equal(h.frames[1].time, 12.05);
  assert.deepEqual(
    [h.video.playbackRate, h.video.volume, h.video.muted],
    [1, 0.4, true],
  );
  assert.equal(h.classes.has("has-print-frame"), true);
  h.video.emit("playing");
  h.video.emit("playing");
  assert.equal(h.timers.size, 1);
});
test("paused seek refreshes once; waiting holds frame; ending and source reset stop scheduling", () => {
  const h = setup();
  h.intersect();
  h.video.paused = true;
  h.video.emit("pause");
  assert.equal(h.timers.size, 0);
  h.video.seeking = true;
  h.video.emit("seeking");
  const before = h.frames.length;
  h.video.currentTime = 47;
  h.tick();
  assert.equal(h.frames.length, before);
  h.video.seeking = false;
  h.video.emit("seeked");
  assert.equal(h.frames.at(-1).time, 47);
  assert.equal(h.timers.size, 0);
  h.video.paused = false;
  h.video.emit("playing");
  h.video.emit("waiting");
  assert.equal(h.timers.size, 0);
  assert.equal(h.classes.has("has-print-frame"), true);
  h.video.emit("playing");
  h.video.ended = true;
  h.video.emit("ended");
  assert.equal(h.timers.size, 0);
  h.video.emit("emptied");
  assert.equal(h.classes.has("has-print-frame"), false);
});
test("offscreen, hidden and pagehide suspend work; visibility and bfcache return restart one timer", () => {
  const h = setup();
  h.intersect();
  h.intersect(false);
  assert.equal(h.timers.size, 0);
  h.intersect();
  h.document.hidden = true;
  h.document.emit("visibilitychange");
  assert.equal(h.timers.size, 0);
  const count = h.frames.length;
  h.tick();
  assert.equal(h.frames.length, count);
  h.document.hidden = false;
  h.document.emit("visibilitychange");
  assert.equal(h.timers.size, 1);
  h.page.emit("pagehide");
  assert.equal(h.timers.size, 0);
  assert.equal(h.disconnected(), 1);
  h.page.emit("resize");
  assert.equal(h.timers.size, 0);
  h.page.emit("pageshow");
  assert.equal(h.timers.size, 1);
  assert.equal(h.observations(), 2);
});
test("desktop and mobile retain full source resolution and aspect ratio", () => {
  const h = setup();
  h.intersect();
  assert.deepEqual([h.canvas.width, h.canvas.height], [1280, 720]);
  h.scope.innerWidth = 390;
  h.page.emit("resize");
  assert.deepEqual([h.canvas.width, h.canvas.height], [1280, 720]);
  assert.equal(h.timers.size, 1);
  h.video.videoWidth = 640;
  h.video.videoHeight = 480;
  h.page.emit("resize");
  assert.deepEqual([h.canvas.width, h.canvas.height], [640, 480]);
});
test("copy failure or context loss reveals native fallback without touching media", () => {
  const h = setup();
  h.intersect();
  h.fail();
  h.tick();
  assert.equal(h.timers.size, 0);
  assert.equal(h.classes.has("has-print-frame"), false);
  assert.equal(h.video.paused, false);
  const missing = setup({ contextAvailable: false });
  assert.equal(missing.classes.size, 0);
  assert.equal(missing.timers.size, 0);
  const lost = setup();
  lost.intersect();
  lost.canvas.emit("contextlost");
  assert.equal(lost.classes.size, 0);
  assert.equal(lost.timers.size, 0);
  lost.canvas.emit("contextrestored");
  assert.equal(lost.timers.size, 1);
});
test("no frames before source readiness, including reduced-motion paused initial state", () => {
  const h = setup({reduced:true});
  h.video.readyState = 0;
  h.video.paused = true;
  h.intersect();
  assert.equal(h.frames.length, 0);
  assert.equal(h.timers.size, 0);
  h.video.readyState = 2;
  h.video.emit("loadeddata");
  assert.equal(h.frames.length, 1);
  assert.equal(h.timers.size, 0);
});

test("explicit playback stops held-frame work and leaves the last frame for CSS crossfade", () => {
  const h = setup();
  h.intersect();
  const count = h.frames.length;
  h.mode(true);
  assert.equal(h.timers.size, 0);
  assert.equal(h.classes.has("has-print-frame"), true);
  h.tick();
  h.video.emit("playing");
  h.video.emit("seeked");
  assert.equal(h.frames.length, count);
  assert.equal(h.timers.size, 0);
  assert.equal(h.video.playbackRate, 1);
  h.video.paused = true;
  h.video.emit("pause");
  assert.equal(h.frames.length, count);
  h.mode(false);
  h.video.paused = false;
  h.video.emit("playing");
  assert.ok(h.frames.length > count);
  assert.equal(h.timers.size, 1);
});

test("live treatment changes preserve playhead; cadence replaces one timer and reset restores defaults", () => {
 const h=setup(); h.intersect(); const time=h.video.currentTime;
 h.api.preview({fps:12,contrast:1.2,brightness:1.05,blackPoint:.1,whitePoint:.9,grain:.2});
 assert.equal(h.timers.size,1); assert.equal([...h.timers.values()][0].ms,1000/12);
 assert.equal(h.video.currentTime,time); assert.equal(h.video.loads,undefined);
 const transfer=require('../ambient-treatment.js').transfer({contrast:1.2,brightness:1.05,blackPoint:.1,whitePoint:.9});
 assert.equal(h.attr('.ambient-level-channel:1','slope'),transfer.slope);
 assert.equal(h.attr('.ambient-level-channel:1','intercept'),transfer.intercept);
 h.api.preview({}); assert.equal([...h.timers.values()][0].ms,100);
 assert.equal(h.attr('.ambient-level-channel:1','slope'),require('../ambient-treatment.js').transfer(require('../ambient-treatment.js').defaults).slope);
 h.mode(true); h.api.preview({fps:24}); assert.equal(h.timers.size,0);
});
test("source switching delegates to the shared media pipeline and missing sources fall back", () => {
 const h=setup();h.intersect();h.api.preview({source:'alternate.webm'});
 assert.deepEqual(h.selectedSources,['alternate.webm']);assert.equal(h.video.muted,true);
 h.api.preview({source:'alternate.webm',contrast:1.1});assert.deepEqual(h.selectedSources,['alternate.webm','alternate.webm']);
 h.api.preview({source:'removed.mp4'});assert.equal(h.selectedSources.at(-1),'original-performance-hls');
});
