export type FrameTiming = { fps: number; frameMs: number; samples: number };

/** Rates are measured over elapsed time, not averaged instantaneous FPS. */
export function frameWindow(windowMs = 2000) {
  const intervals: { end: number; ms: number }[] = [];
  let previous: number | undefined;
  return {
    reset() { intervals.length = 0; previous = undefined; },
    record(now: number) {
      if (previous !== undefined && now > previous) intervals.push({ end: now, ms: now - previous });
      previous = now;
      while (intervals.length && intervals[0].end <= now - windowMs) intervals.shift();
    },
    read(): FrameTiming | null {
      if (!intervals.length) return null;
      const frameMs = intervals.reduce((total, sample) => total + sample.ms, 0) / intervals.length;
      return { fps: 1000 / frameMs, frameMs, samples: intervals.length };
    },
  };
}

export type FrameClock = {
  request: (callback: (now: number) => void) => number;
  cancel: (id: number) => void;
  hidden: () => boolean;
  onVisibility: (listener: () => void) => () => void;
};

/** Sample every visible frame, publish only twice a second. Hidden time never
 * enters the next window. Kept independent of React for lifecycle verification. */
export function observeFrameTiming(clock: FrameClock, report: (timing: FrameTiming | null) => void) {
  const samples = frameWindow();
  let frame: number | undefined;
  let lastReport: number | undefined;
  let stopped = false;
  const tick = (now: number) => {
    if (stopped || clock.hidden()) return;
    samples.record(now);
    if (lastReport === undefined) lastReport = now;
    if (now - lastReport >= 500) { report(samples.read()); lastReport = now; }
    frame = clock.request(tick);
  };
  const visibility = () => {
    if (frame !== undefined) clock.cancel(frame);
    frame = undefined;
    samples.reset();
    lastReport = undefined;
    report(null);
    if (!stopped && !clock.hidden()) frame = clock.request(tick);
  };
  const off = clock.onVisibility(visibility);
  if (!clock.hidden()) frame = clock.request(tick);
  return () => { stopped = true; if (frame !== undefined) clock.cancel(frame); off(); };
}
