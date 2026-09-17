const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('Handbill is a quarter-sheet of coloured card printed both sides and turned over by hand', () => {
  const component = read('src/experiments/BandIntro/Handbill.tsx');
  const css = read('src/experiments/BandIntro/Handbill.css');

  assert.match(component, /HANDBILL_STOCKS = \['goldenrod', 'orange', 'pink', 'sky', 'white'\]/);
  assert.match(component, /HANDBILL_SPOTS = \['red', 'blue', 'purple', 'green', 'amber'\]/);
  // Both faces are always drawn; the one facing down is hidden from readers.
  assert.match(component, /className="handbill__face handbill__face--front"[\s\S]+?aria-hidden=\{side !== 'front'\} inert=\{side !== 'front'\}/);
  assert.match(component, /className="handbill__face handbill__face--back"[\s\S]+?aria-hidden=\{side !== 'back'\} inert=\{side !== 'back'\}/);
  // The card itself is the control, and a second click mid-air does nothing.
  assert.match(component, /aria-label=\{side === 'front' \? 'Turn the handbill over' : 'Turn the handbill back'\}/);
  assert.match(component, /if \(turning \|\| next === side\) return;/);
  assert.match(component, /role="status" aria-live="polite"/);
  for (const piece of ['HandbillKicker', 'HandbillTitle', 'HandbillArt', 'HandbillPhoto', 'HandbillBand', 'HandbillBody', 'HandbillFoot']) {
    assert.match(component, new RegExp(`export function ${piece}\\(`));
  }

  // 4¼ x 5½ inches, in 720ths of the width.
  assert.match(css, /--handbill-unit: calc\(100cqw \/ 720\)/);
  assert.match(css, /aspect-ratio: 720 \/ 932/);
  // Two inks, the spot colour a hair off register.
  assert.match(css, /--handbill-shift-x: calc\(3 \* var\(--handbill-unit\)\)/);
  assert.match(css, /\.handbill-print__title-ink \{\s+filter: drop-shadow\(var\(--handbill-shift-x\) var\(--handbill-shift-y\) 0 var\(--handbill-spot\)\)/);
  // The lift and the turn are separate motions; the shadow spreads while the card is up.
  assert.match(css, /\.handbill\[data-side='back'\] \.handbill__card \{\s+transform: rotateY\(180deg\)/);
  assert.match(css, /\.handbill\[data-turning\] \.handbill__lift \{\s+animation: handbill-lift/);
  assert.match(css, /\.handbill\[data-turning\] \.handbill__shadow \{\s+animation: handbill-shadow/);
  assert.match(css, /\.handbill__face--back \{\s+transform: rotateY\(180deg\)/);
  assert.match(css, /prefers-reduced-motion: reduce\) \{\s+\.handbill__card \{\s+transition: none/);
  // One-ink art: dark is ink, light is stock.
  assert.match(css, /\.handbill-print__ink-image \{[\s\S]+?mix-blend-mode: multiply/);
});

test('MiniZine is eight photocopied pages on four leaves that hinge on the spine', () => {
  const component = read('src/experiments/BandIntro/MiniZine.tsx');
  const css = read('src/experiments/BandIntro/MiniZine.css');

  assert.match(component, /ZINE_STOCKS = \['white', 'canary', 'goldenrod', 'lilac', 'pink'\]/);
  assert.match(component, /export const ZINE_PAGES = 8;/);
  assert.match(component, /export const ZINE_LEAVES = ZINE_PAGES \/ 2;/);
  // A leaf carries a page on each side; only the pages in the open spread are read.
  assert.match(component, /const rectoShown = spread === leaf - 1;/);
  assert.match(component, /const versoShown = spread === leaf;/);
  assert.match(component, /\{sheets\[2 \* leaf - 2\]\}/);
  assert.match(component, /\{sheets\[2 \* leaf - 1\]\}/);
  // Right page turns forward, left page turns back; arrow keys do the same.
  assert.match(component, /aria-label="Turn the page"/);
  assert.match(component, /aria-label="Turn back"/);
  assert.match(component, /if \(event\.key === 'ArrowRight'\) turnTo\(spread \+ 1\);/);
  assert.match(component, /describeSpread = \(spread: number\) =>/);

  // A page is 2¾ x 4¼ inches; the spread is 1440 wide like the folder.
  assert.match(css, /--zine-unit: calc\(100cqw \/ 1440\)/);
  assert.match(css, /aspect-ratio: 1440 \/ 1113/);
  assert.match(css, /\.zine__leaf \{[\s\S]+?transform-origin: 0 50%/);
  assert.match(css, /\.zine__leaf\[data-turned\] \{[\s\S]+?rotateY\(-180deg\)/);
  assert.match(css, /\.zine__page--verso \{\s+transform: rotateY\(180deg\)/);
  // Closed, the booklet slides over to sit in the middle.
  assert.match(css, /\.zine\[data-closed='front'\] \.zine__book \{\s+translate: -25% 0/);
  assert.match(css, /\.zine\[data-closed='back'\] \.zine__book \{\s+translate: 25% 0/);
  // The copier: skewed print, toner speckle, photographs with no greys.
  assert.match(css, /\.zine__print \{[\s\S]+?rotate: calc\(sin\(var\(--zine-page\) \* 2\.4\) \* 0\.7deg\)/);
  assert.match(css, /\.zine__page::before \{[\s\S]+?paper-dark-flecks\.svg/);
  assert.match(css, /\.zine-print__photo img \{[\s\S]+?filter: grayscale\(1\) contrast\(1\.9\)/);
  assert.match(css, /prefers-reduced-motion: reduce\) \{\s+\.zine__book,\s+\.zine__leaf \{\s+transition: none/);

  const pages = read('src/experiments/BandIntro/MiniZine.band.tsx');
  assert.match(pages, /export const BAND_ZINE_PAGES = \[/);
  assert.equal((pages.match(/<ZineFolio page=\{(\d|page)\}/g) || []).length, 5);
});

test('OneSheet is a letter page Z-folded in three, with the lower panels hung from the creases', () => {
  const component = read('src/components/2D/OneSheet/OneSheet.tsx');
  const css = read('src/components/2D/OneSheet/OneSheet.css');

  assert.match(component, /ONE_SHEET_STOCKS = \['bond', 'ivory', 'grey'\]/);
  // The middle panel is inside the top one, the bottom inside the middle, so the fold's geometry is the nesting.
  assert.match(component, /className="one-sheet__panel one-sheet__panel--a">[\s\S]+?className="one-sheet__panel one-sheet__panel--b">[\s\S]+?className="one-sheet__panel one-sheet__panel--c">/);
  assert.match(component, /aria-label="Unfold the one-sheet"[\s\S]+?aria-expanded="false"/);
  assert.match(component, /aria-label="Fold the one-sheet"[\s\S]+?aria-expanded="true"/);
  assert.match(component, /export const ONE_SHEET_PULL_MS = 900;/);
  // The pull is one motion; folding back is two tucks.
  assert.match(component, /\}, next \? duration : duration \* 1\.05\);/);

  assert.match(css, /--one-sheet-unit: calc\(100cqw \/ 720\)/);
  assert.match(css, /--one-sheet-panel: calc\(932 \/ 3 \* var\(--one-sheet-unit\)\)/);
  // Opening: the fold runs from 1 to 0 and every panel's angle is a function of it, so the bottom panel stays level.
  assert.match(css, /@property --one-sheet-fold \{\s+syntax: '<number>';/);
  assert.match(css, /transition: --one-sheet-fold var\(--one-sheet-pull\)/);
  assert.match(css, /\.one-sheet\[data-open='true'\] \{\s+--one-sheet-fold: 0;/);
  assert.match(css, /\.one-sheet__panel--a \{[\s\S]+?transform: rotateX\(calc\(var\(--one-sheet-spring\) \* var\(--one-sheet-fold\)\)\)/);
  // The middle panel folds back a ply behind the top; the bottom folds forward a ply in front of the middle,
  // sprung by 1.6 and 2.6 times the top's tilt.
  assert.match(css, /\.one-sheet__panel--b \{\s+transform: translateZ\(calc\(-1 \* var\(--one-sheet-ply\) \* var\(--one-sheet-fold\)\)\)\s+rotateX\(calc\(\(var\(--one-sheet-spring\) \* 1\.6 - 180deg\) \* var\(--one-sheet-fold\)\)\)/);
  assert.match(css, /\.one-sheet__panel--c \{\s+transform: translateZ\(calc\(var\(--one-sheet-ply\) \* var\(--one-sheet-fold\)\)\)\s+rotateX\(calc\(\(180deg - var\(--one-sheet-spring\) \* 2\.6\) \* var\(--one-sheet-fold\)\)\)/);
  // Folding: the fold jumps and the panels transition themselves, the bottom first and the middle after it.
  assert.match(css, /\.one-sheet\[data-open='false'\] \{\s+--one-sheet-tuck: calc\(var\(--one-sheet-pull\) \* 0\.6\);\s+transition: none;/);
  assert.match(css, /\.one-sheet\[data-open='false'\]\[data-moving\] \.one-sheet__panel--b \{\s+transition-delay: calc\(var\(--one-sheet-tuck\) \* 0\.75\)/);
  // Folded, the creases spring: the top panel tilts and the bottom panel shows beneath it; more so under the pointer.
  assert.match(css, /--one-sheet-spring: 12deg;/);
  assert.match(css, /\.one-sheet\[data-open='false'\] \.one-sheet__scene:hover \{\s+--one-sheet-spring: 17deg/);
  // The page flows around the sheet: the scene's height is the same function of the fold.
  assert.match(css, /\.one-sheet__scene \{[\s\S]+?height: calc\(\s+var\(--one-sheet-panel\) \*/);
  // One shadow under the whole sheet, always; the faces cast nothing, so nothing hands off mid-motion.
  assert.match(css, /\.one-sheet__face \{[\s\S]+?box-shadow: inset 0 0 0 1px rgb\(60 55 50 \/ 0\.06\);/);
  // The shadow is the footprint on the desk: the bottom panel when folded, the whole sheet when flat.
  assert.match(css, /\.one-sheet__shadow \{\s+position: absolute;\s+inset: 0;\s+top: calc\(\s+var\(--one-sheet-fold\) \* var\(--one-sheet-panel\) \*/);
  assert.doesNotMatch(css, /:not\(\[data-moving\]\)/);
  // The copy is set in a book serif; only the letterhead keeps the logo face.
  assert.match(css, /--one-sheet-serif: 'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, 'Times New Roman', serif;/);
  assert.match(css, /\.one-sheet \{[\s\S]+?font-family: var\(--one-sheet-serif\)/);
  assert.match(css, /\.one-sheet-print__name \{[\s\S]+?font-family: var\(--font-display, serif\)/);
  // A photograph across the crease is printed on both panels: a strip flush with the bottom of the
  // top panel, and the rest flush with the top of the middle one, from where the strip left off.
  assert.match(component, /export function OneSheetPhotoSpill\(/);
  assert.match(css, /\.one-sheet-print__photo\[data-spill\] img \{\s+margin-top: calc\(-1 \* var\(--one-sheet-photo-spill, 0\) \* var\(--one-sheet-unit\)\)/);
  assert.match(css, /\.one-sheet-print__photo-spill \{[\s\S]+?margin: auto calc\(-12 \* var\(--one-sheet-unit\)\) calc\(-24 \* var\(--one-sheet-unit\)\)/);
  // The panel that shows folded carries the one-liner and the bands they have shared a stage with.
  const content = read('src/sections/BandDossier/bandOneSheet.tsx');
  assert.match(content, /SHARED_STAGES = \['The New Deal', 'Dopapod', 'Kung Fu', 'Consider the Source', 'Space Bacon', 'Solar Circuit'\]/);
  assert.doesNotMatch(content, /BAND_ONE_SHEET_TOP = \([\s\S]+?BAND_PACKET\.card\.children[\s\S]+?\n\);\n\n\/\*\* The middle/);
  assert.match(css, /\.one-sheet__crease--mountain \{/);
  assert.match(css, /\.one-sheet__crease--valley \{/);
});
