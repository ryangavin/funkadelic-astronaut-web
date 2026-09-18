const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('Desk is a wooden top in sheet units whose surface measures against the desk itself', () => {
  const component = read('src/components/3D/Desk/Desk.tsx');
  const css = read('src/components/3D/Desk/Desk.css');

  assert.match(component, /DESK_WOODS = \['walnut', 'oak', 'ebony', 'cherry'\]/);
  assert.match(component, /boards = 1, light = 1, edge = 22/);
  assert.match(component, /className="desk__edge"/);
  // The desk is still 1440 units across; that number is pinned in physical-scale.test.cjs now,
  // so what this checks is that the desk reads its width from there rather than carrying its own.
  assert.match(component, /DESK_WIDTH = DESK_SIZE\.width/);
  // The grain is drawn: bands of tone bent by turbulence, pores over them.
  assert.match(component, /<feTurbulence type="fractalNoise" baseFrequency="0\.0016 0\.012"/);
  assert.match(component, /<feDisplacementMap in="SourceGraphic" in2="wave"/);
  assert.match(component, /className="desk__board"/);
  assert.match(component, /className="desk__pores"/);
  // Pins work on it, and the height in desk units is measured one level in from the container.
  assert.match(css, /\.desk \{[\s\S]+?--sheet-unit: calc\(100cqw \/ var\(--desk-width, 1440\)\)/);
  assert.match(css, /\.desk \{[\s\S]+?container-type: inline-size/);
  assert.match(css, /\.desk__top \{[\s\S]+?height: calc\(var\(--desk-height\) \* var\(--sheet-unit\)\)/);
  assert.match(css, /\.desk__top \{[\s\S]+?overflow: clip/);
  assert.match(css, /\.desk\[data-wood='oak'\] \{/);
  assert.match(css, /\.desk__grain \{[\s\S]+?mix-blend-mode: soft-light/);
  assert.match(css, /\.desk__light \{[\s\S]+?radial-gradient/);
  assert.match(css, /\.desk__edge \{[\s\S]+?height: calc\(var\(--desk-edge\) \* var\(--sheet-unit\)\)/);
});

test('The desk things: mug, ring, pens, sticky note and pick, each sized by its parent', () => {
  const mug = read('src/components/3D/Mug/Mug.tsx');
  assert.match(mug, /coffee = 0\.7/);
  assert.match(mug, /const surface = 54 - \(1 - level\) \* 5/);
  assert.doesNotMatch(mug, /className="mug__(shadow|footing)"/);
  assert.match(mug, /shadow = 'none'/);
  // No handle: it turned nothing but itself, and a circle is what a mug blocks the light with.
  assert.doesNotMatch(mug, /mug__handle|--mug-rotation/);
  assert.match(mug, /export const MUG_SILHOUETTE = \[\{ path: 'M50 20\.8/);
  assert.match(mug, /level > 0\.02 \? \(/);
  assert.match(mug, /className="mug__dregs"/);
  const ring = read('src/components/3D/Mug/CoffeeRing.tsx');
  assert.match(ring, /strokeDasharray=/);
  // The ring turns inside its box, so what was lying over the surface can be cut out of it in the box's own frame.
  assert.match(ring, /<path d=\{cut\} clipRule="evenodd" \/>/);
  assert.match(ring, /transform=\{`rotate\(\$\{rotation\} 100 100\)`\}/);
  const mugCss = read('src/components/3D/Mug/Mug.css');
  assert.match(mugCss, /\.coffee-ring \{[\s\S]+?mix-blend-mode: multiply/);
  assert.match(mugCss, /\.coffee-ring \{[\s\S]+?transition: opacity 1400ms/);
  assert.match(mugCss, /\.stained__rings \{[\s\S]+?overflow: clip/);
  assert.match(mugCss, /\.mug \{[\s\S]+?aspect-ratio: 1/);
});

test('The mug lays its ring down as it is set down, on everything it is standing on, and the rings dry where they lie', () => {
  const trail = read('src/components/3D/Mug/trail.ts');

  // The ring is the mug's base, which is off the centre of its box, so turning the mug swings the ring round with it.
  assert.match(read('src/components/3D/Mug/Mug.tsx'), /MUG_FOOT = \{ x: 0\.5, y: 0\.5 \}/);
  assert.match(trail, /import \{ MUG_FOOT \} from '\.\/Mug';/);
  assert.match(trail, /MUG_RING = 83 \/ 140/);
  assert.match(trail, /const centreX = x \+ width \/ 2 \+ offsetX \* Math\.cos\(turn\) - offsetY \* Math\.sin\(turn\)/);
  assert.match(trail, /offsetX = \(MUG_FOOT\.x - 0\.5\) \* width/);
  // Fresh, drying, and dried into the wood.
  assert.match(trail, /COFFEE_WET = 0\.7/);
  assert.match(trail, /COFFEE_DRIES = 0\.8/);
  assert.match(trail, /COFFEE_GONE = 0\.04/);
  // Every surface the base overlapped catches its share, each cut where whatever lay over it covered it, and the wood always.
  assert.match(trail, /export function stampRings/);
  assert.match(trail, /for \(let layer = over\.length - 1; layer >= 0; layer -= 1\) stamp\(over\[layer\], over\.slice\(layer \+ 1\)\);/);
  assert.match(trail, /stamp\(null, over\);/);
  // The coffee goes down with the mug, so the paper can be pulled out from under it and take its half away.
  assert.match(trail, /const lift = \(\) => \{\s+standing\.current = false;/);
  assert.match(trail, /const settleAt = \(place\?: MugPlace\) => \{\s+if \(standing\.current\) return;/);
  assert.match(trail, /setTrail\(\(down\) => setDown\(down, place \?\? mug\(\), over\(\)\)\);/);
  // Nothing is dropped for being old: a ring leaves only once it has faded out.
  assert.match(trail, /const drying = rings\.filter\(\(ring\) => ring\.strength > 0\)\.map\(dry\);/);
  assert.match(trail, /return \{ \.\.\.ring, strength: left < COFFEE_GONE \? 0 : left \};/);

  const stained = read('src/components/3D/Mug/Stained.tsx');
  assert.match(stained, /<div className="stained__rings" aria-hidden="true">/);
  assert.match(stained, /<CoffeeRing strength=\{ring\.strength\} rotation=\{ring\.rotation\} masks=\{ring\.masks\} \/>/);
});

test('The office inkjet: a smaller gamut, ink into the fibre, a dither and the head\u2019s bands, laid only where there is ink', () => {
  const press = read('src/foundations/Inkjet/InkjetFilter.tsx');
  const wrapper = read('src/foundations/Inkjet/Inkjet.tsx');
  const css = read('src/foundations/Inkjet/Inkjet.css');

  // Four inks on uncoated stock, and a black that dries a warm dark grey. Each curve leaves 1 alone: no ink is paper.
  assert.match(press, /<feColorMatrix type="saturate" values=\{String\(gamut\)\} result="gamut" \/>/);
  assert.match(press, /<feFuncR type="linear" slope="0\.87" intercept="0\.13" \/>/);
  assert.match(press, /<feGaussianBlur in="inks" stdDeviation=\{spread\} result="wet" \/>/);
  // The dither and the bands are arithmetic composites that fall away with the ink: k2 is 1 and k3 undoes k1.
  assert.match(press, /operator="arithmetic" k1=\{dither\} k2="1" k3=\{-dither\} k4="0"/);
  assert.match(press, /operator="arithmetic" k1=\{banding\} k2="1" k3=\{-banding\} k4="0"/);
  // Bands run the length of the sheet: the turbulence is stretched across it.
  assert.match(press, /baseFrequency="0\.0015 0\.18"/);
  // The white of a print is the paper it was run off on.
  assert.match(css, /\.inkjet\[data-printed\] \{\s+mix-blend-mode: multiply;/);
  assert.match(wrapper, /style=\{enabled \? \{ \.\.\.style, filter: `url\(#\$\{id\}\)` \} : style\}/);

  // The site plan is run off on it.
  const page = (read('src/pages/Desk/PromoterDesk.tsx') + read('src/pages/Desk/DeskPapers.tsx'));
  assert.match(page, /<Inkjet className="site-plan__print" seed=\{3\}>\s+<img className="site-plan__map"/);

  const pen = read('src/components/3D/Pen/Pen.tsx');
  assert.match(pen, /PEN_KINDS = \['ballpoint', 'marker', 'pencil'\]/);
  assert.match(pen, /viewBox="0 0 720 60"/);
  assert.match(pen, /className="pen__tube"/);
  assert.match(pen, /className="pen__lead"/);
  const penCss = read('src/components/3D/Pen/Pen.css');
  assert.match(penCss, /\.pen \{[\s\S]+?--pen-unit: calc\(100cqw \/ 720\)/);
  assert.match(penCss, /\.pen \{[\s\S]+?aspect-ratio: 720 \/ 60/);
  // The shadow uses the pen's own units, which only its children can measure.
  assert.match(penCss, /\.pen svg \{[\s\S]+?filter: drop-shadow\(calc\(3 \* var\(--pen-unit\)\)/);

  const note = read('src/components/2D/StickyNote/StickyNote.tsx');
  assert.match(note, /STICKY_NOTE_COLORS = \['canary', 'pink', 'blue', 'green', 'orange'\]/);
  assert.match(note, /curl = 'right'/);
  assert.match(note, /className="sticky-note__curl"/);
  const noteCss = read('src/components/2D/StickyNote/StickyNote.css');
  assert.match(noteCss, /--sticky-note-unit: calc\(100cqw \/ 720\)/);
  assert.match(noteCss, /\.sticky-note\[data-curl='right'\] \.sticky-note__paper \{\s+clip-path: polygon/);
  assert.match(noteCss, /\.sticky-note \{[\s\S]+?font-family: var\(--font-handwritten/);

  const clock = read('src/components/3D/DeskClock/DeskClock.tsx');
  assert.match(clock, /export function readout\(at: Date, hours: 12 \| 24\)/);
  assert.match(clock, /<SegmentDisplay className="desk-clock__time" text=\{time\} kind="digit" \/>/);
  assert.match(clock, /role="timer"/);
  assert.match(clock, /const wallClock = \(\) => new Date\(\);/);
  assert.match(clock, /now = wallClock, running = true/);
  const clockCss = read('src/components/3D/DeskClock/DeskClock.css');
  assert.match(clockCss, /aspect-ratio: 720 \/ 560/);
  // The digits span the panel: both rows sized by width, with a selector that outranks the Walkman's display rule.
  assert.match(clockCss, /\.desk-clock \.desk-clock__time,\s+\.desk-clock \.desk-clock__date \{\s+width: 100%;\s+height: auto;/);
  assert.match(clockCss, /\.desk-clock__row \{\s+display: grid;\s+grid-template-columns: auto 1fr;/);
  assert.doesNotMatch(clockCss, /\.desk-clock \.segment-display \{/);
  const cradle = read('src/components/3D/NewtonsCradle/NewtonsCradle.tsx');
  assert.match(cradle, /CRADLE_BALLS = \[140, 250, 360, 470, 580\]/);
  assert.match(cradle, /aria-label=\{swinging \? 'Stop the cradle' : 'Set the cradle going'\}/);
  assert.match(cradle, /band\.type = 'bandpass'/);
  // The strings stay tied to the rails: each turns about its rail end and stretches after the ball, which alone slides out and grows.
  assert.match(cradle, /CRADLE_RAILS = \[90, 510\]/);
  assert.match(cradle, /angle: \(Math\.atan\(CRADLE_SWING \/ \(CRADLE_REST - CRADLE_RAILS\[0\]\)\) \* 180\) \/ Math\.PI/);
  assert.match(cradle, /<line className="newtons-cradle__string newtons-cradle__string--top" x1=\{cx\} y1=\{CRADLE_RAILS\[0\]\} x2=\{cx\} y2=\{CRADLE_REST\} style=\{\{ transformOrigin: `\$\{cx\}px \$\{CRADLE_RAILS\[0\]\}px` \}\} \/>/);
  const cradleCss = read('src/components/3D/NewtonsCradle/NewtonsCradle.css');
  assert.match(cradleCss, /\.newtons-cradle__string \{\s+transform-box: view-box;/);
  assert.match(cradleCss, /@keyframes cradle-swing-left \{[\s\S]+?translate: calc\(-1 \* var\(--cradle-swing\)\) 0;\s+scale: 1\.14/);
  assert.match(cradleCss, /@keyframes cradle-string-left-top \{[\s\S]+?transform: rotate\(var\(--cradle-string-angle\)\) scaleY\(var\(--cradle-string-stretch\)\)/);
  assert.match(cradleCss, /@keyframes cradle-string-right-bottom \{[\s\S]+?transform: rotate\(var\(--cradle-string-angle\)\) scaleY\(var\(--cradle-string-stretch\)\)/);

  const lamp = read('src/components/3D/DeskLamp/DeskLamp.tsx');
  assert.match(lamp, /DESK_LAMP_SHADE = \{ x: 200, y: 420, radius: 130 \}/);
  assert.match(lamp, /aria-label=\{on \? 'Turn the lamp off' : 'Turn the lamp on'\}/);
  assert.match(lamp, /export function LampLight\(/);
  assert.match(read('src/components/3D/DeskLamp/DeskLamp.css'), /\.lamp-light \{[\s\S]+?mix-blend-mode: screen/);

  // Each platform carries its own colour, and a sticker wears it unless told otherwise.
  const platforms = read('src/components/2D/SocialIcon/platforms.ts');
  for (const [platform, brand] of [['facebook', '#4a78b8'], ['spotify', '#2f9a58'], ['youtube', '#c9352e'], ['bandcamp', '#3f94b0']]) {
    assert.match(platforms, new RegExp(`${platform}: \\{\\n    label: '[^']+',\\n    brand: '${brand}',`), platform);
  }
  assert.match(platforms, /gradient: \['#e0b84a', '#c9457a', '#6f4bb5'\]/);
  assert.match(read('src/components/2D/Sticker/SocialSticker.tsx'), /ink = 'brand', worn = false, print = 'flat'/);
  assert.match(read('src/components/2D/SocialIcon/SocialIcon.tsx'), /const color = ink === 'brand' \? brand :/);
  // A keyline round the print, and a liner to lie on.
  const sticker = read('src/components/2D/Sticker/Sticker.tsx');
  assert.match(sticker, /border = 1\.3,\s+keyline = 0\.4,\s+backing = false,/);
  assert.match(sticker, /const DEFAULT_LINER = 2\.4;/);
  assert.match(sticker, /\{keyline > 0 && <use href=\{outline\} fill="none" stroke="#121420" strokeWidth=\{2 \* keyline\} \/>\}/);
  // The liner is its own layer beneath the vinyl, outside the peel's clip: the sticker lifts off it, it stays down.
  assert.match(sticker, /\{liner > 0 && \(\s+<svg className="sticker__layer sticker__sheet"/);
  assert.match(sticker, /<\/svg>\s+\)\}\s+\{\/\* The vinyl on the surface/);
  // A flat social print draws past its square, so the wide marks fill the vinyl cut for them.
  assert.match(read('src/components/2D/SocialIcon/SocialIcon.css'), /\.social-icon--flat \.social-icon__mark \{\s+overflow: visible;/);

  const pick = read('src/components/2D/GuitarPick/GuitarPick.tsx');
  assert.match(pick, /viewBox="0 0 100 116"/);
  assert.match(pick, /print = 'FA'/);
  assert.match(read('src/components/2D/GuitarPick/GuitarPick.css'), /aspect-ratio: 100 \/ 116/);
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
  assert.match(behavior, /carry\(\{ x: Math\.round\(start\.x \+ dx \/ perUnit\), y: Math\.round\(start\.y \+ dy \/ perUnit\), rotation: start\.rotation, scale: start\.scale \}\)/);
  // Every step of every gesture goes through `carry`. Given an id and a surface that keeps places,
  // that writes to the store and draws the element by hand, and whoever owns the surface hears
  // nothing until the thing is put down; without one it hands each step to them as it always did.
  assert.match(behavior, /const kept = id && places \? id : undefined;/);
  assert.match(behavior, /places\?\.set\(kept, next\);/);
  assert.match(behavior, /const here = \(kept && places\?\.get\(kept\)\) \|\| \{ x, y, rotation, scale \};/);
  // A key is a whole gesture: it goes the same way and settles at once.
  assert.match(behavior, /carry\(next\);\n      onSettle\?\.\(next\);/);
  assert.match(behavior, /element\.addEventListener\('click', swallow, \{ capture: true, once: true \}\)/);
  // A press is watched to its end on the window, so a release off the thing never leaves it on the pointer.
  assert.match(behavior, /window\.addEventListener\('pointerup', end, true\)/);
  assert.match(behavior, /window\.addEventListener\('pointercancel', end, true\)/);
  // A turn: from the grip, or the body with Alt held, following the pointer round the pivot; and from the bracket keys.
  assert.match(behavior, /MOVABLE_KEY_TURN = 1/);
  assert.match(behavior, /MOVABLE_SNAP_TURN = 15/);
  assert.match(behavior, /if \(target\.closest\('\.movable__grip'\)\) \{/);
  assert.match(behavior, /begin\(event, event\.altKey \? 'turn' : 'move'\);/);
  assert.match(behavior, /const swept = \(Math\.atan2\(here\.y - at\.y, here\.x - at\.x\) - start\.angle\) \* 180 \/ Math\.PI;/);
  assert.match(behavior, /rotation: event\.shiftKey \? Math\.round\(turned \/ MOVABLE_SNAP_TURN\) \* MOVABLE_SNAP_TURN : Math\.round\(turned \* 2\) \/ 2/);
  assert.match(behavior, /const turns: Record<string, number> = \{ '\[': -turn, '\{': -turn, '\]': turn, '\}': turn \}/);
  assert.match(behavior, /className="movable__grip" data-grip="turn"/);
  // And a resize, from its own handle or the minus and plus keys, about the same pivot.
  assert.match(behavior, /MOVABLE_MIN_SCALE = 0\.25/);
  assert.match(behavior, /MOVABLE_MAX_SCALE = 4/);
  assert.match(behavior, /className="movable__grip" data-grip="size"/);
  assert.match(behavior, /const sizes: Record<string, number> = \{ '-': -grow, _: -grow, '=': grow, '\+': grow \}/);
  // The pivot is a point of its own, left out of the turn so it says where the thing really stands.
  assert.match(behavior, /className="movable__pivot"/);
  assert.match(css, /\.movable__pivot \{[\s\S]+?left: calc\(var\(--movable-pivot-x, 0\.5\) \* 100%\)/);
  assert.match(css, /\.movable__lift \{[\s\S]+?transform-origin: calc\(var\(--movable-pivot-x, 0\.5\) \* 100%\) calc\(var\(--movable-pivot-y, 0\.5\) \* 100%\)/);
  assert.match(css, /\.movable\[data-movable\]:hover > \.movable__grip,\s+\.movable__grip:hover \{[\s\S]+?pointer-events: auto/);
  assert.match(css, /\.movable__grip::before \{[\s\S]+?inset: calc\(-18 \* var\(--movable-unit\)\)/);
  // The keyboard moves the thing itself, not a control inside it.
  assert.match(behavior, /if \(!movable \|\| \(event\.target !== event\.currentTarget && !grip\)\) return;/);
  // A thing is movable if anyone is listening: the owner through onMove, or the store it keeps its place in.
  assert.match(behavior, /const movable = !!onMove \|\| !!kept;/);
  assert.match(behavior, /tabIndex=\{movable \? 0 : undefined\}/);
  assert.match(behavior, /aria-roledescription=\{movable \? 'movable' : undefined\}/);
  assert.match(behavior, /onDragStart=\{\(event\) => event\.preventDefault\(\)\}/);
  // Placed like a Pin, sliding when moved, and following at once while dragged.
  assert.match(css, /\.movable \{[\s\S]+?translate: calc\(var\(--movable-x\) \* var\(--movable-unit\)\) calc\(var\(--movable-y\) \* var\(--movable-unit\)\)/);
  assert.match(css, /\.movable\[data-dragging\] \{[\s\S]+?transition: none/);
  assert.match(css, /\.movable\[data-movable\] \{\s+cursor: grab;/);
  assert.match(css, /\.movable\[data-dragging\] > \.movable__lift \{\s+scale: 1\.03/);
  // The shadow of a lifted thing is thrown by the thing, not by its box.
  assert.match(css, /\.movable\[data-dragging\] > \.movable__lift \{[\s\S]+?filter: drop-shadow\(calc\(10 \* var\(--movable-unit\)\)/);
});

test('Spill packs loose things on a point and sends them out in order when opened', () => {
  const behavior = read('src/behaviors/Spill/Spill.tsx');
  const css = read('src/behaviors/Spill/Spill.css');

  assert.match(behavior, /SPILL_FLIGHT_MS = 900/);
  assert.match(behavior, /SPILL_STAGGER_MS = 110/);
  assert.match(behavior, /export function Spill\(/);
  assert.match(behavior, /export function Spilled\(/);
  // Packed/open lifecycle is exercised by the Spill and Desk Dossier browser stories.
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
  const page = (read('src/pages/Desk/PromoterDesk.tsx') + read('src/pages/Desk/DeskPapers.tsx'));
  const css = (read('src/pages/Desk/PromoterDesk.css') + read('src/pages/Desk/DeskPapers.css'));
  // Closed, the folder's box is twice the folder anyone can see: its other half lies on bare desk over the
  // running order and the site plan, so it catches nothing and only the button and the cover's links do.
  assert.match(css, /\.promoter-desk\[data-open='false'\] \.promoter-desk__folder \{\s+pointer-events: none;/);
  assert.match(css, /\.promoter-desk__open \{\s+pointer-events: auto;/);

  // One reference: the Walkman, 112 mm, is 300 units; everything else is its real width in that scale.
  assert.match(page, /REFERENCE = \{ object: 'Walkman', millimetres: 112, units: 224 \}/);
  assert.match(page, /export const mm = \(millimetres: number\) => Math\.round\(\(millimetres \* REFERENCE\.units\) \/ REFERENCE\.millimetres\)/);
  for (const [thing, width] of [['folder', 482], ['cassette', 100], ['handheld', 204], ['sheet', 216], ['handbill', 108], ['packet', 152], ['pick', 25]]) {
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
  assert.match(page, /movable\('mug', SIZES\.mug/);
  // The mug leaves its rings on the wood and on the two letter sheets, which carry their own.
  assert.match(page, /<CoffeeRings rings=\{trail\.on\(DESK\)\} \/>/);
  assert.match(page, /<Stained rings=\{trail\.on\('sheet'\)\}>\s+<RunSheet \/>/);
  assert.match(page, /<Stained rings=\{trail\.on\('plan'\)\}>\s+<SitePlan \/>/);
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
