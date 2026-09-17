const { test } = require('node:test');
const assert = require('node:assert/strict');

/*
  The meter is driven by hand here: a fake window whose animation frames only
  advance when this file says so, and whose clock only moves when this file
  moves it. That is the only way to assert on a frame counter — a real raf
  would make every figure a measurement of the test runner.
*/
function fixture() {
  const listeners = new Map();
  const doc = {
    visibilityState: 'visible',
    addEventListener(name, handler) { (listeners.get(name) ?? listeners.set(name, new Set()).get(name)).add(handler); },
    removeEventListener(name, handler) { listeners.get(name)?.delete(handler); },
    emit(name, event = {}) { listeners.get(name)?.forEach(handler => handler(event)); },
    count() { return [...listeners.values()].reduce((n, set) => n + set.size, 0); },
  };
  let pending = null;
  let cancelled = 0;
  const win = {
    document: doc,
    requestAnimationFrame(frame) { pending = frame; return 1; },
    cancelAnimationFrame() { cancelled += 1; },
  };
  let clock = 1000;
  /** Advance the clock by `ms` and run one animation frame at the new time. */
  const frame = ms => { clock += ms; const run = pending; pending = null; run(clock); };
  return { win, doc, frame, cancels: () => cancelled };
}

const load = () => import('../src/behaviors/FrameRate/meter.ts');

test('frame meter throws away its own arrival and reports the middle frame', async () => {
  const { attachFrameMeter } = await load();
  const f = fixture();
  const reads = [];
  const meter = attachFrameMeter(f.win, { cadence: 0, onRead: r => reads.push(r) });

  /* The first two frames belong to nothing: one is the meter arriving, one is
     the first real interval measured against a clock that had not started. */
  f.frame(500);
  f.frame(16);
  assert.equal(meter.read().live.frames, 0);

  for (const ms of [16, 16, 50, 16, 16]) f.frame(ms);
  const { live } = meter.read();
  assert.equal(live.frames, 5);
  assert.equal(live.medianMs, 16);
  assert.equal(live.worstMs, 50);
  assert.equal(live.fps, 63);
  assert.equal(live.overBudget, 1);
  assert.ok(reads.length >= 5, 'reports on every frame at zero cadence');

  meter.stop();
  assert.equal(f.cancels(), 1);
  assert.equal(f.doc.count(), 0, 'lets go of every listener');
});

test('frames while a pointer is down are kept apart from frames at rest', async () => {
  const { attachFrameMeter } = await load();
  const f = fixture();
  const meter = attachFrameMeter(f.win, { cadence: 1e9 });
  f.frame(500);
  f.frame(16);

  for (let i = 0; i < 4; i += 1) f.frame(16);
  f.doc.emit('pointerdown');
  /* The frame across the hand landing straddles both states and belongs to neither. */
  f.frame(40);
  for (let i = 0; i < 4; i += 1) f.frame(60);
  f.doc.emit('pointerup');
  f.frame(40);
  for (let i = 0; i < 3; i += 1) f.frame(16);

  const readout = meter.read();
  assert.equal(readout.rest.frames, 7);
  assert.equal(readout.rest.medianMs, 16);
  assert.equal(readout.load.frames, 4);
  assert.equal(readout.load.medianMs, 60);
  assert.equal(readout.load.overBudget, 4);
  assert.equal(readout.busy, false);
  meter.stop();
});

test('a suspended window is counted as a stall, not as a slow frame', async () => {
  const { attachFrameMeter } = await load();
  const f = fixture();
  const meter = attachFrameMeter(f.win, { cadence: 1e9, stallMs: 250 });
  f.frame(500);
  f.frame(16);
  for (let i = 0; i < 3; i += 1) f.frame(16);

  f.frame(4000);
  /* And the frame straight after it, which is the window waking up. */
  f.frame(300);
  for (let i = 0; i < 3; i += 1) f.frame(16);

  const readout = meter.read();
  assert.equal(readout.stalls, 1);
  assert.equal(readout.live.worstMs, 16, 'the suspension is not passed off as a slow frame');
  assert.equal(readout.live.frames, 6);
  meter.stop();
});

test('coming back from hidden throws away the first frames rather than believing them', async () => {
  const { attachFrameMeter } = await load();
  const f = fixture();
  const meter = attachFrameMeter(f.win, { cadence: 1e9 });
  f.frame(500);
  f.frame(16);
  f.frame(16);

  f.doc.visibilityState = 'hidden';
  assert.equal(meter.read().hidden, true);
  f.doc.visibilityState = 'visible';
  f.doc.emit('visibilitychange');
  f.frame(9000);
  f.frame(9000);
  f.frame(16);

  const readout = meter.read();
  assert.equal(readout.hidden, false);
  assert.equal(readout.stalls, 0);
  assert.equal(readout.live.frames, 2, 'both waking frames are discarded');
  meter.stop();
});

test('a custom sense of load overrides the pointer, and the piles are capped', async () => {
  const { attachFrameMeter } = await load();
  const f = fixture();
  let busy = false;
  const meter = attachFrameMeter(f.win, { cadence: 1e9, sample: 3, busy: () => busy });
  f.frame(500);
  f.frame(16);

  busy = true;
  f.frame(16);
  for (const ms of [20, 30, 40, 50]) f.frame(ms);
  const readout = meter.read();
  assert.equal(readout.busy, true);
  assert.equal(readout.load.frames, 3, 'remembers only the last `sample` frames');
  assert.equal(readout.load.medianMs, 40);
  assert.equal(readout.rest.frames, 0);
  meter.stop();
});

test('the note says what a bare figure cannot', async () => {
  const { frameNote, frameState } = await load();
  const stats = (medianMs, frames = 10) => ({ frames, fps: Math.round(1000 / medianMs), medianMs, worstMs: medianMs, overBudget: 0 });
  const none = { frames: 0, fps: 0, medianMs: 0, worstMs: 0, overBudget: 0 };

  assert.match(frameNote({ live: stats(16), rest: stats(16), load: none, busy: false, hidden: true, stalls: 0 }), /hidden/);
  assert.match(frameNote({ live: stats(16), rest: stats(16), load: none, busy: false, hidden: false, stalls: 0 }), /Nothing has been dragged/);
  assert.match(frameNote({ live: stats(16), rest: stats(16), load: stats(16), busy: true, hidden: false, stalls: 0 }), /not compositing/);
  assert.match(
    frameNote({ live: stats(60), rest: stats(16), load: { ...stats(60), overBudget: 9 }, busy: true, hidden: false, stalls: 0 }),
    /9 of 10 dragged frames missed/,
  );

  assert.equal(frameState(none), 'waiting');
  assert.equal(frameState(stats(16)), 'good');
  assert.equal(frameState(stats(30)), 'tight');
  assert.equal(frameState(stats(60)), 'over');
});
