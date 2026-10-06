const assert = require('node:assert/strict');
const test = require('node:test');
const { flightElapsed, flightPlace, flightProgress } = require('../src/foundations/Room/flight.ts');

const eased = (elapsed, duration) => 1 - (1 - Math.min(1, elapsed / duration)) ** 3;
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test('one stalled frame advances a flight by at most 100 ms, so a slow frame slows the motion rather than skipping it', () => {
  const from = { x: 0, y: 0 }, to = { x: 750, y: 300 };
  let elapsed = flightElapsed(0, 0, 5000);
  near(elapsed, 100);
  let at = flightPlace(from, to, flightProgress(elapsed, 750));
  near(at.x, 750 * eased(100, 750));
  near(at.y, 300 * eased(100, 750));
  elapsed = flightElapsed(elapsed, 5000, 5016);
  near(flightPlace(from, to, flightProgress(elapsed, 750)).x, 750 * eased(116, 750));
  // A clock that runs backwards adds nothing.
  elapsed = flightElapsed(elapsed, 5016, 4000);
  near(flightPlace(from, to, flightProgress(elapsed, 750)).x, 750 * eased(116, 750));
});

test('a flight ends on its exact target', () => {
  const from = { x: 10, y: 20, rotation: 0, scale: 1 }, target = { x: 400, y: 120, rotation: 15, scale: 1.2 };
  let elapsed = 0, last = 0, progress = 0;
  for (let now = 16; progress < 1 && now < 10000; now += 16) { elapsed = flightElapsed(elapsed, last, now); last = now; progress = flightProgress(elapsed, 750); }
  assert.equal(progress, 1);
  assert.equal(flightPlace(from, target, progress), target);
});
