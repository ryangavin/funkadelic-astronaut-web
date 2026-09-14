const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("app.js", "utf8");
test("Band and Tour reuse one festival asset through distinct decorative layers", () => {
  const html = fs.readFileSync("index.html", "utf8");
  const css = fs.readFileSync("styles/sections.css", "utf8");
  const paper = fs.readFileSync("paper-cutout.js", "utf8");
  const band = html.match(/<section\s+class="scene learn"[\s\S]+?<\/section>/)?.[0] || "";
  const tour = html.match(/<section\s+class="scene live"[\s\S]+?<\/section>/)?.[0] || "";
  assert.match(band, /festival-world festival-world-band/);
  assert.match(band, /<figure class="member-polaroid" data-paper-cutout="scrap" data-paper-edge="soft">[\s\S]+?<img[^>]+alt=""[\s\S]+?<figcaption class="polaroid-label">/);
  assert.match(band, /class="band-dossier" data-paper-cutout="scrap" data-paper-edge="soft"/);
  assert.match(band, /class="dossier-tab" data-paper-cutout="scrap" data-paper-edge="soft">TOUR DOSSIER · 2012—NOW/);
  assert.equal((band.match(/data-replaceable-group-photo/g) || []).length, 1);
  assert.match(band, /data-replaceable-group-photo>[\s\S]+?<img src="assets\/performance\.webp" width="1920" height="1080" alt="Funkadelic Astronaut performing live"/);
  assert.match(band, /class="dossier-stamp"[^>]*>Funkadelic Astronaut/);
  assert.match(band, /class="dossier-route"[^>]*>NJ ↗ NORTHEAST/);
  assert.match(tour, /festival-world festival-world-tour/);
  assert.doesNotMatch(tour, /performance\.webp|<div class="media-plane">/);
  assert.equal((css.match(/festival-scribble-fully-shaded\.png/g) || []).length, 2);
  assert.match(css, /\.festival-world-band\s*\{[^}]+background-position:\s*center top/s);
  assert.match(css, /\.festival-world-tour\s*\{[^}]+background-size:\s*auto 265%;[^}]+background-position:\s*8% 96%/s);
  assert.match(html, /<filter id="tour-posterize"[\s\S]+?<feComponentTransfer>[\s\S]+?type="discrete"/);
  assert.match(css, /\.festival-world-tour\s*\{[^}]+filter:\s*url\(#tour-posterize\) contrast\(1\.28\) saturate\(\.86\)/s);
  assert.match(css, /\.festival-world-tour::before\s*\{[^}]+festival-scribble-fully-shaded\.png[^}]+mix-blend-mode:\s*multiply/s);
  assert.match(css, /\.festival-world-tour::after\s*\{[^}]+radial-gradient[^}]+mix-blend-mode:\s*multiply/s);
  assert.match(css, /\.learn:is\(:not\(\[data-member\]\), \[data-member="band"\]\) \.media-plane img\s*\{\s*opacity:\s*0/s);
  assert.match(css, /:is\(\.member-polaroid, #member-story\) > \.paper-cutout[^}]+--paper-shadow:\s*var\(--member-paper-shadow\)/s);
  assert.match(css, /\.learn\[data-member="ryan"\] \.member-polaroid[^}]+rotate\(-3\.8deg\)/s);
  assert.match(css, /\.learn\[data-member="kevin"\] \.member-polaroid[^}]+rotate\(3deg\)/s);
  assert.match(css, /\.learn\[data-member="sam"\] \.member-polaroid[^}]+rotate\(-1\.6deg\)/s);
  assert.match(css, /\.member-polaroid img[^}]+filter:\s*sepia\(\.13\) saturate\(\.82\) contrast\(\.9\) brightness\(1\.08\)/s);
  assert.match(css, /\.polaroid-image::before[^}]+mix-blend-mode:\s*screen/s);
  assert.match(css, /\.polaroid-image::after[^}]+paper-grain\.svg[^}]+mix-blend-mode:\s*soft-light/s);
  assert.match(css, /\.polaroid-label[^}]+font-family:\s*var\(--body-face\)/s);
  assert.match(css, /\.polaroid-label[^}]+display:\s*flex;[^}]+align-items:\s*baseline;[^}]+justify-content:\s*space-between;[^}]+column-gap:\s*calc\(18 \* var\(--composition-unit\)\)/s);
  assert.match(css, /#polaroid-member-name[^}]+white-space:\s*nowrap/s);
  assert.match(css, /#polaroid-member-role[^}]+margin-top:\s*0;[^}]+text-align:\s*right/s);
  assert.match(css, /#polaroid-member-role[^}]+font-family:\s*var\(--body-face\);[^}]+font-size:\s*calc\(21 \* var\(--composition-unit\)\)/s);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]+?#polaroid-member-role[^}]+font-size:\s*calc\(14 \* var\(--composition-unit\)\)/s);
  assert.match(css, /#member-story p[^}]+font-size:\s*calc\(23 \* var\(--composition-unit\)\)/s);
  assert.match(css, /\.gallery-arrow[^}]+width:\s*calc\(82 \* var\(--composition-unit\)\)/s);
  assert.match(css, /\.gallery-arrow-icon\s*\{[^}]+fill:\s*var\(--red\);[^}]+drop-shadow\(0 0 1px var\(--cream\)\)[^}]+drop-shadow\(2px 3px 0 var\(--ink-black\)/s);
  assert.match(css, /\.gallery-arrow:focus-visible\s*\{[^}]+outline:\s*none;[^}]+box-shadow:\s*none/s);
  assert.match(css, /\.gallery-arrow:focus-visible \.gallery-arrow-cutout\s*\{[^}]+drop-shadow\(0 0 4px var\(--red\)\)/s);
  assert.match(css, /\.gallery-arrow:active \.gallery-arrow-cutout\s*\{[^}]+scale\(\.94\)/s);
  assert.match(css, /\.gallery-arrow:disabled\s*\{[^}]+opacity:\s*\.46;[^}]+cursor:\s*not-allowed/s);
  assert.match(css, /\.gallery-controls \.gallery-arrow\s*\{[^}]+width:\s*64px;[^}]+height:\s*64px/s);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]+?\.gallery-controls \.gallery-arrow\s*\{[^}]+width:\s*48px;[^}]+height:\s*48px/s);
  assert.equal((band.match(/class="gallery-arrow-cutout"/g) || []).length, 2);
  assert.doesNotMatch(band, /class="gallery-arrow"[^>]+data-paper-cutout/);
  assert.equal((band.match(/class="gallery-arrow-icon"/g) || []).length, 2);
  assert.match(css, /\.gallery-arrow-cutout > \.paper-cutout\s*\{[^}]+--paper-shadow:[^}]+drop-shadow/s);
  assert.match(paper, /const controlArrowPaths = \{[\s\S]+?'previous-member': 'M3 15 18 3[\s\S]+?'next-member': 'M37 15 22 3/);
  assert.match(paper, /querySelectorAll\('\.gallery-arrow-cutout'\)\.forEach\(host => mount\(host, \{[\s\S]+?preset: 'scrap',[\s\S]+?path: controlArrowPaths\[host\.closest\('\.gallery-arrow'\)\.id\],[\s\S]+?width: 40,[\s\S]+?height: 32,[\s\S]+?margin: 9,[\s\S]+?tear: 2\.4,[\s\S]+?edgeHighlight: \.45/);
  assert.match(css, /\.gallery-controls \.gallery-arrow\s*\{[^}]+background:\s*transparent;[^}]+overflow:\s*visible/s);
  assert.doesNotMatch(css, /#(?:previous|next)-member > \.paper-cutout[^}]+(?:clip-path|background|rotate):/s);
  assert.match(band, /<\/div>\s*<div class="gallery-controls" aria-label="Band gallery controls">[\s\S]+?<\/div>\s*<\/section>/);
  assert.match(css, /\.learn > \.gallery-controls\s*\{[^}]+position:\s*absolute;[^}]+inset:\s*50% calc\(18 \* var\(--composition-unit\)\) auto;[^}]+pointer-events:\s*none/s);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]+?\.learn > \.gallery-controls\s*\{[^}]+inset:\s*auto 0 calc\(64 \* var\(--composition-unit\)\);[^}]+display:\s*block/s);
  assert.match(css, /\.gallery-controls #previous-member\s*\{\s*left:\s*calc\(50% - 78 \* var\(--composition-unit\)\)/s);
  assert.match(css, /\.gallery-controls #next-member\s*\{\s*right:\s*calc\(50% - 62 \* var\(--composition-unit\)\)/s);
  assert.match(source, /section\s*\.querySelector\("\.gallery-controls"\)\s*\.addEventListener\("keydown"/s);
  assert.match(css, /\.member-polaroid\s*\{[^}]+width:\s*calc\(460 \* var\(--composition-unit\)\)/s);
  assert.match(css, /\.learn\[data-member="ryan"\] \.member-polaroid\s*\{[^}]+left:\s*10%/s);
  assert.match(css, /\.learn\[data-member="kevin"\] \.member-polaroid\s*\{[^}]+right:\s*10%/s);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]+?\.member-polaroid\s*\{[^}]+width:\s*calc\(248 \* var\(--composition-unit\)\)/s);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]+?\.learn\[data-member="ryan"\] \.member-polaroid\s*\{[^}]+left:\s*47%;[^}]+translateX\(-50%\)/s);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]+?\.learn\[data-member="kevin"\] \.member-polaroid\s*\{[^}]+left:\s*53%;[^}]+right:\s*auto/s);
  assert.doesNotMatch(css, /\.member-polaroid\s*\{[^}]+(?:background|clip-path|filter):/s);
  assert.match(css, /\.polaroid-image[^}]+clip-path:\s*polygon\([^)]*99\.15% 22%[^)]*\.35% 99\.2%[^)]*\)/s);
  assert.match(source, /name:\s*"Funkadelic Astronaut"[\s\S]+?photo:\s*null/);
  assert.match(source, /name:\s*"Ryan Gavin"[\s\S]+?photo:\s*"assets\/band-13\.webp"/);
  assert.match(source, /name:\s*"Kevin O’Neill"[\s\S]+?photo:\s*"assets\/band-22\.webp"/);
  assert.match(source, /name:\s*"Sam Luba"[\s\S]+?photo:\s*"assets\/band-21\.webp"/);
  assert.match(source, /function slideContent\(direction, outgoing, fromOverview = false\)/);
  assert.match(source, /fromOverview[\s\S]+?translate:\s*"42% 12px"[\s\S]+?scale:\s*\.86/);
  assert.match(source, /const fromOverview = selected === 0 && next === 1;[\s\S]+?slideContent\(direction, false, fromOverview\)/);
  assert.match(css, /\.band-dossier > \.paper-cutout\s*\{\s*--paper-shadow:\s*var\(--dossier-shadow\)/);
  assert.match(css, /\.dossier-proof\s*\{[^}]+rotate:\s*-2\.25deg/s);
  assert.match(css, /\.band-dossier::after\s*\{[^}]+clip-path:\s*polygon\(0 100%, 100% 0, 100% 100%\)/s);
});
test("biographies and Polaroids use distinct edges on one shared PaperCutout material", () => {
  const html = fs.readFileSync("index.html", "utf8");
  const css = fs.readFileSync("styles/sections.css", "utf8");
  const paper = fs.readFileSync("paper-cutout.js", "utf8");
  const paperCss = fs.readFileSync("styles/paper.css", "utf8");
  assert.match(html, /class="member-story" id="member-story" data-paper-cutout="scrap" data-paper-edge="hand-torn"/);
  assert.match(html, /class="member-polaroid" data-paper-cutout="scrap" data-paper-edge="soft"/);
  assert.match(paper, /document\.querySelectorAll\('\.navigation a'\)[^;]+mount\(host, \{preset: 'scrap'/);
  assert.match(paper, /document\.querySelectorAll\('\[data-paper-cutout\]'\)[\s\S]+?preset:\s*host\.dataset\.paperCutout,[\s\S]+?edge:\s*host\.dataset\.paperEdge/);
  assert.match(paper, /agingColors:\s*\['#f6e8ca', '#f0dfbc', '#e8d3ab', '#ddc298'\]/);
  assert.match(paper, /\['paper-dark-flecks\.svg', 'print-wear\.svg'\]/);
  assert.match(paper, /classList\.add\('paper-piece'\)/);
  assert.match(paper, /function handTornPath\([^)]*\)[\s\S]+?Math\.min\(9, Math\.max\(5,[\s\S]+?profiles = corners === 'tr-bl'[\s\S]+?top\[0\][\s\S]+?top\[top\.length - 1\][\s\S]+?right\[right\.length - 1\][\s\S]+?bottom\[bottom\.length - 1\][\s\S]+?return `M\$\{points/);
  assert.match(paper, /function softWavyPath\([^)]*clipCorner\)[\s\S]+?Math\.min\(2\.4, Math\.max\(1\.25,[\s\S]+?const points = \[\[0, 0\]\][\s\S]+?points\.push\(\[width, height\]\)[\s\S]+?clipCorner === 'bottom-left'[\s\S]+?\[clip, height\], \[0, height - clip\]/);
  assert.match(paper, /settings\.edge === 'hand-torn'[\s\S]+?handTornPath\(width, height, unitsPerPixel, settings\.edgeSeed \?\? serial, settings\.corners\)[\s\S]+?settings\.edge === 'soft'[\s\S]+?softWavyPath\(width, height, unitsPerPixel, settings\.edgeSeed \?\? serial, settings\.clipCorner\)/);
  assert.match(paper, /update\(host, next\)[^}]+instances\.get\(host\)\?\.update\(next\)/s);
  assert.match(source, /name:\s*"Ryan Gavin"[\s\S]+?paperCorners:\s*"tl-br"[\s\S]+?paperSeed:\s*1/);
  assert.match(source, /name:\s*"Kevin O’Neill"[\s\S]+?paperCorners:\s*"tr-bl"[\s\S]+?paperSeed:\s*2/);
  assert.match(source, /name:\s*"Sam Luba"[\s\S]+?paperCorners:\s*"tl-br"[\s\S]+?paperSeed:\s*3/);
  assert.match(source, /PaperCutout\?\.update\?\.\(memberStory,[\s\S]+?edge:\s*"hand-torn"[\s\S]+?corners:\s*member\.paperCorners[\s\S]+?PaperCutout\?\.update\?\.\(polaroid,[\s\S]+?edge:\s*"soft"[\s\S]+?edgeSeed:\s*member\.paperSeed \+ 11,[\s\S]+?clipCorner:\s*member\.polaroidClipCorner/);
  assert.equal((source.match(/polaroidClipCorner:\s*"bottom-left"/g) || []).length, 1);
  assert.equal((source.match(/polaroidClipCorner:\s*null/g) || []).length, 3);
  assert.match(source, /name:\s*"Ryan Gavin"[\s\S]+?polaroidClipCorner:\s*"bottom-left"/);
  assert.match(source, /name:\s*"Kevin O’Neill"[\s\S]+?polaroidClipCorner:\s*null/);
  assert.match(source, /name:\s*"Sam Luba"[\s\S]+?polaroidClipCorner:\s*null/);
  assert.match(paper, /restore\(\)\s*\{[^}]+svg\.parentNode !== host[^}]+host\.prepend\(svg\)[^}]+draw\(\)/s);
  assert.match(source, /memberStory\.replaceChildren\([\s\S]+?window\.PaperCutout\?\.restore\(memberStory\)/);
  assert.match(paperCss, /\.paper-piece > \.paper-cutout\s*\{[^}]+position:\s*absolute;[^}]+inset:\s*0;[^}]+width:\s*100%;[^}]+height:\s*100%;[^}]+z-index:\s*-1/s);
  assert.match(paperCss, /\.paper-piece\s*\{\s*isolation:\s*isolate/);
  assert.match(paperCss, /\.paper-cutout\s*\{[^}]+--paper-shadow:[^;]+[^}]+filter:\s*var\(--paper-shadow\)/s);
  assert.match(css, /--member-paper-shadow:[^;]+drop-shadow[^;]+;/s);
  assert.match(css, /:is\(\.member-polaroid, #member-story\) > \.paper-cutout\s*\{[^}]+--paper-shadow:\s*var\(--member-paper-shadow\)/s);
  assert.match(paperCss, /\.paper-cutout-fibers\s*\{[^}]+stroke:\s*#fff8e9[^}]+stroke-dasharray:/s);
  assert.match(css, /\.learn:is\(:not\(\[data-member\]\), \[data-member="band"\]\) #member-story > \.paper-cutout\s*\{\s*display:\s*none/);
  assert.match(css, /\.learn\[data-member="kevin"\]:not\(\[data-member="band"\]\) #member-story\s*\{\s*rotate:\s*-1\.25deg/s);
  assert.match(css, /\.learn\[data-member="sam"\]:not\(\[data-member="band"\]\) #member-story\s*\{\s*rotate:\s*\.75deg/s);
  assert.doesNotMatch(css, /#member-story::(?:before|after)/);
  const storyContainerRules = [...css.matchAll(/#member-story\s*\{([^}]*)\}/g)].map((match) => match[1]).join("\n");
  assert.doesNotMatch(storyContainerRules, /(?:background|clip-path|filter):/);
  assert.match(css, /\.learn\[data-member\]:not\(\[data-member="band"\]\) #member-story\s*\{[^}]+padding:\s*calc\(23 \* var\(--composition-unit\)\) calc\(26 \* var\(--composition-unit\)\) calc\(21 \* var\(--composition-unit\)\)/s);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]+?#member-story[^}]+padding:\s*calc\(15 \* var\(--composition-unit\)\) calc\(18 \* var\(--composition-unit\)\) calc\(14 \* var\(--composition-unit\)\)/s);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]+?\.learn\[data-member="kevin"\]:not\(\[data-member="band"\]\) #member-story\s*\{\s*rotate:\s*-\.8deg/s);
});
test("individual biography copy uses the bundled Caveat signature face without print effects", () => {
  const html = fs.readFileSync("index.html", "utf8");
  const css = fs.readFileSync("styles/sections.css", "utf8");
  assert.doesNotMatch(html, /id="member-story"[^>]+print-copy|class="[^"]*print-copy[^"]*" id="member-story"/);
  assert.match(css, /\.learn\[data-member\]:not\(\[data-member="band"\]\) #member-story p\s*\{[^}]+font-family:\s*Caveat, cursive;[^}]+font-size:\s*calc\(30 \* var\(--composition-unit\)\);[^}]+font-weight:\s*560;[^}]+line-height:\s*1\.28;[^}]+-webkit-text-stroke:\s*0;[^}]+text-shadow:\s*none;[^}]+filter:\s*none/s);
  assert.doesNotMatch(css, /\.learn\[data-member="(?:ryan|kevin|sam)"\][^{]*#member-story p\s*\{/);
  const memberStoryOverrides = [...css.matchAll(/\.learn\[data-member="(?:ryan|kevin|sam)"\][^{]*#member-story\s*\{([^}]*)\}/g)]
    .map((match) => match[1])
    .join("\n");
  assert.doesNotMatch(memberStoryOverrides, /(?:margin|padding|width|font|line-height|text-wrap):/);
});
test("design-critical typography is locally bundled and member signatures stay distinct", () => {
  const html = fs.readFileSync("index.html", "utf8");
  const base = fs.readFileSync("styles/base.css", "utf8");
  const css = fs.readFileSync("styles/sections.css", "utf8");
  assert.doesNotMatch(html, /fonts\.(?:googleapis|gstatic)\.com/);
  assert.match(base, /--body-face:\s*"Balsamiq Sans", "Comic Sans MS"/);
  for (const [family, asset] of [
    ["Balsamiq Sans", "balsamiq-sans/BalsamiqSans-Regular.ttf"],
    ["Modak", "modak/Modak-Regular.ttf"],
    ["Caveat", "caveat/Caveat-Variable.ttf"],
    ["Pacifico", "pacifico/Pacifico-Regular.ttf"],
    ["Sacramento", "sacramento/Sacramento-Regular.ttf"],
  ]) {
    assert.match(base, new RegExp(`@font-face \\{[\\s\\S]+?font-family: (?:"${family}"|${family});[\\s\\S]+?${asset.replace(/[.]/g, "\\.")}`));
    assert(fs.existsSync(`assets/fonts/${asset}`));
    assert(fs.existsSync(`assets/fonts/${asset.split("/")[0]}/OFL.txt`));
  }
  assert.match(css, /\.learn\[data-member="ryan"\] \.member-polaroid[^}]+--member-signature-face:\s*"Pacifico"/s);
  assert.match(css, /\.learn\[data-member="kevin"\] \.member-polaroid[^}]+--member-signature-face:\s*"Caveat"/s);
  assert.match(css, /\.learn\[data-member="sam"\] \.member-polaroid[^}]+--member-signature-face:\s*"Sacramento"/s);
  assert.match(css, /#polaroid-member-name[^}]+font-family:\s*var\(--member-signature-face, var\(--body-face\)\)/s);
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
