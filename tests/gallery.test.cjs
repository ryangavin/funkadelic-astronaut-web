const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const source = fs
  .readFileSync("app.js", "utf8")
  .split("// One manually selected introduction;")[1];
function setup() {
  const elements = {};
  const pending = [];
  const node = () => ({
    attributes: {},
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
    "#member-role",
    "#member-name",
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
  return { elements, photo, controls, indicators, pending };
}
const flush = () => new Promise((resolve) => setImmediate(resolve));
test("manual gallery wraps both ways and commits matching image, name and indicator", async () => {
  const h = setup();
  h.elements["#previous-member"].events.click();
  h.pending.shift().resolve();
  await flush();
  assert.equal(h.elements["#member-name"].textContent, "Sam Luba");
  assert.equal(h.photo.src, "assets/band-21.webp");
  assert.equal(h.indicators[3].attributes["aria-current"], "true");
  h.elements["#next-member"].events.click();
  h.pending.shift().resolve();
  await flush();
  assert.equal(h.elements["#member-name"].textContent, "Funkadelic Astronaut");
  assert.equal(h.indicators[3].attributes["aria-current"], undefined);
});
test("rapid selections ignore stale image completion and failed loads preserve current slide", async () => {
  const h = setup();
  h.indicators[1].events.click();
  h.indicators[2].events.click();
  const first = h.pending.shift(),
    last = h.pending.shift();
  last.resolve();
  await flush();
  first.resolve();
  await flush();
  assert.equal(h.elements["#member-name"].textContent, "Kevin O’Neill");
  assert.equal(h.photo.src, "assets/band-22.webp");
  h.indicators[3].events.click();
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
    h.pending.shift().resolve();
    await flush();
    assert(prevented);
    assert.equal(h.elements["#member-name"].textContent, name);
  }
});
