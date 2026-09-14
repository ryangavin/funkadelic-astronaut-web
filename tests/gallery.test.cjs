const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const source = fs
  .readFileSync("app.js", "utf8")
  .split("// One manually selected introduction;")[1];
function setup(reducedMotion = false) {
  const animations = [];
  const elements = {};
  const pending = [];
  const node = () => ({
    attributes: {},
    animate(frames, options) { animations.push({ frames, options }); return { cancel() {}, finished: Promise.resolve() }; },
    events: {},
    dataset: {},
    textContent: "",
    setAttribute(k, v) {
      this.attributes[k] = v;
    },
    removeAttribute(k) {
      delete this.attributes[k];
    },
    replaceChildren(...c) {
      this.children = c;
    },
    addEventListener(k, f) {
      this.events[k] = f;
    },
  });
  for (const id of [
    "#band-gallery",
    "#learn",
    "#learn-title",
    "#member-role",
    "#member-name",
    "#polaroid-member-role",
    "#polaroid-member-name",
    "#member-story",
    "#band-slide",
    "#gallery-status",
    "#previous-member",
    "#next-member",
  ])
    elements[id] = node();
  const photo = node(),
    controls = node(),
    indicators = Array.from({ length: 4 }, node);
  elements["#learn"].querySelector = () => photo;
  elements["#band-gallery"].querySelector = () => controls;
  elements["#band-gallery"].querySelectorAll = () => indicators;
  const context = {
    matchMedia: () => ({ matches: reducedMotion }),
    positionFocalPhoto() {},
    document: { querySelector: (s) => elements[s], createElement: node },
    Image: class {
      decode() {
        return new Promise((resolve, reject) =>
          pending.push({ resolve, reject }),
        );
      }
    },
  };
  vm.runInNewContext(
    "// One manually selected introduction;" + source,
    context,
  );
  return { elements, photo, controls, indicators, pending, animations };
}
const flush = () => new Promise((resolve) => setImmediate(resolve));
test("edge arrows stop at the first and last introduction", async () => {
  const h = setup();
  assert.equal(h.elements["#previous-member"].hidden, true);
  h.elements["#previous-member"].events.click();
  assert.equal(h.pending.length, 0);
  for (const name of ["Ryan Gavin", "Kevin O’Neill", "Sam Luba"]) {
    h.elements["#next-member"].events.click();
    if (h.pending.length) h.pending.shift().resolve();
    await flush();
    assert.equal(h.elements["#member-name"].textContent, name);
    assert.equal(h.elements["#polaroid-member-name"].textContent, name);
    assert.equal(h.elements["#previous-member"].hidden, false);
  }
  assert.equal(h.elements["#next-member"].hidden, true);
  h.elements["#next-member"].events.click();
  assert.equal(h.pending.length, 0);
  h.elements["#previous-member"].events.click();
  h.pending.shift().resolve();
  await flush();
  assert.equal(h.elements["#member-name"].textContent, "Kevin O’Neill");
  assert.equal(h.elements["#next-member"].hidden, false);
});
test("rapid selections ignore stale image completion and failed loads preserve current slide", async () => {
  const h = setup();
  h.elements["#next-member"].events.click();
  h.elements["#next-member"].events.click();
  const first = h.pending.shift(),
    last = h.pending.shift();
  last.resolve();
  await flush();
  first.resolve();
  await flush();
  assert.equal(h.elements["#member-name"].textContent, "Kevin O’Neill");
  assert.equal(h.photo.src, "assets/band-22.webp");
  h.elements["#next-member"].events.click();
  h.pending.shift().reject();
  await flush();
  assert.equal(h.elements["#member-name"].textContent, "Kevin O’Neill");
  assert.match(h.elements["#gallery-status"].textContent, /could not load/);
  assert.equal(h.elements["#band-gallery"].attributes["aria-busy"], undefined);
});
test("keyboard Home and End select first and last without auto rotation", async () => {
  const h = setup();
  for (const [key, name] of [
    ["End", "Sam Luba"],
    ["Home", "Funkadelic Astronaut"],
  ]) {
    let prevented = false;
    h.controls.events.keydown({
      key,
      preventDefault() {
        prevented = true;
      },
    });
    if (h.pending.length) h.pending.shift().resolve();
    await flush();
    assert(prevented);
    assert.equal(h.elements["#member-name"].textContent, name);
  }
});

test("transitions slide in the navigation direction and respect reduced motion", async () => {
  for (const reducedMotion of [false, true]) {
    const h = setup(reducedMotion);
    h.elements["#next-member"].events.click();
    h.pending.shift().resolve();
    await flush();
    if (reducedMotion) assert.equal(h.animations.length, 0);
    else assert.equal(h.animations.at(-1).frames[0].transform, "translateX(72px)");
    h.elements["#previous-member"].events.click();
    if (h.pending.length) h.pending.shift().resolve();
    await flush();
    if (reducedMotion) assert.equal(h.animations.length, 0);
    else assert.equal(h.animations.at(-1).frames[0].transform, "translateX(-72px)");
  }
});
