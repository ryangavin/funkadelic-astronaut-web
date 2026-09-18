/*
  A bench for finding out where a frame goes while something on the desk is
  being dragged.

  It exists because the obvious guesses were all wrong. The desk felt slow, so
  the suspicion was too many React renders; it turned out React was never in the
  picture. What the bench measures instead is the frame itself — how long the
  browser actually took between one paint and the next while a thing was moving
  — and then the same drag again with one layer of the drawing taken away, so
  the difference names the cost. Counting renders tells you how busy React was.
  Only the clock tells you whether the desk is slow.

  Two warnings, both learned the hard way:

  * Do not time the pointer handler. React renders a continuous event after the
    handler has returned, so a stopwatch around the dispatch reads about half a
    millisecond however slow the desk is. Time from raf to raf.
  * Do not trust `longtask`. The desk never blocks the main thread for the fifty
    milliseconds that entry needs; it spends seventy in rasterisation, spread
    across work that never shows up there at all.
  * Read the verdict, not the numbers. A window that is not drawing — hidden
    behind another, scrolled out of view, in a preview pane nobody is looking at
    — still runs its animation frames on time, so every measurement comes back at
    exactly one refresh and the desk looks perfect. The tell is that taking layers
    away then saves nothing, because nothing was being drawn to begin with. That
    is what `verdict` is for, and it is the reason the lamp read 17ms and 88ms on
    the same afternoon.
*/

export type FrameCost = {
  /** What was dragged, and what was done to the desk first. */
  label: string;
  /** The middle frame of the drag, in milliseconds. 16.7 is a full sixty a second. */
  medianMs: number;
  /** The worst single frame, which is what a drag actually feels like. */
  worstMs: number;
  /** Frames per second at the median. */
  fps: number;
  /** How many of the frames came in over the sixty-a-second budget. */
  overBudget: number;
};

export type ProbeOptions = {
  /** How many pointer moves to time. The first few are thrown away. */
  moves?: number;
  /** How far each move travels, in screen pixels. Kept small so the thing stays on the desk. */
  reach?: number;
};

/* One refresh, near enough. Anything at or under this is the frame budget met. */
const REFRESH_MS = 17;

/*
  How many frames of real movement to throw away before starting the clock.

  A drag does not cost the same throughout. Some things on this desk run at the
  refresh for about the first third of a second of being moved and then step up
  — the dossier goes from seventeen milliseconds to nearer sixty and stays there
  for as long as you hold it. It is the second number that a hand feels, and the
  first that a short measurement reports: with four frames of settling and twenty
  timed, this bench used to time almost nothing but the cheap part, and ranked
  the dearest thing on the desk as one of the lightest. Twenty frames of movement
  is comfortably past where that step has happened.
*/
const SETTLE_FRAMES = 20;

const raf = (win: Window) => new Promise<void>(resolve => win.requestAnimationFrame(() => resolve()));

/** Every movable thing on the desk, by the name it answers to. */
export function draggables(root: Document | HTMLElement): string[] {
  return [...root.querySelectorAll('[role="group"][aria-roledescription="movable"]')]
    .map(element => element.getAttribute('aria-label') ?? '')
    .filter(Boolean);
}

function find(root: Document | HTMLElement, label: string): HTMLElement {
  const element = [...root.querySelectorAll<HTMLElement>('[role="group"]')].find(node => node.getAttribute('aria-label') === label);
  if (!element) throw new Error(`Nothing on the desk is called ${JSON.stringify(label)}`);
  return element;
}

/**
 * Drag one thing and time every frame of it.
 *
 * The drag is made of real pointer events on the thing itself, so it goes
 * through the same Movable, the same projection and the same state as a hand
 * would; only the pointer is synthetic. One move is dispatched per frame,
 * which is the most a real pointer ever delivers.
 */
export async function dragCost(root: Document | HTMLElement, label: string, { moves = 20, reach = 5 }: ProbeOptions = {}): Promise<FrameCost> {
  const element = find(root, label);
  const win = element.ownerDocument.defaultView;
  if (!win) throw new Error('The desk is not in a window');
  const box = element.getBoundingClientRect();
  const x = box.left + box.width / 2;
  const y = box.top + box.height / 2;
  const at = (type: string, cx: number, cy: number, buttons = 1) =>
    element.dispatchEvent(new win.PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', button: 0, buttons, clientX: cx, clientY: cy }));

  /* Past the drag threshold and settled, so none of the timed frames is paying
     for the pick-up — and then kept moving, unclocked, until the drag is in
     whatever state it is going to stay in. See SETTLE_FRAMES. */
  at('pointerdown', x, y);
  at('pointermove', x + reach * 2, y);
  for (let i = 0; i < 4; i += 1) await raf(win);
  for (let i = 0; i < SETTLE_FRAMES; i += 1) {
    at('pointermove', x + reach * 2 + (i % 2 ? reach : -reach), y + (i % 5));
    await raf(win);
  }

  const frames: number[] = [];
  let last = win.performance.now();
  for (let i = 0; i < moves; i += 1) {
    at('pointermove', x + reach * 2 + (i % 2 ? reach : -reach), y + (i % 5));
    await raf(win);
    const now = win.performance.now();
    frames.push(now - last);
    last = now;
  }
  /*
    Put it back before letting go. Movable works the move out from where the
    press began, so a last move to that exact point returns the thing to where
    it was found — and without this the bench is not measuring the same desk
    twice. What a drag costs turns out to depend a great deal on where the thing
    is standing: the lamp measured 17ms in one spot and 85ms in another, so a
    bench that quietly shuffled the desk every run would report its own drift as
    an improvement.
  */
  at('pointermove', x, y);
  at('pointerup', x, y, 0);
  for (let i = 0; i < 3; i += 1) await raf(win);

  const sorted = [...frames].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return {
    label,
    medianMs: +median.toFixed(1),
    worstMs: +sorted[sorted.length - 1].toFixed(1),
    fps: Math.round(1000 / median),
    overBudget: frames.filter(frame => frame > 17).length,
  };
}

export type DragLag = {
  label: string;
  /** Milliseconds from the pointer event to the DOM carrying the new place. */
  msToCommit: number;
  /** The worst of those, which is the one a hand notices. */
  worstMsToCommit: number;
  /** How many of the moves took longer than a frame to reach the DOM at all. */
  overAFrame: number;
  /** False when nothing ever moved, which makes the rest meaningless. */
  followed: boolean;
};

/**
 * How long the thing takes to catch up with the pointer.
 *
 * This is a different question from how long a frame takes, and the bench was
 * wrong to think one answered the other: a desk can redraw a full sixty times a
 * second and still feel dragged through treacle, because every one of those
 * frames shows where the pointer used to be.
 *
 * Two ways of asking it do not work, both tried:
 *
 *  * Counting frames to the first movement saturates. React commits a pointer
 *    move before the next paint whether it took two milliseconds or forty, so
 *    every object on the desk answers "one frame" and the slow one hides.
 *  * Timing to the end of a settle loop measures the loop, not the lag. That is
 *    what made everything here read fifty milliseconds — three frames of my own
 *    waiting, reported as though it were the desk's.
 *
 * So the clock stops when the DOM actually carries the new place, caught by
 * watching the element rather than by polling it. That has real resolution: it
 * is the work standing between the event and the pixel, which is the thing a
 * hand feels. Add about a frame for the paint that follows.
 *
 * It measures the synthetic path, not the real one — a dispatched event skips
 * the browser's own input queue and its coalescing — so treat it as a floor on
 * the lag rather than the whole of it.
 */
export async function dragLag(root: Document | HTMLElement, label: string, { jumps = 8, reach = 40 }: { jumps?: number; reach?: number } = {}): Promise<DragLag> {
  const element = find(root, label);
  const win = element.ownerDocument.defaultView;
  if (!win) throw new Error('The desk is not in a window');
  const box = element.getBoundingClientRect();
  const x = box.left + box.width / 2;
  const y = box.top + box.height / 2;
  const at = (type: string, cx: number, cy: number, buttons = 1) =>
    element.dispatchEvent(new win.PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', button: 0, buttons, clientX: cx, clientY: cy }));

  at('pointerdown', x, y);
  at('pointermove', x + 12, y);
  for (let i = 0; i < 6; i += 1) await raf(win);

  const took: number[] = [];
  let here = x + 12;
  for (let jump = 0; jump < jumps; jump += 1) {
    here += jump % 2 ? reach : -reach;
    const landed = new Promise<number>(resolve => {
      const t0 = win.performance.now();
      const watch = new win.MutationObserver(() => { watch.disconnect(); resolve(win.performance.now() - t0); });
      watch.observe(element, { attributes: true, attributeFilter: ['style'] });
      /* A move that never reaches the DOM is a failure, not a fast one. */
      win.setTimeout(() => { watch.disconnect(); resolve(Number.NaN); }, 400);
      at('pointermove', here, y);
    });
    const ms = await landed;
    if (Number.isFinite(ms)) took.push(ms);
    /* Clear of the last one before timing the next. */
    for (let i = 0; i < 3; i += 1) await raf(win);
  }
  at('pointermove', x, y);
  at('pointerup', x, y, 0);
  for (let i = 0; i < 3; i += 1) await raf(win);

  const sorted = [...took].sort((a, b) => a - b);
  return {
    label,
    msToCommit: +(sorted[Math.floor(sorted.length / 2)] ?? 0).toFixed(1),
    worstMsToCommit: +(sorted[sorted.length - 1] ?? 0).toFixed(1),
    overAFrame: took.filter(ms => ms > REFRESH_MS).length,
    followed: took.length > 0,
  };
}

/*
  Below this the hand is barely moving and the lag in time is not worth stating.

  Dividing a distance by a speed to get a time blows up as the speed goes to
  nothing: twenty pixels behind at half a pixel a frame reads as five hundred
  milliseconds, and the moment you slow down or turn round is exactly when the
  trailing distance persists and the speed collapses. A first version of this
  reported that number and it was the instrument's arithmetic, not the desk.
  Six pixels a frame is about three hundred and sixty a second — an
  unambiguous, deliberate drag.
*/
const MOVING_ENOUGH = 6;

export type HandDrag = {
  /** What is being dragged, by the name it answers to. */
  label: string;
  /** How far the thing is behind the pointer right now, in screen pixels. This is the plain fact. */
  trailingPx: number;
  /** How fast the hand is going, in pixels a frame. */
  speedPxPerFrame: number;
  /** What that distance is worth in time — only while the hand is properly moving, and 0 otherwise. */
  msBehind: number;
  /** Whether the hand was moving fast enough for `msBehind` to mean anything. */
  worthStating: boolean;
  /**
   * How many pointer reports arrived in the frame just gone.
   *
   * This is the one number that settles whether coalescing the stream is worth
   * doing at all. A mouse reports far faster than a screen redraws, but the
   * browser is supposed to hand the page about one move a frame and keep the
   * rest inside `getCoalescedEvents`. If this reads 1, then nothing is being
   * worked out more than once a frame and there is nothing to coalesce; if it
   * reads 4 or 8, the stream really is outrunning the screen. Neither a
   * dispatched event nor an injected drag can answer it — only a hand on a real
   * mouse can.
   */
  movesThisFrame: number;
  /** The frame the readout was taken on. */
  frameMs: number;
};

/**
 * What a real hand sees, which is the only sound way to ask this.
 *
 * Every synthetic measure of lag in this file is a floor rather than the truth.
 * A dispatched pointer event skips the browser's own input queue, its
 * coalescing and its hit testing, and it arrives exactly one to a frame, which
 * is the kindest case there is. Measured that way the lamp is the quickest
 * thing on the desk to reach the DOM — and the hand dragging it says otherwise.
 * When the instrument and the hand disagree, the hand is right.
 *
 * So this one measures the real thing: it watches whatever is genuinely being
 * dragged and reports how far behind the pointer it is drawn. The grab is not
 * usually at the middle of a thing, so the offset at the moment of pick-up is
 * taken as the zero and everything after is measured against it. Distance alone
 * says little — trailing forty pixels is nothing at a crawl and awful at speed
 * — so it is divided by the speed of the hand to give the lag in time.
 */
export function watchHandDrag(root: Document | HTMLElement, report: (drag: HandDrag | null) => void): () => void {
  const doc = root instanceof Document ? root : root.ownerDocument;
  const win = doc.defaultView;
  if (!win) return () => {};
  let pointer: { x: number; y: number } | null = null;
  let zero: { x: number; y: number } | null = null;
  let wasAt: { x: number; y: number } | null = null;
  let lastFrame = win.performance.now();
  let running = true;
  let ticking = false;

  let sinceFrame = 0;
  const follow = (event: PointerEvent) => { pointer = { x: event.clientX, y: event.clientY }; };
  /* Counted apart from the position, so that the press itself is not counted as a move. */
  const reported = (event: PointerEvent) => { follow(event); sinceFrame += 1; };
  /*
    The loop only turns over while a button is down. Left running it would read
    layout on every frame of every other measurement on this bench, and an
    instrument that costs a millisecond of the thing it is timing is worse than
    no instrument — the first version of this inflated its own frame times by
    half again.
  */
  const begin = (event: PointerEvent) => {
    follow(event);
    if (ticking) return;
    ticking = true;
    lastFrame = win.performance.now();
    win.requestAnimationFrame(tick);
  };
  const end = () => { ticking = false; zero = null; wasAt = null; report(null); };
  win.addEventListener('pointermove', reported, { capture: true, passive: true });
  win.addEventListener('pointerdown', begin, { capture: true, passive: true });
  win.addEventListener('pointerup', end, { capture: true, passive: true });
  win.addEventListener('pointercancel', end, { capture: true, passive: true });

  const middleOf = (element: Element) => {
    const box = element.getBoundingClientRect();
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  };

  const tick = () => {
    if (!running || !ticking) return;
    const now = win.performance.now();
    const frameMs = now - lastFrame;
    lastFrame = now;
    const reports = sinceFrame;
    sinceFrame = 0;
    const held = root.querySelector<HTMLElement>('[data-dragging]');
    if (!held || !pointer) {
      zero = null;
      wasAt = null;
      report(null);
    } else {
      const at = middleOf(held);
      /* Where the pointer sat within the thing when it was picked up: not lag, just where it was grabbed. */
      if (!zero) zero = { x: pointer.x - at.x, y: pointer.y - at.y };
      const behind = { x: pointer.x - at.x - zero.x, y: pointer.y - at.y - zero.y };
      const trailingPx = Math.hypot(behind.x, behind.y);
      const speed = wasAt ? Math.hypot(pointer.x - wasAt.x, pointer.y - wasAt.y) : 0;
      wasAt = { x: pointer.x, y: pointer.y };
      const worthStating = speed >= MOVING_ENOUGH;
      report({
        label: held.getAttribute('aria-label') ?? 'something',
        trailingPx: +trailingPx.toFixed(1),
        speedPxPerFrame: +speed.toFixed(1),
        msBehind: worthStating ? +(trailingPx / speed * frameMs).toFixed(1) : 0,
        worthStating,
        movesThisFrame: reports,
        frameMs: +frameMs.toFixed(1),
      });
    }
    win.requestAnimationFrame(tick);
  };

  return () => {
    running = false;
    ticking = false;
    win.removeEventListener('pointermove', reported, { capture: true });
    win.removeEventListener('pointerdown', begin, { capture: true });
    win.removeEventListener('pointerup', end, { capture: true });
    win.removeEventListener('pointercancel', end, { capture: true });
  };
}

/** What the desk costs while nobody is touching it. Anything but sixty a second here is something repainting for free. */
export async function idleCost(root: Document | HTMLElement, frames = 20): Promise<FrameCost> {
  const doc = root instanceof Document ? root : root.ownerDocument;
  const win = doc.defaultView;
  if (!win) throw new Error('The desk is not in a window');
  const times: number[] = [];
  for (let i = 0; i < 4; i += 1) await raf(win);
  let last = win.performance.now();
  for (let i = 0; i < frames; i += 1) {
    await raf(win);
    const now = win.performance.now();
    times.push(now - last);
    last = now;
  }
  const sorted = [...times].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return { label: 'nothing — the desk at rest', medianMs: +median.toFixed(1), worstMs: +sorted[sorted.length - 1].toFixed(1), fps: Math.round(1000 / median), overBudget: times.filter(t => t > 17).length };
}

/*
  A layer of the drawing that can be taken away for one measurement and put
  back. Dragging with it gone, against the same drag with it there, is what
  turns "the desk is slow" into "this is what it costs".
*/
export type Layer = { name: string; strip: (root: Document | HTMLElement) => () => void };

/** Hide everything matching, and give back the undo. */
const hiding = (selector: string): Layer['strip'] => root => {
  const hidden = [...root.querySelectorAll<HTMLElement>(selector)];
  const was = hidden.map(node => node.style.display);
  hidden.forEach(node => { node.style.display = 'none'; });
  return () => hidden.forEach((node, index) => { node.style.display = was[index]; });
};

export const DESK_LAYERS: Layer[] = [
  {
    /* The one that has always been worth the most. An SVG filter is rasterised
       off to one side and cannot be cached the way a moved layer can, so every
       element carrying one repaints from scratch each frame it changes. */
    name: 'referenced SVG filters (filter: url(#…))',
    strip: root => {
      const doc = root instanceof Document ? root : root.ownerDocument;
      const win = doc.defaultView!;
      const filtered = [...root.querySelectorAll<HTMLElement | SVGElement>('*')].filter(node => (win.getComputedStyle(node).filter || '').includes('url('));
      const was = filtered.map(node => node.style.filter);
      filtered.forEach(node => { node.style.filter = 'none'; });
      return () => filtered.forEach((node, index) => { node.style.filter = was[index]; });
    },
  },
  { name: 'every cast shadow on the desk', strip: hiding('.desk-study__shadow, .mug-cast-shadow, .lamp-cast-shadow') },
  /* The desk's own shadow on the boards: one shape, but the size of the room,
     and the only thing in the room that moves when the lamp does. */
  { name: 'the desk\u2019s shadow on the floor', strip: hiding('.desk-room__shadow') },
  /* The boards' own figure, drawn the way the desk top's is: turbulence pushing
     bands of tone about. It never changes, and it is the dearest thing in the
     room to rasterise — so taking it away while leaving the floor there is what
     separates “the shadow moved” from “the grain had to be worked out again”. */
  {
    name: 'the floor’s wood grain (filter: url(#…))',
    strip: root => {
      const bands = [...root.querySelectorAll<HTMLElement>('.floor__bands')];
      const was = bands.map(node => node.style.filter);
      bands.forEach(node => { node.style.filter = 'none'; });
      return () => bands.forEach((node, index) => { node.style.filter = was[index]; });
    },
  },
  { name: 'the lamp’s pool of light', strip: hiding('.lamp-light, .desk-lamp__pool') },
  { name: 'the whole lighting layer', strip: hiding('.perspective-desk__lighting') },
  { name: 'the room behind the desk', strip: hiding('.desk-room, .desk-room__wall, .desk-room__floor') },
];

export type Attribution = FrameCost & { savedMs: number; savedPct: number };

/** What a run of `attribute` amounts to, in words, because the numbers alone lie when the window is idle. */
export type Verdict =
  | { kind: 'attributed'; says: string }
  | { kind: 'already-fast'; says: string }
  | { kind: 'not-drawing'; says: string };

function judge(asIs: FrameCost, layers: Attribution[], drawing?: Drawing): Verdict {
  const best = layers[0];
  const movedTheNeedle = best && best.savedPct >= 3;
  if (movedTheNeedle) return { kind: 'attributed', says: `${best.savedPct}% of the frame is ${best.label.replace(/^without /, '')}.` };
  if (asIs.medianMs > REFRESH_MS * 1.5) {
    return { kind: 'attributed', says: 'Slow, but no single layer accounts for it — the cost is spread, or it is in a layer this bench cannot take away.' };
  }
  /* At the refresh with nothing to strip. Either genuinely fast, or nothing was
     drawn — and that is not a thing to guess at, so it was asked directly. */
  if (drawing?.available && !drawing.drawing) {
    return {
      kind: 'not-drawing',
      says: `Every frame landed on the refresh — and so did the control, which puts the room's grain back in the path of every frame and ought to cost twenty milliseconds (${drawing.plainMs}ms against ${drawing.loadedMs}ms). Nothing was being drawn, and the whole run is void. Bring the window to the front, make sure it is on screen, and run it again.`,
    };
  }
  return {
    kind: 'already-fast',
    says: drawing?.available
      ? `Already inside the frame budget, and the window really was drawing it: with the control applied the same drag went from ${drawing.plainMs}ms to ${drawing.loadedMs}ms. There is nothing here to attribute.`
      : 'Already inside the frame budget, so there is nothing here to attribute — though with no room on this desk there was no control to prove the window was drawing at all.',
  };
}

/**
 * Drag one thing once as the desk really is, then once per layer with that
 * layer taken away, and report what each was worth. The list comes back
 * dearest first, which is the order worth fixing in.
 */
export async function attribute(root: Document | HTMLElement, label: string, options?: ProbeOptions): Promise<{ asIs: FrameCost; layers: Attribution[]; verdict: Verdict }> {
  const asIs = await dragCost(root, label, options);
  const layers: Attribution[] = [];
  for (const layer of DESK_LAYERS) {
    const restore = layer.strip(root);
    const without = await dragCost(root, label, options);
    restore();
    layers.push({ ...without, label: `without ${layer.name}`, savedMs: +(asIs.medianMs - without.medianMs).toFixed(1), savedPct: Math.round((asIs.medianMs - without.medianMs) / asIs.medianMs * 100) });
  }
  layers.sort((a, b) => b.savedMs - a.savedMs);
  /* Only when the run has nothing to show for itself is it worth two more drags
     to find out whether that is the desk or the window. */
  const nothingToShow = !layers[0] || layers[0].savedPct < 3;
  const drawing = nothingToShow && asIs.medianMs <= REFRESH_MS * 1.5 ? await drawingCheck(root, options) : undefined;
  return { asIs, layers, verdict: judge(asIs, layers, drawing) };
}

/**
 * Whether a set of measurements can be believed at all.
 *
 * A window that is not drawing returns every frame on the refresh, whatever it
 * was asked to draw, so a run where nothing is dearer than anything else is not
 * a fast desk — it is no desk. Something on this desk always costs more than a
 * frame while it is really being rasterised, so if nothing does, the run is void.
 */
export function looksUndrawn(costs: FrameCost[]): boolean {
  return costs.length > 1 && costs.every(cost => cost.medianMs <= REFRESH_MS * 1.15);
}

export type Drawing = {
  /** False when the control could not be set up, in which case nothing at all follows from the rest. */
  available: boolean;
  /** Whether this window is really rasterising what it is asked to. */
  drawing: boolean;
  /** The same drag as it is, and again with the control applied. */
  plainMs: number;
  loadedMs: number;
};

const NOT_ASKED: Drawing = { available: false, drawing: true, plainMs: 0, loadedMs: 0 };

/**
 * Whether the measurements can be believed — asked properly this time.
 *
 * The old test was that something on the desk always costs more than a frame
 * while it is really being drawn, so a run where nothing did was a run where
 * nothing was drawn. That was true of this desk for as long as the desk was
 * slow, and it stopped being true the day it got fast: a desk that drags at the
 * refresh throughout is now an ordinary, correct result, and the bench was
 * calling it a broken instrument.
 *
 * So instead of inferring from an absence, this makes something happen. The
 * desk is given a load no compositor could absorb and dragged again. If the
 * frame does not budge, nothing is being rasterised and the whole run is void.
 * If it gets much dearer, the window is drawing and a fast reading is simply a
 * fast desk.
 */
export async function drawingCheck(root: Document | HTMLElement, options?: ProbeOptions): Promise<Drawing> {
  /*
    The control has to be something that is *invalidated*, not merely something
    expensive. Both obvious loads were tried and both were free: a wide blur over
    the whole desk, and sixteen stacked turbulence-filtered sheets over it, each
    measured at exactly the frame time without them. Of course they were — they
    never change, so they are rasterised once and composited thereafter, which is
    the very thing this desk has spent its life learning. A load that costs has to
    be dear to draw *and* dirtied every frame.

    There is one to hand, and it is the desk's own: take the floorboards' layer
    away and the room's grain is back in the path of the shadow that moves over
    it, which is worth some twenty milliseconds a frame and was measured both
    ways. So the control is simply the state this bench found the desk in before
    the boards were given a layer of their own.
  */
  const boards = [...root.querySelectorAll<HTMLElement>('.desk-room__floor > .floor')];
  /* And it has to be the lamp that is dragged. The boards are only ever dirtied
     by the shadow the lamp throws across them; drag anything else and the room is
     not touched at all, so the control sits there costing nothing and the bench
     reads a working window as a dead one. That mistake was made once already. */
  const lamp = root.querySelector('.perspective__lamp[role="group"]')?.getAttribute('aria-label');
  if (!boards.length || !lamp) return NOT_ASKED;
  const plain = await dragCost(root, lamp, options);
  const was = boards.map(node => node.style.willChange);
  boards.forEach(node => { node.style.willChange = 'auto'; });
  let loaded: FrameCost;
  try {
    loaded = await dragCost(root, lamp, options);
  } finally {
    boards.forEach((node, index) => { node.style.willChange = was[index]; });
  }
  return {
    available: true,
    /* A quarter again on the frame is far less than the control really costs, and far more than noise. */
    drawing: loaded.medianMs > plain.medianMs * 1.25,
    plainMs: plain.medianMs,
    loadedMs: loaded.medianMs,
  };
}

/** Every thing on the desk, dragged in turn, dearest first: which object is the problem. */
export async function sweep(root: Document | HTMLElement, options?: ProbeOptions): Promise<{ costs: FrameCost[]; undrawn: boolean; drawing?: Drawing }> {
  const costs: FrameCost[] = [await idleCost(root)];
  const things = draggables(root);
  for (const label of things) costs.push(await dragCost(root, label, options));
  const [idle, ...dragged] = costs;
  dragged.sort((a, b) => b.medianMs - a.medianMs);
  const ordered = [idle, ...dragged];
  /* Only worth the extra drag when the run came back suspiciously level; when
     something on the desk plainly cost more than a frame, it was plainly drawn. */
  if (!looksUndrawn(ordered) || !things.length) return { costs: ordered, undrawn: false };
  const drawing = await drawingCheck(root, options);
  return { costs: ordered, undrawn: drawing.available && !drawing.drawing, drawing };
}

/*
  ---------------------------------------------------------------------------
  Three more instruments, for the three questions the ones above cannot answer.

  What is here already says how long a frame took and what taking a layer away
  was worth. That is enough to know the desk is slow and roughly where, and not
  enough to know why — so each of these asks a different kind of question:

   * `splitFrames` asks what the frame was *made of*: how much of it the main
     thread was busy for, how much of that was style and layout, and how much
     was left over for the drawing, which happens somewhere else entirely. It
     settles the React argument with a number instead of a comment.
   * `wastedWork` asks how much of what we did was worth doing. It counts every
     attribute and every custom property written during a drag and how many of
     them wrote the value that was already there — and then says who.
   * `census` asks what the drawing is made of, which is why a repaint of it
     costs what it does. It moves nothing and is true whether or not the window
     is drawing, so it is the one reading here that cannot be void.
  ---------------------------------------------------------------------------
*/

/* The browser's own account of a frame. Not in the DOM types yet, and only the few fields worth having. */
type LongFrame = PerformanceEntry & {
  renderStart?: number;
  styleAndLayoutStart?: number;
  blockingDuration?: number;
  scripts?: { duration: number; forcedStyleAndLayoutDuration?: number; invoker?: string; invokerType?: string }[];
};

export type FrameSplit = {
  /** Whether the browser reports this at all. Without it the rest is zeroes. */
  available: boolean;
  /** How many frames it was able to account for. It only reports the ones over the threshold, so a fast run reports none — which is itself the answer. */
  frames: number;
  /** The whole of an average reported frame. */
  frameMs: number;
  /** How long the main thread was busy before the browser started rendering: our own code, React included. */
  scriptMs: number;
  /** Of the render, how much was working out style and laying the page out. */
  styleLayoutMs: number;
  /** How much of the script time above was a layout read forcing that work to happen early. */
  forcedMs: number;
  /** What is left: paint, raster and composite. None of it is on the main thread and none of it is ours to profile — it is simply the cost of the drawing. */
  drawingMs: number;
};

const NO_SPLIT: FrameSplit = { available: false, frames: 0, frameMs: 0, scriptMs: 0, styleLayoutMs: 0, forcedMs: 0, drawingMs: 0 };

/**
 * Watch what the frames of the next measurement are made of.
 *
 * The browser will break a frame down for you — `long-animation-frame` gives
 * the start of the frame, the moment rendering began, the moment style and
 * layout began, and what each script in it cost. Subtracting those gives the
 * one number nobody here has had: how much of the frame was spent somewhere
 * the main thread cannot see.
 *
 * The threshold can be brought down to sixteen milliseconds and no lower, so a
 * frame that lands on the refresh is never reported. That is not a gap: it
 * means the main thread had nothing long enough to mention, and if the frame
 * still took forty milliseconds, all forty of them were the drawing.
 */
export function splitFrames(win: Window = window): { stop: () => FrameSplit } {
  const seen: LongFrame[] = [];
  /* The window's own constructor, since the desk may be in another document; it is not on the Window type. */
  const Observer = (win as unknown as { PerformanceObserver?: typeof PerformanceObserver }).PerformanceObserver;
  if (!Observer) return { stop: () => NO_SPLIT };
  let observer: PerformanceObserver;
  try {
    observer = new Observer(list => { for (const entry of list.getEntries()) seen.push(entry as LongFrame); });
    /* Sixteen is the floor the browser allows; anything under it is a frame that met its budget. */
    observer.observe({ type: 'long-animation-frame', durationThreshold: 16 } as PerformanceObserverInit);
  } catch {
    return { stop: () => NO_SPLIT };
  }
  return {
    stop: () => {
      observer.disconnect();
      if (!seen.length) return { ...NO_SPLIT, available: true };
      const mean = (of: (frame: LongFrame) => number) => seen.reduce((total, frame) => total + of(frame), 0) / seen.length;
      const frameMs = mean(frame => frame.duration);
      const scriptMs = mean(frame => (frame.renderStart ? frame.renderStart - frame.startTime : frame.duration));
      const styleLayoutMs = mean(frame => (frame.styleAndLayoutStart ? frame.startTime + frame.duration - frame.styleAndLayoutStart : 0));
      const forcedMs = mean(frame => (frame.scripts ?? []).reduce((total, script) => total + (script.forcedStyleAndLayoutDuration ?? 0), 0));
      return {
        available: true,
        frames: seen.length,
        frameMs: +frameMs.toFixed(1),
        scriptMs: +scriptMs.toFixed(1),
        styleLayoutMs: +styleLayoutMs.toFixed(1),
        forcedMs: +forcedMs.toFixed(1),
        /* Whatever the frame took that the main thread cannot account for. */
        drawingMs: +Math.max(0, frameMs - scriptMs - styleLayoutMs).toFixed(1),
      };
    },
  };
}

/** One kind of redundant work, and who did it. */
export type Culprit = {
  /** The element, near enough to find it: its tag and first class, and what was written to it. */
  what: string;
  /** How many times a frame. */
  perFrame: number;
  /** True when every one of those wrote the value that was already there. */
  idle: boolean;
};

export type Wasted = FrameCost & {
  frames: number;
  /** Attributes written a frame, and how many of those wrote a value the element already had. */
  attributes: number;
  idleAttributes: number;
  /** The same for inline styles and custom properties. */
  styles: number;
  idleStyles: number;
  /** Boxes measured off the DOM mid-frame, each of which makes the browser work out style and layout there and then. */
  layoutReads: number;
  /** Who did the most of it, dearest first. */
  culprits: Culprit[];
  /** Who read the most layout, the same way. */
  readers: Culprit[];
};

/** A name for an element short enough to put in a table and specific enough to find it by. */
function nameOf(node: Element): string {
  const classes = typeof node.className === 'string' ? node.className : (node.className as unknown as SVGAnimatedString)?.baseVal ?? '';
  const first = classes.split(/\s+/).filter(Boolean)[0];
  return first ? `${node.tagName.toLowerCase()}.${first}` : node.tagName.toLowerCase();
}

/**
 * How much of a drag was spent putting things back where they already were.
 *
 * Everything on this desk that moves without re-rendering does it by writing
 * straight to the DOM, which is the right way round and is why the shadows keep
 * up with the lamp at all. But a write like that is unconditional: the code that
 * does it runs whenever its component renders, not only when what it writes has
 * changed, and an SVG attribute set to the value it already held still marks
 * that element as needing to be drawn again. A handful of those in the wrong
 * layer is worth more than everything else on this bench put together.
 *
 * So this drags a thing with every write and every layout read counted, and
 * separates the ones that changed something from the ones that did not. It is
 * the only reading here that names a line of code rather than a layer.
 *
 * It costs what it measures: wrapping three prototype methods makes every frame
 * of this run dearer than the same drag without the bench watching, so the
 * frame times it reports are its own and are not comparable with the tables
 * above. The counts are exact; the milliseconds beside them are not.
 */
export async function wastedWork(root: Document | HTMLElement, label: string, options?: ProbeOptions): Promise<Wasted> {
  const doc = root instanceof Document ? root : root.ownerDocument;
  const win = doc.defaultView;
  if (!win) throw new Error('The desk is not in a window');
  const element = win.Element.prototype;
  const declaration = win.CSSStyleDeclaration.prototype;
  const wasRect = element.getBoundingClientRect;
  const wasAttribute = element.setAttribute;
  const wasProperty = declaration.setProperty;

  let attributes = 0, idleAttributes = 0, styles = 0, idleStyles = 0, layoutReads = 0;
  const wrote = new Map<string, { count: number; idle: number }>();
  const read = new Map<string, number>();
  const tally = (map: Map<string, { count: number; idle: number }>, key: string, idle: boolean) => {
    const at = map.get(key) ?? { count: 0, idle: 0 };
    map.set(key, { count: at.count + 1, idle: at.idle + (idle ? 1 : 0) });
  };

  element.getBoundingClientRect = function (this: Element) {
    layoutReads += 1;
    read.set(nameOf(this), (read.get(nameOf(this)) ?? 0) + 1);
    return wasRect.call(this);
  };
  element.setAttribute = function (this: Element, name: string, value: string) {
    attributes += 1;
    const idle = this.getAttribute(name) === String(value);
    if (idle) idleAttributes += 1;
    tally(wrote, `${nameOf(this)} [${name}]`, idle);
    return wasAttribute.call(this, name, value);
  };
  declaration.setProperty = function (this: CSSStyleDeclaration, name: string, value: string | null, priority?: string) {
    styles += 1;
    const idle = this.getPropertyValue(name) === String(value ?? '');
    if (idle) idleStyles += 1;
    tally(wrote, name, idle);
    return wasProperty.call(this, name, value, priority);
  };

  let cost: FrameCost;
  try {
    cost = await dragCost(root, label, options);
  } finally {
    element.getBoundingClientRect = wasRect;
    element.setAttribute = wasAttribute;
    declaration.setProperty = wasProperty;
  }

  const frames = options?.moves ?? 20;
  const per = (count: number) => +(count / frames).toFixed(1);
  const listed = (map: Map<string, { count: number; idle: number }>) =>
    [...map].sort((a, b) => b[1].count - a[1].count).slice(0, 8).map(([what, at]) => ({ what, perFrame: per(at.count), idle: at.idle === at.count }));

  return {
    ...cost,
    frames,
    attributes: per(attributes),
    idleAttributes: per(idleAttributes),
    styles: per(styles),
    idleStyles: per(idleStyles),
    layoutReads: per(layoutReads),
    culprits: listed(wrote),
    readers: [...read].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([what, count]) => ({ what, perFrame: per(count), idle: false })),
  };
}

/** What the drawing is made of: the count of everything a repaint of it has to go through. */
export type Census = {
  /** Elements in the desk, all told. */
  nodes: number;
  /** Elements the compositor has to treat as their own surface, and cannot simply move. */
  filtered: number;
  /** Of those, the ones carrying a referenced SVG filter, which is the dear kind. */
  referenced: number;
  /** Elements that blend with whatever is painted beneath them, so neither can be drawn on its own. */
  blended: number;
  /** Elements that read back what is behind them. */
  backdrops: number;
  masked: number;
  boxShadows: number;
  /** Shapes in all the SVG on the desk. */
  shapes: number;
  /** Noise and displacement, which cost per pixel of the region they cover. */
  turbulence: number;
  blurs: number;
  /** How large the desk is being drawn, and how many pixels that really is. */
  drawn: string;
  megapixels: number;
};

export function census(root: Document | HTMLElement): Census {
  const doc = root instanceof Document ? root : root.ownerDocument;
  const win = doc.defaultView!;
  const host = root instanceof Document ? root.documentElement : root;
  const all = [...root.querySelectorAll('*')];
  const count = (matches: (style: CSSStyleDeclaration, node: Element) => boolean) =>
    all.filter(node => matches(win.getComputedStyle(node), node)).length;
  const box = host.getBoundingClientRect();
  return {
    nodes: all.length,
    filtered: count(style => !!style.filter && style.filter !== 'none'),
    referenced: count(style => (style.filter || '').includes('url(')),
    blended: count(style => !!style.mixBlendMode && style.mixBlendMode !== 'normal'),
    backdrops: count(style => { const back = style.backdropFilter || style.getPropertyValue('-webkit-backdrop-filter'); return !!back && back !== 'none'; }),
    masked: count((style, node) => (!!style.maskImage && style.maskImage !== 'none') || node.hasAttribute('mask')),
    boxShadows: count(style => !!style.boxShadow && style.boxShadow !== 'none'),
    shapes: root.querySelectorAll('path, polygon, circle, rect, ellipse, line, use, image, text').length,
    turbulence: root.querySelectorAll('feTurbulence, feDisplacementMap').length,
    blurs: root.querySelectorAll('feGaussianBlur').length,
    drawn: `${Math.round(box.width)}×${Math.round(box.height)} at dpr ${win.devicePixelRatio}`,
    megapixels: +(box.width * box.height * win.devicePixelRatio ** 2 / 1e6).toFixed(1),
  };
}

export type Series = {
  label: string;
  /** Every frame of the drag, in order. */
  frames: number[];
  medianMs: number;
  worstMs: number;
  /**
   * The frame the drag got dearer at and stayed, if it did.
   *
   * Worth having its own number, because a median hides it completely and a
   * worst frame calls it a blip. A drag that runs at the refresh for a third of
   * a second and then settles ten milliseconds slower for as long as you hold it
   * is not an outlier — it is two different drags, and only the second one is
   * the one a hand feels.
   */
  stepAt?: number;
  /** What it cost before and after that, so the step can be stated rather than eyeballed. */
  beforeMs?: number;
  afterMs?: number;
};

const middle = (of: number[]) => {
  if (!of.length) return 0;
  const sorted = [...of].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

/**
 * Drag one thing and hand back every frame of it, rather than a median.
 *
 * The median is the right summary for comparing one desk with another and the
 * wrong one for understanding a single drag: it says nothing about whether the
 * cost was spread evenly, spiked once, or stepped up partway and stayed there.
 * Those want different fixes, and the only way to tell them apart is to look at
 * the frames in the order they happened.
 *
 * It holds the thing still for the first few frames deliberately — a drag that
 * is not moving is the control, and if that is slow too then nothing about the
 * motion is to blame.
 */
export async function frameSeries(root: Document | HTMLElement, label: string, { moves = 48, reach = 6 }: ProbeOptions = {}): Promise<Series> {
  const element = find(root, label);
  const win = element.ownerDocument.defaultView;
  if (!win) throw new Error('The desk is not in a window');
  const box = element.getBoundingClientRect();
  const x = box.left + box.width / 2;
  const y = box.top + box.height / 2;
  const at = (type: string, cx: number, cy: number, buttons = 1) =>
    element.dispatchEvent(new win.PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', button: 0, buttons, clientX: cx, clientY: cy }));

  at('pointerdown', x, y);
  at('pointermove', x + reach * 2, y);
  for (let i = 0; i < 3; i += 1) await raf(win);

  const frames: number[] = [];
  let last = win.performance.now();
  for (let i = 0; i < moves; i += 1) {
    at('pointermove', x + reach * 2 + (i % 2 ? reach : -reach), y);
    await raf(win);
    const now = win.performance.now();
    frames.push(+(now - last).toFixed(1));
    last = now;
  }
  at('pointermove', x, y);
  at('pointerup', x, y, 0);
  for (let i = 0; i < 3; i += 1) await raf(win);

  /* A step, not a spike: the drag is dearer from some frame on and stays that
     way to the end. Found by comparing the two ends and then looking for where
     the crossing happened and held. */
  const third = Math.max(4, Math.floor(frames.length / 3));
  const before = middle(frames.slice(0, third));
  const after = middle(frames.slice(-third));
  let stepAt: number | undefined;
  if (after > before * 1.25 && after - before > 3) {
    const between = (before + after) / 2;
    for (let i = 0; i + 4 < frames.length; i += 1) {
      if (frames.slice(i, i + 5).every(frame => frame > between)) { stepAt = i + 1; break; }
    }
  }
  return {
    label,
    frames,
    medianMs: +middle(frames).toFixed(1),
    worstMs: +Math.max(...frames).toFixed(1),
    stepAt,
    beforeMs: stepAt ? +before.toFixed(1) : undefined,
    afterMs: stepAt ? +after.toFixed(1) : undefined,
  };
}
