/*
  A clock on the frame, running the whole time, for use by hand.

  There is already a bench on this desk that drives its own drags and takes the
  drawing apart to say what each layer costs. This is the other half of the
  same question: not "what is expensive" but "is it expensive right now, while
  I am doing this". So it measures continuously, reports a few times a second,
  and never touches the thing it is watching.

  What it inherits from the bench, because they were expensive lessons:

  * Time from frame to frame, never around a handler. React renders a
    continuous event after the handler returns, so a stopwatch around the
    dispatch reads about half a millisecond however slow the desk is.
  * Sixty a second at rest means nothing at all. A window that is not being
    composited — behind another, scrolled away, in a preview pane nobody is
    looking at — still runs its animation frames exactly on time. So does a
    desk with nothing moving on it. A figure is only worth reading while
    something is actually being dragged, which is why the frames are kept in
    two piles and the resting pile is reported apart from the moving one.
  * The median is the honest middle; the worst frame is what a hand feels.
    Both are reported because they disagree, and the disagreement is the point.
*/

/** What a pile of frames came to. */
export type FrameStats = {
  /** How many frames went into it. Zero means there is nothing to say yet. */
  frames: number;
  /** Frames a second at the median. */
  fps: number;
  /** The middle frame, in milliseconds. */
  medianMs: number;
  /** The worst single frame, in milliseconds. */
  worstMs: number;
  /** How many came in over the budget. */
  overBudget: number;
};

/** One report from the meter. */
export type FrameReadout = {
  /** The recent past, whatever was happening in it. */
  live: FrameStats;
  /** Only the frames where nothing was being touched. Expect the refresh; be suspicious if not. */
  rest: FrameStats;
  /** Only the frames where something was being dragged. This is the figure that means anything. */
  load: FrameStats;
  /** Whether something is being dragged as of this report. */
  busy: boolean;
  /** Whether the window says it is not visible, in which case none of the above was drawn. */
  hidden: boolean;
  /** Frames so long the window was plainly suspended rather than slow. Thrown away, counted here. */
  stalls: number;
};

export type MeterOptions = {
  /** How many frames each pile remembers. */
  sample?: number;
  /** How often to report, in milliseconds. Kept slow: the report repaints the readout. */
  cadence?: number;
  /** A frame at or under this is the budget met. One refresh at sixty, near enough. */
  budgetMs?: number;
  /** Longer than this and the window was suspended, not slow: thrown away. */
  stallMs?: number;
  /** What counts as being under load. Defaults to a pointer being down anywhere. */
  busy?: () => boolean;
  /** Called every `cadence` with the current reading. */
  onRead?: (readout: FrameReadout) => void;
};

/** One refresh, near enough. */
export const BUDGET_MS = 17;

const EMPTY: FrameStats = { frames: 0, fps: 0, medianMs: 0, worstMs: 0, overBudget: 0 };

/** A fixed-length pile of frame times that can say what it amounts to. */
function pile(size: number) {
  const times: number[] = [];
  let next = 0;
  return {
    add(ms: number) {
      if (times.length < size) times.push(ms);
      else { times[next] = ms; next = (next + 1) % size; }
    },
    clear() { times.length = 0; next = 0; },
    stats(budgetMs: number): FrameStats {
      if (!times.length) return EMPTY;
      const sorted = [...times].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      return {
        frames: sorted.length,
        fps: Math.round(1000 / median),
        medianMs: +median.toFixed(1),
        worstMs: +sorted[sorted.length - 1].toFixed(1),
        overBudget: sorted.filter(ms => ms > budgetMs).length,
      };
    },
  };
}

export type FrameMeter = {
  /** The current reading, for a caller that would rather ask than be told. */
  read(): FrameReadout;
  /** Throw away every frame gathered so far and start again. */
  reset(): void;
  /** Stop measuring and let go of every listener. */
  stop(): void;
};

/**
 * Start timing frames in a window and keep timing them until stopped.
 *
 * The measuring itself is one animation frame callback that subtracts two
 * numbers, so the meter costs a great deal less than anything it is likely to
 * be watching. The reporting is throttled to `cadence` because a readout that
 * repainted every frame would be measuring itself.
 */
export function attachFrameMeter(win: Window, options: MeterOptions = {}): FrameMeter {
  const { sample = 120, cadence = 250, budgetMs = BUDGET_MS, stallMs = 250, onRead } = options;
  const doc = win.document;
  /* A pointer being down anywhere is the plain reading of "a hand is doing
     something". It catches every drag on the desk without the meter needing to
     know what a Movable is. */
  let pointers = 0;
  const busy = options.busy ?? (() => pointers > 0);

  const live = pile(sample);
  const rest = pile(sample);
  const load = pile(sample);
  let stalls = 0;

  /* The first frames after starting, and the frame across a change of state,
     belong to nothing: one is measuring the meter's own arrival, the other
     straddles a hand landing or letting go. */
  let skip = 2;
  let wasBusy = busy();
  let last = 0;
  let told = 0;
  let frame = 0;

  const read = (): FrameReadout => ({
    live: live.stats(budgetMs),
    rest: rest.stats(budgetMs),
    load: load.stats(budgetMs),
    busy: wasBusy,
    hidden: doc.visibilityState === 'hidden',
    stalls,
  });

  const tick = (now: number) => {
    frame = win.requestAnimationFrame(tick);
    const nowBusy = busy();
    const delta = now - last;
    last = now;

    if (nowBusy !== wasBusy) { wasBusy = nowBusy; skip = Math.max(skip, 1); }

    if (skip > 0) skip -= 1;
    else if (delta > stallMs) { stalls += 1; skip = 1; }
    else {
      live.add(delta);
      (nowBusy ? load : rest).add(delta);
    }

    if (onRead && now - told >= cadence) { told = now; onRead(read()); }
  };

  const down = () => { pointers += 1; };
  const up = () => { pointers = Math.max(0, pointers - 1); };
  /* A window coming back from hidden has a useless first frame and a stale pile
     behind it, so both go. */
  const woke = () => { if (doc.visibilityState === 'visible') { skip = 2; last = 0; } };

  doc.addEventListener('pointerdown', down, true);
  doc.addEventListener('pointerup', up, true);
  doc.addEventListener('pointercancel', up, true);
  doc.addEventListener('visibilitychange', woke);
  frame = win.requestAnimationFrame(tick);

  return {
    read,
    reset() { live.clear(); rest.clear(); load.clear(); stalls = 0; skip = 2; },
    stop() {
      win.cancelAnimationFrame(frame);
      doc.removeEventListener('pointerdown', down, true);
      doc.removeEventListener('pointerup', up, true);
      doc.removeEventListener('pointercancel', up, true);
      doc.removeEventListener('visibilitychange', woke);
    },
  };
}

/** Where a reading sits against the budget, for something to colour. */
export type FrameState = 'waiting' | 'good' | 'tight' | 'over';

export function frameState(stats: FrameStats, budgetMs = BUDGET_MS): FrameState {
  if (!stats.frames) return 'waiting';
  if (stats.medianMs <= budgetMs) return 'good';
  return stats.medianMs <= budgetMs * 2 ? 'tight' : 'over';
}

/**
 * What the reading is worth saying out loud, which is often not the number.
 *
 * An idle desk and a window nobody is drawing both read a perfect sixty, and
 * the readout owes the reader that warning rather than a green figure.
 */
export function frameNote(readout: FrameReadout): string {
  if (readout.hidden) return 'This window is hidden — nothing here was drawn.';
  if (readout.stalls > 0 && !readout.live.frames) return 'Frames are being throttled; bring this window to the front.';
  if (!readout.load.frames) return 'Nothing has been dragged yet — a resting desk always reads the refresh.';
  if (readout.load.medianMs <= BUDGET_MS && readout.load.worstMs <= BUDGET_MS * 1.3) {
    return 'Every dragged frame landed on the refresh. Either fast, or this window is not compositing.';
  }
  return `${readout.load.overBudget} of ${readout.load.frames} dragged frames missed the budget.`;
}
