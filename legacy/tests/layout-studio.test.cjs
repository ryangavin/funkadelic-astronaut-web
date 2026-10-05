const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const C = require("../layout-studio-core.js");
test("selection highlight stays transparent and outside target pixels", () => {
  const source = fs.readFileSync("layout-studio.js", "utf8");
  const rule = source.match(/#highlight\{([^}]+)\}/)?.[1] || "";
  assert.match(rule, /background:transparent/);
  assert.match(rule, /outline-offset:[1-9]/);
  assert.doesNotMatch(rule, /border:/);
});
test("member drafts and viewport inheritance stay independent", () => {
  const d = C.validate({
    all: { "story:ryan": { x: 20, width: 340 }, "story:band": { width: 500 } },
    mobile: { "story:ryan": { x: -5 } },
    desktop: { "role:sam": { rotation: 4 } },
  });
  assert.deepEqual(C.effective(d, "story:ryan", "mobile"), {
    x: -5,
    width: 340,
  });
  assert.deepEqual(C.effective(d, "story:ryan", "desktop"), {
    x: 20,
    width: 340,
  });
  assert.deepEqual(C.effective(d, "story:kevin", "mobile"), {});
  assert.deepEqual(C.effective(d, "story:band", "mobile"), { width: 500 });
});
test("handoff round trips all scopes and archived source drafts, rejects unknown schema", () => {
  const data = {
    kind: "funkadelic-layout-handoff",
    version: 1,
    draft: {
      all: { astronaut: { scale: 1.2 } },
      mobile: { icon1: { iconSize: 24 } },
    },
    legacy: { all: { nav: { size: 20 } } },
    archive: { typography: { arbitrary: "preserved" } },
  };
  const parsed = C.parse(JSON.parse(JSON.stringify(data)));
  assert.equal(parsed.draft.all.astronaut.scale, 1.2);
  assert.equal(parsed.draft.mobile.icon1.iconSize, 24);
  assert.deepEqual(parsed.archive, data.archive);
  assert.deepEqual(parsed.legacy, data.legacy);
  assert.throws(() => C.parse({ version: 999, draft: {} }));
});
test("validation blocks CSS injection, nonfinite values, unknown targets and fields", () => {
  const d = C.validate({
    all: {
      astronaut: {
        x: "url(evil)",
        scale: Infinity,
        width: -3,
        rotation: 30,
        color: "red",
      },
      evil: { x: 20 },
      "story:ryan": { line: 1.4, paragraph: 18 },
    },
  });
  assert.deepEqual(d.all, {
    astronaut: { rotation: 30 },
    "story:ryan": { line: 1.4, paragraph: 18 },
  });
});
test("legacy migration retains originals and unrelated typography, owns mapped transforms once", () => {
  const legacy = {
    all: {
      wordmark: { x: 4, rotation: 6, color: "#123456" },
      role: { size: 30 },
      nav: { tracking: 0.1 },
    },
    desktop: {},
    mobile: { wordmark: { x: 10 } },
  };
  const before = structuredClone(legacy);
  const m = C.migrate(legacy, { learn: { frequency: 1.2, x: 5, rotation: 3 } });
  assert.deepEqual(legacy, before);
  assert.equal(m.draft.all.wordmark.x, 4);
  assert.equal(m.legacy.all.wordmark.x, undefined);
  assert.equal(m.legacy.all.wordmark.color, "#123456");
  assert.equal(m.legacy.all.nav.tracking, 0.1);
  assert.equal(m.draft.all["role:band"].size, 30);
  assert.equal(m.draft.all["ribbon:learn"].ribbonX, 5);
});
test("undo restores edits, reset and import atomically without reference leaks", () => {
  const h = C.history({ draft: C.empty() });
  let next = h.get();
  next.draft.all.wordmark = { x: 10 };
  h.set(next);
  next.draft.all.wordmark.x = 999;
  assert.equal(h.get().draft.all.wordmark.x, 10);
  const reset = h.get();
  delete reset.draft.all.wordmark;
  h.set(reset);
  assert.deepEqual(h.get().draft.all, {});
  assert.equal(h.undo().draft.all.wordmark.x, 10);
  assert.deepEqual(h.undo().draft.all, {});
  assert.equal(h.canUndo, false);
});

test("ambient monochrome levels round trip with scoped reset and undo", () => {
 const A=require('../ambient-treatment.js');
 assert.equal(A.defaults.source,'original-performance-hls');
 assert.deepEqual(Object.keys(A.fields),['source','fps','contrast','brightness','blackPoint','whitePoint','grain']);
 const draft=C.validate({all:{'ambient-video':{source:'original-performance-hls',fps:10,contrast:1.1,blackPoint:.05,grain:.3}},mobile:{'ambient-video':{fps:8}},desktop:{}});
 const state=C.parse(JSON.parse(JSON.stringify({kind:'funkadelic-layout-handoff',version:1,draft})));
 assert.equal(C.effective(state.draft,'ambient-video','mobile').source,'original-performance-hls');
 assert.equal(C.effective(state.draft,'ambient-video','mobile').contrast,1.1);
 assert.equal(C.effective(state.draft,'ambient-video','mobile').fps,8);
 const h=C.history(state), reset=h.get();delete reset.draft.mobile['ambient-video'];h.set(reset);
 assert.equal(C.effective(h.get().draft,'ambient-video','mobile').fps,10);
 assert.equal(h.undo().draft.mobile['ambient-video'].fps,8);
 const bad=C.validate({all:{'ambient-video':{source:'../secret.mp4',blackPoint:.9,fps:Infinity}}});
 assert.deepEqual(bad.all,{});
});
