const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('A thing picked up to be looked at never leaves the plane it is lying on', () => {
  const css = read('src/behaviors/Inspectable/Inspectable.css');

  // The whole pose runs off one registered number, so the browser has something it can interpolate.
  assert.match(css, /@property --inspect-hold \{[\s\S]+?syntax: '<number>'/);
  assert.match(css, /@property --inspect-hold \{[\s\S]+?initial-value: 0/);
  assert.match(css, /\.inspectable \{[\s\S]+?transition: --inspect-hold \d+ms/);

  // Undo the tilt, then carry, then grow — and about the same point the Movable already turns the thing on,
  // or the carry runs the way the thing happens to be lying instead of the way the plane runs.
  assert.match(css, /\.inspectable \{[\s\S]+?transform-origin: calc\(var\(--movable-pivot-x, 0\.5\) \* 100%\) calc\(var\(--movable-pivot-y, 0\.5\) \* 100%\)/);
  assert.match(css, /transform:\s+rotate\(calc\(-1 \* var\(--inspect-turn, 0deg\) \* var\(--inspect-hold\)\)\)\s+translate\(calc\(var\(--inspect-dx\) \* var\(--inspect-hold\)\), calc\(var\(--inspect-dy\) \* var\(--inspect-hold\)\)\)\s+scale\(calc\(1 \+ \(var\(--inspect-scale\) - 1\) \* var\(--inspect-hold\)\)\)/);
  // Only a thing that straightens as it comes up has a tilt to undo, and the tilt is the Movable's own.
  assert.match(css, /\.inspectable\[data-upright\] \{\s+--inspect-turn: var\(--movable-rotation, 0deg\);/);
  // Measuring is done in the pose itself, with nothing running, so the pose is never seen.
  assert.match(css, /\.inspectable\[data-measuring\] \{\s+transition: none;/);

  // The veil is drawn on the surface, larger than it, and throws everything painted beneath it out of focus.
  assert.match(css, /\.inspector__veil \{[\s\S]+?position: absolute/);
  assert.match(css, /\.inspector__veil \{[\s\S]+?inset: -150%/);
  assert.match(css, /\.inspector__veil\[data-held\] \{[\s\S]+?backdrop-filter: blur\(calc\(9 \* var\(--sheet-unit, 1px\)\)\)/);
  assert.match(css, /@supports not \(backdrop-filter: blur\(1px\)\) \{/);
  // A thing up in the air is not lying on the desk to be arranged.
  assert.match(css, /\.movable:has\(> \.movable__lift > \.inspectable\[data-held\]\) > \.movable__grip \{[\s\S]+?opacity: 0/);
});

test('Where a held thing has to be drawn is measured on the plane, not guessed from the drawing', () => {
  const behavior = read('src/behaviors/Inspectable/Inspectable.tsx');

  // The point on the screen is turned back into a point on the plane, so a thing is carried across the
  // desk rather than across the screen; off a Perspective the screen is the plane and there is nothing to undo.
  assert.match(behavior, /import \{ unproject, usePerspectiveView \} from '\.\.\/Perspective\/Perspective';/);
  assert.match(behavior, /const onPlane = \(x: number, y: number\) => \(plane && view \? unproject\(plane, view, x, y\) : \{ x, y \}\);/);
  assert.match(behavior, /const perUnit = plane && view \? plane\.offsetWidth \/ view\.width :/);
  // What is measured is the thing, which is not always the whole of the drawing it is in.
  assert.match(behavior, /const drawn = \(\) => \(subject \? element\.querySelector\(subject\) \?\? element : element\)\.getBoundingClientRect\(\);/);
  // Carrying it forward brings it nearer the eye, which draws it larger: a second pass takes that back out.
  assert.match(behavior, /for \(let pass = 0; pass < 2; pass \+= 1\)/);
  assert.match(behavior, /const fits = Math\.min\(\(frame\.width \* fill\)/);
  // Measured with the transition off, put back down, committed, and only then let go.
  assert.match(behavior, /element\.dataset\.measuring = '';/);
  assert.match(behavior, /set\('--inspect-hold', '0'\);\s+void element\.getBoundingClientRect\(\);\s+delete element\.dataset\.measuring;\s+set\('--inspect-hold', '1'\);/);
  // It is measured again when the frame changes under a thing that is already up.
  assert.match(behavior, /const observer = new ResizeObserver\(again\);/);
});

test('A held thing is the only thing you can reach, and every control on it is still its own', () => {
  const behavior = read('src/behaviors/Inspectable/Inspectable.tsx');

  // Up in the air it is not lying on the desk: presses on it never reach the Movable under it.
  assert.match(behavior, /onPointerDown=\{event => \{\s+if \(held\) event\.stopPropagation\(\);/);
  // A press on something that works is that thing's own, whichever way round the thing is.
  assert.match(behavior, /const INSPECT_CONTROLS = 'button, a, input, select, textarea, iframe, video/);
  assert.match(behavior, /if \(held \|\| grab === 'anywhere' \|\| \(event\.target as Element\)\.closest\(INSPECT_CONTROLS\)\) return;/);
  // A thing picked up by its whole face is taken before its face ever hears the press.
  assert.match(behavior, /onClickCapture=\{event => \{[\s\S]+?if \(held \|\| grab !== 'anywhere' \|\| \(event\.target as Element\)\.closest\(HELD_CONTROLS\)\) return;[\s\S]+?event\.preventDefault\(\);/);
  // Escape puts down whatever is up, and the key that picks a thing up is bound on whatever is holding it.
  assert.match(behavior, /if \(event\.key === 'Escape'\)/);
  assert.match(behavior, /const holder = host\.current\?\.closest<HTMLElement>\('\.movable'\);/);
  assert.match(behavior, /if \(event\.target !== holder \|\| \(event\.key !== 'Enter' && event\.key !== ' '\)\) return;/);
  // Without an Inspector round it, a thing is just the thing.
  assert.match(behavior, /if \(!inspection\) return <>\{children\}<\/>;/);
});

test('The desk says which of its things are worth looking at, and draws a held one over everything else', () => {
  const objects = read('src/pages/Desk/DeskObjects.tsx');
  const room = read('src/foundations/Room/Room.tsx');

  // A sheet is there to be read and comes up square on; a machine comes up the way it was lying.
  assert.match(objects, /const READ: Inspect = \{ fill: 0\.9 \};/);
  assert.match(objects, /const HANDLE: Inspect = \{ fill: 0\.7, upright: false \};/);
  assert.match(objects, /const TURN_OVER: Inspect = \{ fill: 0\.9, grab: 'anywhere' \};/);
  // The papers and the machines; the mug, the pen, the clock and the cradle are only ever scenery.
  for (const id of ['sitePlan', 'setTimes', 'contract']) assert.match(objects, new RegExp(`id: '${id}'[^\\n]+inspect: READ`));
  for (const id of ['rolodex', 'handheld', 'labelBro', 'walkman', 'phone']) assert.match(objects, new RegExp(`id: '${id}'[^\\n]+inspect: HANDLE`));
  assert.match(objects, /id: 'poster'[^\n]+inspect: TURN_OVER/);
  for (const id of ['mug', 'pen', 'clock', 'cradle', 'dossier']) assert.doesNotMatch(objects, new RegExp(`id: '${id}'[^\\n]+inspect:`));

  // Held, it is drawn over the veil, and so over the desk and everything still lying on it.
  assert.match(objects, /const INSPECT_LAYER = 5000;/);
  assert.match(objects, /z=\{held \? INSPECT_LAYER : layer\}/);
  assert.match(objects, /\{object\.inspect \? <Inspectable id=\{object\.id\} \{\.\.\.object\.inspect\}>\{drawing\}<\/Inspectable> : drawing\}/);

  // The frame is the stage a thing is brought to the middle of; the veil is drawn on the surface itself.
  // Both belong to the room, which is the thing with a frame to bring something to the middle of —
  // the desk page only says which of the things standing in it are worth looking at.
  assert.match(room, /<Inspector className=\{`room /);
  assert.match(room, /<InspectorVeil \/>/);
});
