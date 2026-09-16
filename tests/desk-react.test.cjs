const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('Desk is a wooden top in sheet units whose surface measures against the desk itself', () => {
  const component = read('src/components/Desk/Desk.tsx');
  const css = read('src/components/Desk/Desk.css');

  assert.match(component, /DESK_WOODS = \['walnut', 'oak', 'ebony'\]/);
  assert.match(component, /DESK_WIDTH = 1440/);
  // The grain is drawn: bands of tone bent by turbulence, pores over them.
  assert.match(component, /<feTurbulence type="fractalNoise" baseFrequency="0\.0022 0\.03"/);
  assert.match(component, /<feDisplacementMap in="SourceGraphic" in2="wave"/);
  assert.match(component, /className="desk__board"/);
  assert.match(component, /className="desk__pores"/);
  // Pins work on it, and the height in desk units is measured one level in from the container.
  assert.match(css, /\.desk \{[\s\S]+?--sheet-unit: calc\(100cqw \/ 1440\)/);
  assert.match(css, /\.desk \{[\s\S]+?container-type: inline-size/);
  assert.match(css, /\.desk__top \{[\s\S]+?height: calc\(var\(--desk-height\) \* var\(--sheet-unit\)\)/);
  assert.match(css, /\.desk__top \{[\s\S]+?overflow: clip/);
  assert.match(css, /\.desk\[data-wood='oak'\] \{/);
  assert.match(css, /\.desk__bands \{[\s\S]+?mix-blend-mode: soft-light/);
  assert.match(css, /\.desk__light \{[\s\S]+?radial-gradient/);
});

test('The desk things: mug, ring, pens, sticky note and pick, each sized by its parent', () => {
  const mug = read('src/components/Mug/Mug.tsx');
  assert.match(mug, /coffee = 0\.7/);
  assert.match(mug, /const surface = 54 - \(1 - level\) \* 5/);
  assert.match(mug, /className="mug__shadow"/);
  assert.match(mug, /className="mug__handle"/);
  assert.match(mug, /level > 0\.02 \? \(/);
  assert.match(mug, /className="mug__dregs"/);
  const ring = read('src/components/Mug/CoffeeRing.tsx');
  assert.match(ring, /strokeDasharray=/);
  const mugCss = read('src/components/Mug/Mug.css');
  assert.match(mugCss, /\.coffee-ring \{[\s\S]+?mix-blend-mode: multiply/);
  assert.match(mugCss, /\.mug \{[\s\S]+?aspect-ratio: 1/);

  const pen = read('src/components/Pen/Pen.tsx');
  assert.match(pen, /PEN_KINDS = \['ballpoint', 'marker', 'pencil'\]/);
  assert.match(pen, /viewBox="0 0 720 60"/);
  assert.match(pen, /className="pen__tube"/);
  assert.match(pen, /className="pen__lead"/);
  const penCss = read('src/components/Pen/Pen.css');
  assert.match(penCss, /\.pen \{[\s\S]+?--pen-unit: calc\(100cqw \/ 720\)/);
  assert.match(penCss, /\.pen \{[\s\S]+?aspect-ratio: 720 \/ 60/);
  // The shadow uses the pen's own units, which only its children can measure.
  assert.match(penCss, /\.pen svg \{[\s\S]+?filter: drop-shadow\(calc\(3 \* var\(--pen-unit\)\)/);

  const note = read('src/components/StickyNote/StickyNote.tsx');
  assert.match(note, /STICKY_NOTE_COLORS = \['canary', 'pink', 'blue', 'green', 'orange'\]/);
  assert.match(note, /curl = 'right'/);
  assert.match(note, /className="sticky-note__curl"/);
  const noteCss = read('src/components/StickyNote/StickyNote.css');
  assert.match(noteCss, /--sticky-note-unit: calc\(100cqw \/ 720\)/);
  assert.match(noteCss, /\.sticky-note\[data-curl='right'\] \.sticky-note__paper \{\s+clip-path: polygon/);
  assert.match(noteCss, /\.sticky-note \{[\s\S]+?font-family: var\(--font-handwritten/);

  const pick = read('src/components/GuitarPick/GuitarPick.tsx');
  assert.match(pick, /viewBox="0 0 100 116"/);
  assert.match(pick, /print = 'FA'/);
  assert.match(read('src/components/GuitarPick/GuitarPick.css'), /aspect-ratio: 100 \/ 116/);
});

test('Spill packs loose things on a point and sends them out in order when opened', () => {
  const behavior = read('src/behaviors/Spill/Spill.tsx');
  const css = read('src/behaviors/Spill/Spill.css');

  assert.match(behavior, /SPILL_FLIGHT_MS = 900/);
  assert.match(behavior, /SPILL_STAGGER_MS = 110/);
  assert.match(behavior, /export function Spill\(/);
  assert.match(behavior, /export function Spilled\(/);
  assert.match(behavior, /data-open=\{open \? 'true' : 'false'\}/);
  assert.match(behavior, /data-from=\{from \? 'point' : 'centre'\}/);
  // Later items leave later and land on top.
  assert.match(behavior, /'--spilled-delay': `\$\{order \* stagger\}ms`/);
  assert.match(css, /\.spilled \{[\s\S]+?z-index: calc\(1 \+ var\(--spilled-order\)\)/);
  // Placed like a Pin: the unit defaults to the sheet's.
  assert.match(css, /--spill-unit: var\(--sheet-unit, 1px\)/);
  assert.match(css, /\.spilled \{[\s\S]+?translate: calc\(var\(--spilled-x\) \* var\(--spill-unit\)\) calc\(var\(--spilled-y\) \* var\(--spill-unit\)\)/);
  // Packed: on the point, turned, and hidden once the flight back has ended.
  assert.match(css, /\.spill\[data-open='false'\] \.spilled \{[\s\S]+?rotate: var\(--spilled-from-rotation\);\s+visibility: hidden;/);
  assert.match(css, /visibility 0s linear calc\(var\(--spilled-delay\) \+ var\(--spill-flight\) \* 0\.8\)/);
  assert.match(css, /\.spill\[data-open='false'\]\[data-from='point'\] \.spilled\[data-from='pile'\] \{\s+translate: calc\(var\(--spill-from-x\) \* var\(--spill-unit\) - 50%\)/);
  // The lift on the way, and none of it for reduced motion.
  assert.match(css, /@keyframes spilled-lift \{[\s\S]+?scale: 1\.07/);
  assert.match(css, /prefers-reduced-motion: reduce\) \{\s+\.spilled,\s+\.spill\[data-open='false'\] \.spilled \{\s+transition: none/);

  // The dossier takes loose things in its well, which is their containing block.
  const dossier = read('src/sections/BandDossier/BandDossier.tsx');
  assert.match(dossier, /children\?: ReactNode;/);
  assert.match(dossier, /<OneSheet \{\.\.\.oneSheet\} rotation=\{bandRotation\} \/>\s+\{children\}/);
});

test('The promoter’s desk: the package closed on the wood, opened by a click, its loose things spilling out', () => {
  const page = read('src/pages/Desk/PromoterDesk.tsx');
  const css = read('src/pages/Desk/PromoterDesk.css');

  assert.match(page, /DESK_HEIGHT = 1200/);
  assert.match(page, /<Stage className=\{`promoter-desk-stage \$\{className\}`\}[^>]+height=\{DESK_HEIGHT\}/);
  assert.match(page, /<Desk className="promoter-desk" wood=\{wood\} height=\{DESK_HEIGHT\} data-open=/);
  // The promoter's own things are on the desk from the start.
  assert.match(page, /<Walkman \{\.\.\.DEMO_TAPE\} finish="blue"/);
  assert.match(page, /<Handheld video=\{LIVE_SET\.video\}/);
  assert.match(page, /<Mug glaze=/);
  assert.match(page, /<Cassette label="live at the pond" side="B"/);
  assert.match(page, /<Pen kind="ballpoint"/);
  assert.match(page, /<Pen kind="marker"/);
  assert.match(page, /<GuitarPick/);
  assert.match(page, /function RunSheet\(/);
  assert.match(page, /Funkadelic Astronaut · 45 min/);
  // The band's name is on the cover, with the streaming stickers and the note.
  assert.match(page, /sticker=\{cover\}/);
  assert.match(page, /FUNKADELIC\s+<\/Wordmark>/);
  assert.match(page, /ASTRONAUT\s+<\/Wordmark>/);
  assert.match(page, /LISTEN_LINKS\.map\(/);
  assert.match(page, /<StickyNote color="canary"/);
  // The folder is the button, and the dossier's own player stays out: the promoter's is on the desk.
  assert.match(page, /<BandDossier open=\{open\} tape=\{null\}/);
  assert.match(page, /aria-label=\{open \? 'Close the press package' : 'Open the Funkadelic Astronaut press package'\}/);
  assert.match(page, /aria-expanded=\{open\}/);
  // The loose things are spilled from the well, placed in desk units from the well's corner.
  assert.match(page, /const inWell = \(x: number, y: number, rotation: number\) => \{/);
  assert.match(page, /rotation: rotation - at\.dossierRotation,/);
  assert.match(page, /const deskUnit = `calc\(var\(--folder-unit\) \* \$\{DESK_WIDTH \/ at\.dossierWidth\}\)`/);
  assert.match(page, /<Spill open=\{open\} from=\{\{ x: at\.dossierWidth \/ 4, y: folderHeight \/ 2 \}\} unit=\{deskUnit\}>/);
  for (const thing of ['Polaroid', 'TourPass', 'AdmissionTicket', 'MiniZine', 'Handbill']) {
    assert.match(page, new RegExp(`<Spilled [^>]+>\\s+<${thing} `), thing);
  }
  assert.match(page, /role="status" aria-live="polite" aria-label="Press package"/);

  // Closed, the folder lets clicks through to the button beneath it, but for the stickers.
  assert.match(css, /\.promoter-desk\[data-open='false'\] \.dossier \{\s+pointer-events: none;/);
  assert.match(css, /\.promoter-desk\[data-open='false'\] \.dossier \.sticker \{\s+pointer-events: auto;/);
  assert.match(css, /\.promoter-desk\[data-open='true'\] \.promoter-desk__open \{[\s\S]+?z-index: 5/);
  // The cover's own label becomes the whole face.
  assert.match(css, /\.promoter-desk \.folder__sticker \{[\s\S]+?inset: 0;/);
  // The one-sheet pulled open lies over what spilled.
  assert.match(css, /\.promoter-desk \.one-sheet\[data-open='true'\] \{\s+z-index: 20;/);
  // The running order's print measures against the sheet, one level in.
  assert.match(css, /\.run-sheet__page \{[\s\S]+?padding: calc\(52 \* var\(--run-sheet-unit\)\)/);
});
