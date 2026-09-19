const assert = require('node:assert/strict');
const test = require('node:test');
const { frameWindow, observeFrameTiming } = require('../src/debug/PerformanceOverlay/frameTiming.ts');

test('frame rate is count over elapsed time and old intervals leave the rolling window', () => {
  const window = frameWindow(100);
  assert.equal(window.read(), null);
  [0, 10, 40].forEach(at => window.record(at));
  assert.deepEqual(window.read(), { fps: 50, frameMs: 20, samples: 2 });
  window.record(140);
  assert.deepEqual(window.read(), { fps: 10, frameMs: 100, samples: 1 });
  window.reset();
  window.record(10000);
  assert.equal(window.read(), null);
  window.record(10020);
  assert.equal(window.read().fps, 50);
});

test('sampling throttles reports, excludes hidden time, and releases frames/listeners', () => {
  let next = 0, hidden = false, visibility;
  const queued = new Map();
  const reports = [];
  const source = {
    request(callback) { queued.set(++next, callback); return next; },
    cancel(id) { queued.delete(id); },
    hidden: () => hidden,
    onVisibility(listener) { visibility = listener; return () => { visibility = undefined; }; },
  };
  const step = at => { const pending = [...queued.values()]; queued.clear(); pending.forEach(callback => callback(at)); };
  const stop = observeFrameTiming(source, value => reports.push(value));
  for (let at = 0; at <= 1000; at += 10) step(at);
  assert.equal(reports.length, 2);
  assert.equal(reports[1].fps, 100);
  hidden = true; visibility();
  assert.equal(queued.size, 0);
  assert.equal(reports.at(-1), null);
  hidden = false; visibility();
  for (let at = 10000; at <= 10500; at += 20) step(at);
  assert.equal(reports.at(-1).fps, 50);
  const late = [...queued.values()][0];
  stop();
  assert.equal(queued.size, 0);
  assert.equal(visibility, undefined);
  late(10600);
  assert.equal(queued.size, 0);
});

test('an overlay mounted in a hidden document requests no frames', () => {
  let requests = 0, detached = false;
  const stop = observeFrameTiming({
    request() { requests++; return requests; },
    cancel() {},
    hidden: () => true,
    onVisibility() { return () => { detached = true; }; },
  }, () => assert.fail('no samples should be published'));
  assert.equal(requests, 0);
  stop();
  assert.equal(detached, true);
});
