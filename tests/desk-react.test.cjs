const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('Desk is a wooden top in sheet units whose surface measures against the desk itself', () => {
  const component = read('src/components/Desk/Desk.tsx');
  const css = read('src/components/Desk/Desk.css');

  assert.match(component, /DESK_WOODS = \['walnut', 'oak', 'ebony', 'cherry'\]/);
  assert.match(component, /boards = 1, light = 1, edge = 22/);
  assert.match(component, /className="desk__edge"/);
  assert.match(component, /DESK_WIDTH = 1440/);
  // The grain is drawn: bands of tone bent by turbulence, pores over them.
  assert.match(component, /<feTurbulence type="fractalNoise" baseFrequency="0\.0016 0\.012"/);
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
  assert.match(css, /\.desk__edge \{[\s\S]+?height: calc\(var\(--desk-edge\) \* var\(--sheet-unit\)\)/);
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

  const clock = read('src/components/DeskClock/DeskClock.tsx');
  assert.match(clock, /export function readout\(at: Date, hours: 12 \| 24\)/);
  assert.match(clock, /<SegmentDisplay className="desk-clock__time" text=\{time\} kind="digit" \/>/);
  assert.match(clock, /role="timer"/);
  assert.match(clock, /const wallClock = \(\) => new Date\(\);/);
  assert.match(clock, /now = wallClock, running = true/);
  const clockCss = read('src/components/DeskClock/DeskClock.css');
  assert.match(clockCss, /aspect-ratio: 720 \/ 560/);
  // The digits span the panel: both rows sized by width, with a selector that outranks the Walkman's display rule.
  assert.match(clockCss, /\.desk-clock \.desk-clock__time,\s+\.desk-clock \.desk-clock__date \{\s+width: 100%;\s+height: auto;/);
  assert.match(clockCss, /\.desk-clock__row \{\s+display: grid;\s+grid-template-columns: auto 1fr;/);
  assert.doesNotMatch(clockCss, /\.desk-clock \.segment-display \{/);
  const cradle = read('src/components/NewtonsCradle/NewtonsCradle.tsx');
  assert.match(cradle, /CRADLE_BALLS = \[140, 250, 360, 470, 580\]/);
  assert.match(cradle, /aria-label=\{swinging \? 'Stop the cradle' : 'Set the cradle going'\}/);
  assert.match(cradle, /band\.type = 'bandpass'/);
  // The strings stay tied to the rails: each turns about its rail end and stretches after the ball, which alone slides out and grows.
  assert.match(cradle, /CRADLE_RAILS = \[90, 510\]/);
  assert.match(cradle, /angle: \(Math\.atan\(CRADLE_SWING \/ \(CRADLE_REST - CRADLE_RAILS\[0\]\)\) \* 180\) \/ Math\.PI/);
  assert.match(cradle, /<line className="newtons-cradle__string newtons-cradle__string--top" x1=\{cx\} y1=\{CRADLE_RAILS\[0\]\} x2=\{cx\} y2=\{CRADLE_REST\} style=\{\{ transformOrigin: `\$\{cx\}px \$\{CRADLE_RAILS\[0\]\}px` \}\} \/>/);
  const cradleCss = read('src/components/NewtonsCradle/NewtonsCradle.css');
  assert.match(cradleCss, /\.newtons-cradle__string \{\s+transform-box: view-box;/);
  assert.match(cradleCss, /@keyframes cradle-swing-left \{[\s\S]+?translate: calc\(-1 \* var\(--cradle-swing\)\) 0;\s+scale: 1\.14/);
  assert.match(cradleCss, /@keyframes cradle-string-left-top \{[\s\S]+?transform: rotate\(var\(--cradle-string-angle\)\) scaleY\(var\(--cradle-string-stretch\)\)/);
  assert.match(cradleCss, /@keyframes cradle-string-right-bottom \{[\s\S]+?transform: rotate\(var\(--cradle-string-angle\)\) scaleY\(var\(--cradle-string-stretch\)\)/);

  const lamp = read('src/components/DeskLamp/DeskLamp.tsx');
  assert.match(lamp, /DESK_LAMP_SHADE = \{ x: 200, y: 420, radius: 130 \}/);
  assert.match(lamp, /aria-label=\{on \? 'Turn the lamp off' : 'Turn the lamp on'\}/);
  assert.match(lamp, /export function LampLight\(/);
  assert.match(read('src/components/DeskLamp/DeskLamp.css'), /\.lamp-light \{[\s\S]+?mix-blend-mode: screen/);

  // Each platform carries its own colour, and a sticker wears it unless told otherwise.
  const platforms = read('src/components/SocialIcon/platforms.ts');
  for (const [platform, brand] of [['facebook', '#1877f2'], ['spotify', '#1db954'], ['youtube', '#ff0000'], ['bandcamp', '#1da0c3']]) {
    assert.match(platforms, new RegExp(`${platform}: \\{\\n    label: '[^']+',\\n    brand: '${brand}',`), platform);
  }
  assert.match(platforms, /gradient: \['#f9ce34', '#ee2a7b', '#6228d7'\]/);
  assert.match(read('src/components/Sticker/SocialSticker.tsx'), /ink = 'brand', worn = false, print = 'flat'/);
  assert.match(read('src/components/SocialIcon/SocialIcon.tsx'), /const color = ink === 'brand' \? brand :/);
  // A keyline round the print, and a liner to lie on.
  const sticker = read('src/components/Sticker/Sticker.tsx');
  assert.match(sticker, /border = 1\.3,\s+keyline = 0\.4,\s+backing = false,/);
  assert.match(sticker, /const DEFAULT_LINER = 2\.4;/);
  assert.match(sticker, /\{keyline > 0 && <use href=\{outline\} fill="none" stroke="#121420" strokeWidth=\{2 \* keyline\} \/>\}/);
  assert.match(sticker, /className="sticker__sheet"/);
  // A flat social print draws past its square, so the wide marks fill the vinyl cut for them.
  assert.match(read('src/components/SocialIcon/SocialIcon.css'), /\.social-icon--flat \.social-icon__mark \{\s+overflow: visible;/);

  const pick = read('src/components/GuitarPick/GuitarPick.tsx');
  assert.match(pick, /viewBox="0 0 100 116"/);
  assert.match(pick, /print = 'FA'/);
  assert.match(read('src/components/GuitarPick/GuitarPick.css'), /aspect-ratio: 100 \/ 116/);
});

test('Movable is picked up by its body, follows the pointer in surface units, and never ends a drag in a click', () => {
  const behavior = read('src/behaviors/Movable/Movable.tsx');
  const css = read('src/behaviors/Movable/Movable.css');

  assert.match(behavior, /MOVABLE_DRAG_THRESHOLD = 5/);
  assert.match(behavior, /MOVABLE_KEY_STEP = 10/);
  assert.match(behavior, /export const MovableScale = createContext<\(\) => number>/);
  // A press on a control is the control's; a thing grabbed anywhere still leaves sliders and frames alone.
  assert.match(behavior, /const CONTROLS = 'button, a, input, select, textarea, iframe, video, \[role="slider"\], \[role="button"\]'/);
  assert.match(behavior, /const HELD_CONTROLS = 'input, select, textarea, iframe, video, \[role="slider"\]'/);
  assert.match(behavior, /closest\(grab === 'anywhere' \? HELD_CONTROLS : CONTROLS\)/);
  // The pointer is captured once the press has travelled, and its travel is scaled to units.
  assert.match(behavior, /if \(Math\.hypot\(dx, dy\) < MOVABLE_DRAG_THRESHOLD\) return;/);
  assert.match(behavior, /host\.current\?\.setPointerCapture\(start\.id\)/);
  assert.match(behavior, /onMove\(\{ x: Math\.round\(start\.x \+ dx \/ perUnit\), y: Math\.round\(start\.y \+ dy \/ perUnit\) \}\)/);
  assert.match(behavior, /element\.addEventListener\('click', swallow, \{ capture: true, once: true \}\)/);
  // The keyboard moves the thing itself, not a control inside it.
  assert.match(behavior, /if \(!onMove \|\| event\.target !== event\.currentTarget\) return;/);
  assert.match(behavior, /tabIndex=\{onMove \? 0 : undefined\}/);
  assert.match(behavior, /aria-roledescription=\{onMove \? 'movable' : undefined\}/);
  assert.match(behavior, /onDragStart=\{\(event\) => event\.preventDefault\(\)\}/);
  // Placed like a Pin, sliding when moved, and following at once while dragged.
  assert.match(css, /\.movable \{[\s\S]+?translate: calc\(var\(--movable-x\) \* var\(--movable-unit\)\) calc\(var\(--movable-y\) \* var\(--movable-unit\)\)/);
  assert.match(css, /\.movable\[data-dragging\] \{[\s\S]+?transition: none/);
  assert.match(css, /\.movable\[data-movable\] \{\s+cursor: grab;/);
  assert.match(css, /\.movable\[data-dragging\] > \.movable__lift \{\s+scale: 1\.03/);
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
  // A spilled thing is a Movable, so it can be dragged once it is out.
  assert.match(behavior, /return <Movable \{\.\.\.movable\} x=\{x\} y=\{y\} rotation=\{rotation\} unit="var\(--spill-unit\)" className=\{`spilled \$\{className\}`\}/);
  // Later items leave later and land on top; a delay lets a cover get out of the way first.
  assert.match(behavior, /'--spilled-delay': `\$\{order \* stagger\}ms`/);
  assert.match(behavior, /'--spill-delay': `\$\{delay\}ms`/);
  assert.match(css, /--spilled-wait: calc\(var\(--spill-delay\) \+ var\(--spilled-delay\)\)/);
  assert.match(css, /z-index: var\(--movable-z, calc\(1 \+ var\(--spilled-order\)\)\)/);
  assert.match(css, /--spill-unit: var\(--sheet-unit, 1px\)/);
  // Packed: on the point, turned, and hidden once the flight back has ended.
  assert.match(css, /\.spill\[data-open='false'\] \.spilled \{[\s\S]+?rotate: var\(--spilled-from-rotation\);\s+visibility: hidden;/);
  assert.match(css, /visibility 0s linear calc\(var\(--spilled-delay\) \+ var\(--spill-flight\) \* 0\.8\)/);
  assert.match(css, /\.spill\[data-open='false'\]\[data-from='point'\] \.spilled\[data-from='pile'\] \{\s+translate: calc\(var\(--spill-from-x\) \* var\(--spill-unit\) - 50%\)/);
  // The lift on the way, none of it while dragged, and none of it for reduced motion.
  assert.match(css, /@keyframes spilled-lift \{[\s\S]+?scale: 1\.07/);
  assert.match(css, /\.spill\[data-open='true'\] \.spilled\[data-dragging\] \{\s+transition: none/);
  assert.match(css, /prefers-reduced-motion: reduce\) \{\s+\.spill \.spilled,\s+\.spill\[data-open='false'\] \.spilled \{\s+transition: none/);

  // The dossier takes loose things in its well, which is their containing block.
  const dossier = read('src/sections/BandDossier/BandDossier.tsx');
  assert.match(dossier, /children\?: ReactNode;/);
  assert.match(dossier, /<OneSheet \{\.\.\.oneSheet\} rotation=\{bandRotation\} \/>\s+\{children\}/);
});

test('The promoter’s desk: everything its real size against the Walkman, the folder a button, its contents spilling out, all of it movable', () => {
  const page = read('src/pages/Desk/PromoterDesk.tsx');
  const css = read('src/pages/Desk/PromoterDesk.css');

  // One reference: the Walkman, 112 mm, is 300 units; everything else is its real width in that scale.
  assert.match(page, /REFERENCE = \{ object: 'Walkman', millimetres: 112, units: 224 \}/);
  assert.match(page, /export const mm = \(millimetres: number\) => Math\.round\(\(millimetres \* REFERENCE\.units\) \/ REFERENCE\.millimetres\)/);
  for (const [thing, width] of [['folder', 482], ['cassette', 100], ['handheld', 170], ['sheet', 216], ['handbill', 108], ['packet', 152], ['pick', 25]]) {
    assert.match(page, new RegExp(`^  ${thing}: ${width},$`, 'm'), thing);
  }
  assert.match(page, /DESK_HEIGHT = 810/);
  // The promoter's things have a place while the folder is closed and another once it is open; the contents only land.
  assert.match(page, /walkman: \{ closed: \{ x: 910, y: 380, rotation: -6 \}, open: \{ x: 30, y: 250, rotation: -8 \} \}/);
  assert.match(page, /const brand = Math\.round\(folderWidth \/ 16\);/);
  // The label's desk: its letterhead on the running order and the site plan, its stamp inside the folder, its clock and its cradle.
  assert.match(page, /className="run-sheet__label">Mission Control</);
  assert.match(page, /function SitePlan\(/);
  assert.match(page, /<img className="site-plan__map" src=\{festivalMap\}/);
  assert.match(page, /stamps=\{\['Mission Control', 'Received'\]\}/);
  assert.match(page, /<Movable \{\.\.\.movable\('clock', SIZES\.clock\)\}>\s+<DeskClock/);
  assert.match(page, /<Movable \{\.\.\.movable\('cradle', SIZES\.cradle, 'anywhere'\)\}>\s+<NewtonsCradle/);
  // The lamp at the back edge: its pool under everything and again over it, the lamp itself highest, and the room dim without it.
  assert.match(page, /lamp: \{ x: 470, y: -620, rotation: 0 \}/);
  assert.match(page, /light=\{lamp \? 1 : 0\.55\} data-open=/);
  assert.match(page, /<LampLight on=\{lamp\} \/>/);
  assert.match(page, /<LampLight on=\{lamp\} className="promoter-desk__glow" \/>/);
  assert.match(page, /className="promoter-desk__night"/);
  assert.match(page, /\} satisfies Record<DeskThingId, \{ closed: Place; open: Place \}>/);
  assert.match(page, /\} satisfies Record<SpilledThingId, Place>/);
  assert.match(page, /placed\[id\] \?\? \(isSpilled\(id\) \? DESK_LAYOUT\.spilled\[id\] : open \? DESK_LAYOUT\.things\[id\]\.open : DESK_LAYOUT\.things\[id\]\.closed\)/);
  // Picking a thing up brings it to the top; the folder is a layer of its own over the running order.
  assert.match(page, /const STACKING: LayerId\[\] = \['plan', 'sheet', 'folder', 'ballpoint'/);
  assert.match(page, /const zOf = \(id: LayerId\) => 10 \+ stacking\.indexOf\(id\)/);
  assert.match(page, /'--promoter-desk-folder-z': zOf\('folder'\)/);
  // The pointer's travel is scaled by the desk's rendered width, since the Stage zooms it.
  assert.match(page, /const scale = \(\) => \(surface\.current\?\.querySelector\('\.desk__top'\)\?\.getBoundingClientRect\(\)\.width \?\? DESK_WIDTH\) \/ DESK_WIDTH/);
  assert.match(page, /<MovableScale\.Provider value=\{scale\}>/);
  // The promoter's own things are on the desk from the start, and movable.
  assert.match(page, /<Movable \{\.\.\.movable\('walkman', SIZES\.walkman\)\}>\s+<Walkman \{\.\.\.DEMO_TAPE\} finish="blue" \/>/);
  assert.match(page, /<Movable \{\.\.\.movable\('handheld', SIZES\.handheld\)\}>\s+<Handheld video=\{LIVE_SET\.video\}/);
  assert.match(page, /<Movable \{\.\.\.movable\('mug', SIZES\.mug\)\}>/);
  assert.match(page, /<Cassette label="live at the pond" side="B"/);
  assert.match(page, /function RunSheet\(/);
  assert.match(page, /Funkadelic Astronaut · 45 min/);
  // A plain folder with the band's name on the cover, the streaming stickers and the note, and a button beneath it.
  assert.match(page, /<Folder label="Press Package – Funkadelic Astronaut" tab="side" open=\{open\} stamps=\{\['Mission Control', 'Received'\]\} stampsAt="bottom" sticker=\{cover\} \/>/);
  assert.match(page, /FUNKADELIC\s+<\/Wordmark>/);
  assert.match(page, /ASTRONAUT\s+<\/Wordmark>/);
  assert.match(page, /LISTEN_LINKS\.map\(/);
  assert.match(page, /<StickyNote color="canary"/);
  assert.match(page, /aria-label=\{open \? 'Close the press package' : 'Open the Funkadelic Astronaut press package'\}/);
  assert.match(page, /aria-expanded=\{open\}/);
  // What is inside spills from the closed folder's centre once the cover has got out of the way; paper is grabbed anywhere.
  assert.match(page, /const packed = \{ x: folder\.x \+ folderWidth \* 0\.75, y: folder\.y \+ folderHeight \/ 2 \}/);
  assert.match(page, /<Spill open=\{open\} from=\{packed\} delay=\{420\}>/);
  for (const thing of ['live', 'print', 'oneSheet', 'handbill', 'zine']) assert.match(page, new RegExp(`movable\\('${thing}', SIZES\\.\\w+, 'anywhere'\\)`), thing);
  assert.match(page, /BAND_MEMBER_PACKETS\.map\(/);
  assert.match(page, /<Packet \{\.\.\.packet\} rotation=\{0\} \/>/);
  assert.match(page, /role="status" aria-live="polite" aria-label="Press package"/);

  // Closed, the folder lets clicks through to the button beneath it, but for the stickers.
  assert.match(css, /\.promoter-desk\[data-open='false'\] \.folder \{\s+pointer-events: none;/);
  assert.match(css, /\.promoter-desk\[data-open='false'\] \.folder \.sticker \{\s+pointer-events: auto;/);
  assert.match(css, /\.promoter-desk\[data-open='true'\] \.promoter-desk__open \{[\s\S]+?z-index: 5/);
  assert.match(css, /\.promoter-desk__folder \{[\s\S]+?z-index: var\(--promoter-desk-folder-z, 10\)/);
  // The cover's own label becomes the whole face.
  assert.match(css, /\.promoter-desk \.folder__sticker \{[\s\S]+?inset: 0;/);
  assert.match(css, /\.promoter-desk__lamp \{[\s\S]+?z-index: 400/);
  assert.match(css, /\.promoter-desk\[data-lamp='off'\] \.promoter-desk__night \{\s+opacity: 1;/);
  // The frame is 16 x 9 with a margin round it, never taller than the window; the room is the story's, not the frame's.
  assert.match(css, /\.promoter-desk-stage > \.stage \{[\s\S]+?aspect-ratio: 16 \/ 9/);
  assert.match(css, /\.promoter-desk-room \{\s+min-height: 100vh;/);
  assert.doesNotMatch(css, /\.promoter-desk-stage \{[^}]*min-height/);
  assert.match(css, /\.promoter-desk-stage > \.stage \{\s+width: min\(100%, calc\(\(100vh - 2 \* var\(--promoter-desk-margin\)\) \* 16 \/ 9\)\)/);
  // The running order's print measures against the sheet, one level in.
  assert.match(css, /\.run-sheet__page \{[\s\S]+?padding: calc\(52 \* var\(--run-sheet-unit\)\)/);
});
