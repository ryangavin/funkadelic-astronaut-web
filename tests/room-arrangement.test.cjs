const assert = require('node:assert/strict');
const test = require('node:test');

// useRoomArrangement is a hook, but its flight maths only touches React through
// useRef/useCallback/useEffect and the place store through usePlaces. Both are
// swapped for plain stand-ins here, and the frame clock is driven by hand.
const { registerHooks } = require('node:module');
const stub = source => ({ url: `data:text/javascript,${encodeURIComponent(source)}`, shortCircuit: true });
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'react') return stub('export const useRef = v => ({ current: v }); export const useCallback = f => f; export const useEffect = () => {};');
    if (specifier.endsWith('/Movable/places')) return stub('export const usePlaces = () => globalThis.testPlaces;');
    return next(specifier, context);
  },
});

let clock = 0, frames = [];
Object.defineProperty(globalThis, 'performance', { value: { now: () => clock }, configurable: true });
globalThis.window = { matchMedia: () => ({ matches: false }) };
globalThis.requestAnimationFrame = callback => frames.push(callback);
globalThis.cancelAnimationFrame = () => { frames = []; };
const frame = now => { clock = now; const due = frames; frames = []; for (const callback of due) callback(now); };

const { useRoomArrangement } = require('../src/foundations/Room/useRoomArrangement.ts');

function placeStore(initial) {
  const places = new Map(Object.entries(initial)), arranging = new Set();
  return {
    get: id => places.get(id), set: (id, place) => places.set(id, place),
    setArranging: (id, active) => (active ? arranging.add(id) : arranging.delete(id)), arranging,
  };
}
const eased = (elapsed, duration) => 1 - (1 - Math.min(1, elapsed / duration)) ** 3;
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test('one stalled frame advances a flight by at most 100 ms, so a slow frame slows the motion rather than skipping it', () => {
  globalThis.testPlaces = placeStore({ mug: { x: 0, y: 0 } });
  clock = 0;
  useRoomArrangement()({ mug: { x: 750, y: 300 } }, 750);
  frame(5000);
  near(testPlaces.get('mug').x, 750 * eased(100, 750));
  near(testPlaces.get('mug').y, 300 * eased(100, 750));
  frame(5016);
  near(testPlaces.get('mug').x, 750 * eased(116, 750));
  // A clock that runs backwards adds nothing.
  frame(4000);
  near(testPlaces.get('mug').x, 750 * eased(116, 750));
});

test('a flight ends on its exact target and hands the object back once the last frame is painted', () => {
  globalThis.testPlaces = placeStore({ mug: { x: 10, y: 20, rotation: 0, scale: 1 } });
  clock = 0;
  const target = { x: 400, y: 120, rotation: 15, scale: 1.2 };
  useRoomArrangement()({ mug: target }, 750);
  assert.ok(testPlaces.arranging.has('mug'));
  for (let now = 16; frames.length && now < 10000; now += 16) frame(now);
  assert.equal(testPlaces.get('mug'), target);
  assert.ok(!testPlaces.arranging.has('mug'));
});

test('grabbing an object mid-flight takes it out of the flight without moving it again', () => {
  globalThis.testPlaces = placeStore({ mug: { x: 0, y: 0 }, pen: { x: 0, y: 0 } });
  clock = 0;
  useRoomArrangement()({ mug: { x: 300, y: 0 }, pen: { x: 300, y: 0 } }, 750);
  frame(16);
  const grabbed = { x: -50, y: -50 };
  testPlaces.set('pen', grabbed);
  frame(32);
  assert.equal(testPlaces.get('pen'), grabbed);
  assert.ok(!testPlaces.arranging.has('pen'));
  near(testPlaces.get('mug').x, 300 * eased(32, 750));
});
