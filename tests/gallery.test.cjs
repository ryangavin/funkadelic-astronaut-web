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
  const restoredPaper = [];
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
  elements["#learn"].querySelector = (selector) => selector === ".gallery-controls" ? controls : photo;
  elements["#band-gallery"].querySelector = () => controls;
  elements["#band-gallery"].querySelectorAll = () => indicators;
  const paperBacking = { className: "paper-cutout", width: "100%", height: "100%", zIndex: -1 };
  elements["#member-story"].children = [paperBacking];
  const context = {
    matchMedia: () => ({ matches: reducedMotion }),
    positionFocalPhoto() {},
    document: { querySelector: (s) => elements[s], createElement: node },
    window: {
      PaperCutout: {
        restore(host) {
          restoredPaper.push(host);
          host.children.unshift(paperBacking);
        },
      },
    },
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
  return { elements, photo, controls, indicators, pending, animations, restoredPaper, paperBacking };
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
test("member copy replacement restores the mounted PaperCutout backing", async () => {
  const h = setup();
  h.elements["#next-member"].events.click();
  h.pending.shift().resolve();
  await flush();
  assert.equal(h.restoredPaper.length, 1);
  assert.equal(h.restoredPaper[0], h.elements["#member-story"]);
  assert.equal(h.elements["#member-story"].children[0], h.paperBacking);
  assert.equal(h.paperBacking.width, "100%");
  assert.equal(h.paperBacking.height, "100%");
  assert.equal(h.paperBacking.zIndex, -1);
  assert.equal(h.elements["#member-story"].children.length, 3);
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

test("Polaroids slide across the paper while supporting copy moves quietly", async () => {
  for (const reducedMotion of [false, true]) {
    const h = setup(reducedMotion);
    h.elements["#next-member"].events.click();
    h.pending.shift().resolve();
    await flush();
    if (reducedMotion) assert.equal(h.animations.length, 0);
    else {
      assert.equal(h.animations.length, 6);
      assert.equal(h.animations[0].frames.at(-1).translate, "-118% 7px");
      assert.equal(h.animations[0].frames.at(-1).rotate, "-6deg");
      assert.equal(h.animations[0].options.duration, 210);
      assert.equal(h.animations[3].frames[0].translate, "42% 12px");
      assert.equal(h.animations[3].frames[0].scale, .86);
      assert.equal(h.animations[3].options.duration, 330);
      assert.equal(h.animations[4].frames[0].transform, "translateX(28px)");
    }
    h.elements["#previous-member"].events.click();
    if (h.pending.length) h.pending.shift().resolve();
    await flush();
    if (reducedMotion) assert.equal(h.animations.length, 0);
    else {
      assert.equal(h.animations[6].frames.at(-1).translate, "118% 7px");
      assert.equal(h.animations[6].frames.at(-1).rotate, "6deg");
      assert.equal(h.animations[9].frames[0].translate, "-118% 9px");
      assert.equal(h.animations[10].frames[0].transform, "translateX(-28px)");
    }
  }
});
