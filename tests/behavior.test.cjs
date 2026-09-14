const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("app.js", "utf8");
test("Band and Tour reuse one festival asset through distinct decorative layers", () => {
  const html = fs.readFileSync("index.html", "utf8");
  const css = fs.readFileSync("styles/sections.css", "utf8");
  const band = html.match(/<section\s+class="scene learn"[\s\S]+?<\/section>/)?.[0] || "";
  const tour = html.match(/<section\s+class="scene live"[\s\S]+?<\/section>/)?.[0] || "";
  assert.match(band, /festival-world festival-world-band/);
  assert.match(band, /<figure class="member-polaroid" data-paper-cutout="scrap">[\s\S]+?<img[^>]+alt=""[\s\S]+?<figcaption class="polaroid-label">/);
  assert.doesNotMatch(band, /performance\.webp/);
  assert.match(tour, /festival-world festival-world-tour/);
  assert.doesNotMatch(tour, /performance\.webp|<div class="media-plane">/);
  assert.equal((css.match(/festival-scribble-fully-shaded\.png/g) || []).length, 1);
  assert.match(css, /\.festival-world-band\s*\{[^}]+background-position:\s*center top/s);
  assert.match(css, /\.festival-world-tour\s*\{[^}]+background-position:\s*82% bottom/s);
  assert.match(css, /\.learn:is\(:not\(\[data-member\]\), \[data-member="band"\]\) \.media-plane img\s*\{\s*opacity:\s*0/s);
  assert.match(css, /\.member-polaroid > \.paper-cutout[^}]+--paper-shadow:[^}]+drop-shadow/s);
  assert.match(css, /\.learn\[data-member="ryan"\] \.member-polaroid[^}]+rotate\(-3\.8deg\)/s);
  assert.match(css, /\.learn\[data-member="kevin"\] \.member-polaroid[^}]+rotate\(3deg\)/s);
  assert.match(css, /\.learn\[data-member="sam"\] \.member-polaroid[^}]+rotate\(-1\.6deg\)/s);
  assert.match(css, /\.member-polaroid img[^}]+filter:\s*sepia\(\.13\) saturate\(\.82\) contrast\(\.9\) brightness\(1\.08\)/s);
  assert.match(css, /\.polaroid-image::before[^}]+mix-blend-mode:\s*screen/s);
  assert.match(css, /\.polaroid-image::after[^}]+paper-grain\.svg[^}]+mix-blend-mode:\s*soft-light/s);
  assert.match(css, /\.polaroid-label[^}]+font-family:\s*var\(--body-face\)/s);
  assert.match(css, /#member-story p[^}]+font-size:\s*calc\(23 \* var\(--composition-unit\)\)/s);
  assert.match(css, /\.gallery-arrow[^}]+width:\s*calc\(82 \* var\(--composition-unit\)\)/s);
  assert.doesNotMatch(css, /\.member-polaroid\s*\{[^}]+(?:background|clip-path|filter):/s);
  assert.match(css, /\.polaroid-image[^}]+clip-path:\s*polygon\([^)]*99\.15% 22%[^)]*\.35% 99\.2%[^)]*\)/s);
  assert.match(source, /name:\s*"Funkadelic Astronaut"[\s\S]+?photo:\s*null/);
  assert.match(source, /name:\s*"Ryan Gavin"[\s\S]+?photo:\s*"assets\/band-13\.webp"/);
  assert.match(source, /name:\s*"Kevin O’Neill"[\s\S]+?photo:\s*"assets\/band-22\.webp"/);
  assert.match(source, /name:\s*"Sam Luba"[\s\S]+?photo:\s*"assets\/band-21\.webp"/);
});
test("hero scraps and individual biographies share one PaperCutout treatment", () => {
  const html = fs.readFileSync("index.html", "utf8");
  const css = fs.readFileSync("styles/sections.css", "utf8");
  const paper = fs.readFileSync("paper-cutout.js", "utf8");
  const paperCss = fs.readFileSync("styles/paper.css", "utf8");
  assert.match(html, /class="member-story" id="member-story" data-paper-cutout="scrap"/);
  assert.match(html, /class="member-polaroid" data-paper-cutout="scrap"/);
  assert.match(paper, /document\.querySelectorAll\('\.navigation a'\)[^;]+mount\(host, \{preset: 'scrap'/);
  assert.match(paper, /document\.querySelectorAll\('\[data-paper-cutout\]'\)[^;]+mount\(host, \{preset:host\.dataset\.paperCutout\}/);
  assert.match(paper, /agingColors:\s*\['#f6e8ca', '#f0dfbc', '#e8d3ab', '#ddc298'\]/);
  assert.match(paper, /\['paper-dark-flecks\.svg', 'print-wear\.svg'\]/);
  assert.match(paper, /classList\.add\('paper-piece'\)/);
  assert.match(paper, /restore\(\)\s*\{[^}]+svg\.parentNode !== host[^}]+host\.prepend\(svg\)[^}]+draw\(\)/s);
  assert.match(source, /memberStory\.replaceChildren\([\s\S]+?window\.PaperCutout\?\.restore\(memberStory\)/);
  assert.match(paperCss, /\.paper-piece > \.paper-cutout\s*\{[^}]+position:\s*absolute;[^}]+inset:\s*0;[^}]+width:\s*100%;[^}]+height:\s*100%;[^}]+z-index:\s*-1/s);
  assert.match(paperCss, /\.paper-piece\s*\{\s*isolation:\s*isolate/);
  assert.match(paperCss, /\.paper-cutout\s*\{[^}]+--paper-shadow:[^;]+[^}]+filter:\s*var\(--paper-shadow\)/s);
  assert.match(paperCss, /\.paper-cutout-fibers\s*\{[^}]+stroke:\s*#fff8e9[^}]+stroke-dasharray:/s);
  assert.match(css, /\.learn:is\(:not\(\[data-member\]\), \[data-member="band"\]\) #member-story > \.paper-cutout\s*\{\s*display:\s*none/);
  assert.match(css, /\.learn\[data-member="kevin"\]:not\(\[data-member="band"\]\) #member-story\s*\{\s*rotate:\s*-1\.25deg/s);
  assert.match(css, /\.learn\[data-member="sam"\]:not\(\[data-member="band"\]\) #member-story\s*\{\s*rotate:\s*\.75deg/s);
  assert.doesNotMatch(css, /#member-story::(?:before|after)/);
  const storyContainerRules = [...css.matchAll(/#member-story\s*\{([^}]*)\}/g)].map((match) => match[1]).join("\n");
  assert.doesNotMatch(storyContainerRules, /(?:background|clip-path|filter):/);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]+?#member-story[^}]+padding:\s*calc\(19 \* var\(--composition-unit\)\)/s);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]+?\.learn\[data-member="kevin"\]:not\(\[data-member="band"\]\) #member-story\s*\{\s*rotate:\s*-\.8deg/s);
});
test("individual biography copy is plain Comic Sans-style ink", () => {
  const html = fs.readFileSync("index.html", "utf8");
  const css = fs.readFileSync("styles/sections.css", "utf8");
  assert.doesNotMatch(html, /id="member-story"[^>]+print-copy|class="[^"]*print-copy[^"]*" id="member-story"/);
  assert.match(css, /\.learn\[data-member\]:not\(\[data-member="band"\]\) #member-story p\s*\{[^}]+font-family:\s*var\(--body-face\);[^}]+font-weight:\s*400;[^}]+-webkit-text-stroke:\s*0;[^}]+paint-order:\s*normal;[^}]+text-shadow:\s*none;[^}]+filter:\s*none;[^}]+mix-blend-mode:\s*normal;/s);
  assert.doesNotMatch(css, /\.learn\[data-member="(?:ryan|kevin|sam)"\][^{]*#member-story p\s*\{/);
  const memberStoryOverrides = [...css.matchAll(/\.learn\[data-member="(?:ryan|kevin|sam)"\][^{]*#member-story\s*\{([^}]*)\}/g)]
    .map((match) => match[1])
    .join("\n");
  assert.doesNotMatch(memberStoryOverrides, /(?:margin|padding|width|font|line-height|text-wrap):/);
});
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
