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

  /* Past the drag threshold and settled, so none of the timed frames is paying for the pick-up. */
  at('pointerdown', x, y);
  at('pointermove', x + reach * 2, y);
  for (let i = 0; i < 4; i += 1) await raf(win);

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

function judge(asIs: FrameCost, layers: Attribution[]): Verdict {
  const best = layers[0];
  const movedTheNeedle = best && best.savedPct >= 3;
  if (movedTheNeedle) return { kind: 'attributed', says: `${best.savedPct}% of the frame is ${best.label.replace(/^without /, '')}.` };
  if (asIs.medianMs > REFRESH_MS * 1.5) {
    return { kind: 'attributed', says: 'Slow, but no single layer accounts for it — the cost is spread, or it is in a layer this bench cannot take away.' };
  }
  /* At the refresh rate with nothing to strip. Either genuinely fast, or nothing was drawn. */
  return {
    kind: asIs.worstMs < REFRESH_MS * 1.3 ? 'not-drawing' : 'already-fast',
    says: asIs.worstMs < REFRESH_MS * 1.3
      ? 'Every frame landed on the refresh and no layer was worth anything — this window was almost certainly not drawing. Bring it to the front, make sure it is on screen, and run it again.'
      : 'Already inside the frame budget, so there is nothing here to attribute.',
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
  return { asIs, layers, verdict: judge(asIs, layers) };
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

/** Every thing on the desk, dragged in turn, dearest first: which object is the problem. */
export async function sweep(root: Document | HTMLElement, options?: ProbeOptions): Promise<{ costs: FrameCost[]; undrawn: boolean }> {
  const costs: FrameCost[] = [await idleCost(root)];
  for (const label of draggables(root)) costs.push(await dragCost(root, label, options));
  const [idle, ...dragged] = costs;
  dragged.sort((a, b) => b.medianMs - a.medianMs);
  const ordered = [idle, ...dragged];
  return { costs: ordered, undrawn: looksUndrawn(ordered) };
}
