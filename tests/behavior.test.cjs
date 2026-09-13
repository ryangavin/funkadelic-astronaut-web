const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("app.js", "utf8");
function harness(width, reducedMotion = false) {
  const events = {};
  const reduced = {
    matches: reducedMotion,
    addEventListener: (name, fn) => (events.motion = fn),
  };
  const scene = (id, top, height) => ({
    id,
    dataset: { wave: id === "listen" ? "hero" : "soft" },
    clientWidth: width,
    clientHeight: height,
    top,
    style: {
      setProperty(k, v) {
        this[k] = v;
      },
    },
    getBoundingClientRect() {
      return { top: this.top, height: this.clientHeight };
    },
    seam: { setAttribute() {}, innerHTML: "" },
    querySelector() {
      return this.seam;
    },
  });
  const scenes = [
    scene("listen", 600, 800),
    scene("learn", 0, 800),
    scene("live", -600, 800),
    scene("footer", -1200, 160),
  ];
  const el = {
    addEventListener() {},
    querySelector() {
      return el;
    },
    style: {},
  };
  const storage = new Map();
  const context = {
    window: {},
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key,value) => storage.set(key,value) },
    document: {
      querySelectorAll: () => scenes,
      querySelector: (selector) => (["#band-gallery", "#learn .media-plane img"].includes(selector) ? null : el),
      body: el,
    },
    innerWidth: width,
    innerHeight: 800,
    matchMedia: () => reduced,
    getComputedStyle: () => ({
      getPropertyValue: () => (width < 760 ? "135px" : "230px"),
    }),
    ResizeObserver: class {
      observe() {}
    },
    requestAnimationFrame: (fn) => fn(),
    addEventListener: (name, fn) => (events[name] = fn),
  };
  vm.runInNewContext(source, context);
  return { scenes, events, reduced, ribbons: context.window.ribbonStudio };
}
test("media follows section position; neutral center, correct sign, bounded overscan", () => {
  const { scenes, events } = harness(1440);
  assert.equal(scenes[0].style["--shift"], "24px");
  assert.equal(scenes[1].style["--shift"], "0px");
  assert.equal(scenes[2].style["--shift"], "-24px");
  scenes[0].top = 100000;
  events.scroll();
  assert.equal(scenes[0].style["--shift"], "32px");
});
test("phone motion is smaller and reduced motion stops all planes, including changes at runtime", () => {
  const mobile = harness(390);
  assert.equal(mobile.scenes[0].style["--shift"], "10.5px");
  mobile.reduced.matches = true;
  mobile.events.motion();
  for (const s of mobile.scenes) assert.equal(s.style["--shift"], "0px");
  for (const s of harness(1440, true).scenes)
    assert.equal(s.style["--shift"], "0px");
});
test("every responsive seam uses exactly the same geometry as its clip", () => {
  for (const width of [320, 390, 600, 768, 1024, 1440, 1920]) {
    for (const s of harness(width).scenes) {
      assert(!s.style.clipPath.includes("NaN"));
      const paths = [...s.seam.innerHTML.matchAll(/ d="([^"]+)"/g)].map(
        (m) => m[1],
      );
      assert.equal(paths.length, 3);
      assert(!s.seam.innerHTML.includes("NaN"));
      assert(paths.every((d) => d === paths[0]));
      const coordinates = paths[0].match(/-?\d+(?:\.\d+)?/g).map(Number);
      assert(coordinates[0] < -20, "ribbon starts beyond the left edge");
      assert(coordinates.at(-2) > width + 20, "ribbon ends beyond the right edge");
      assert(s.style.clipPath.startsWith(`path('${paths[0]} L ${width} `));
    }
  }
});

test("ribbon edits keep stripe clipping aligned, isolate sections, and reset exactly", () => {
  for (const width of [320, 900, 1440]) {
    const h = harness(width), originals = h.scenes.map(s => s.seam.innerHTML);
    h.ribbons.set({ listen: { frequency: 1.7, amplitude: 22, rotation: 3, x: 8, y: -12 } });
    assert.notEqual(h.scenes[0].seam.innerHTML, originals[0]);
    assert.equal(h.scenes[1].seam.innerHTML, originals[1]);
    for (const s of h.scenes) {
      const paths = [...s.seam.innerHTML.matchAll(/ d="([^"]+)"/g)].map(m => m[1]);
      assert(paths.every(p => s.style.clipPath.startsWith(`path('${p} L `)));
    }
    h.ribbons.set({ listen: { frequency: NaN, amplitude: 900, x: 'bad' } });
    assert.equal(h.scenes[0].seam.innerHTML, originals[0]);
    h.ribbons.set({});
    assert.deepEqual(h.scenes.map(s => s.seam.innerHTML), originals);
  }
});
