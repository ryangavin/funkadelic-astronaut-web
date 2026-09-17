/*
  What a fountain pen leaves on the page, and what a rubber stamp leaves on top
  of it. Both are worked out here so the component only has to draw them.

  A nib holds a bead of ink at the paper. Drawn slowly it has time to feed and
  lays a broad wet line; pulled fast it starves and the line goes fine and
  ragged. So the stroke is not a stroke at all: it is a ribbon whose width is a
  function of how fast the hand was moving, built as an outline and filled. At
  the places where the hand slowed or turned back on itself the bead sits and
  spreads, and those get their own pool of ink, multiplied over the ribbon, so
  the darkness at a turn is the ink piling up rather than a darker colour.

  Everything here is in the signature rule's own box, 320 by 110, whatever size
  the page happens to be drawn at. Points carry the time they were laid down,
  in milliseconds from the moment the nib touched, which is what the speed is
  measured from — and what makes the ink the same on a phone and a monitor.
*/

/** A place the nib was, and how long after touching down it was there. */
export type ContractPoint = {
  /** Across the signature rule, 0 at its left end, 320 at its right. */
  x: number;
  /** Down it, 0 at the top of the writing space, 110 below the rule. */
  y: number;
  /** Milliseconds since the nib touched the paper for this stroke. */
  t: number;
};

/** One touch of the nib: everything laid down between the pen going down and coming up. */
export type ContractStroke = ContractPoint[];

/** A signature as the page keeps it: the strokes, and when the pen last left the paper. */
export type ContractSignature = {
  /** The strokes in the order they were written, in the rule's 320 by 110 box. */
  strokes: ContractStroke[];
  /** When the pen last came off the page, as an ISO timestamp. */
  signedAt?: string;
};

/** The signature rule's own box: three inches of writing space with the printed rule near its foot. */
export const SIGNATURE_BOX = { width: 320, height: 110, rule: 92 } as const;

/** The nib: how broad it is at a standstill, how fine it starves to, and the speed it starves at. */
export const NIB = {
  /** Width of the line at a standstill, in box units. */
  wide: 5,
  /** Width it starves to when the hand is running, in box units. */
  fine: 1.6,
  /** The speed, in box units per millisecond, at which it has starved most of the way. */
  starve: 0.5,
} as const;

/** How far the ink has to travel before what is on the page counts as a signature rather than a scratch. */
export const CONTRACT_SIGNED_LENGTH = 90;

/** How long the ink stays wet before it has dried into the stock, in milliseconds. */
export const CONTRACT_DRY_MS = 2600;

/** How long the hand takes to write the whole signature when the key is held down, in milliseconds. */
export const CONTRACT_HAND_MS = 1500;

/** How often the hand is sampled as it writes, in milliseconds: near enough a frame. */
export const CONTRACT_HAND_STEP = 24;

/** How long the stamp takes to come down, print and lift off again, in milliseconds. */
export const CONTRACT_THUMP_MS = 520;

const round = (value: number) => Math.round(value * 100) / 100;

/** A short moving average, because a nib has weight and cannot change width from one sample to the next. */
function smooth(values: number[], radius = 2): number[] {
  return values.map((_, index) => {
    let sum = 0;
    let count = 0;
    for (let i = Math.max(0, index - radius); i <= Math.min(values.length - 1, index + radius); i += 1) {
      sum += values[i];
      count += 1;
    }
    return sum / count;
  });
}

/** How wide the line is at a given speed, in box units per millisecond: broad at a standstill, fine on the run. */
export function nibWidth(speed: number): number {
  return NIB.fine + (NIB.wide - NIB.fine) * Math.exp(-Math.max(0, speed) / NIB.starve);
}

/** The speed of the hand at each point of a stroke, smoothed the way a nib smooths it. */
export function speeds(stroke: ContractStroke): number[] {
  const raw = stroke.map((point, index) => {
    if (index === 0) return 0;
    const previous = stroke[index - 1];
    const span = Math.max(1, point.t - previous.t);
    return Math.hypot(point.x - previous.x, point.y - previous.y) / span;
  });
  if (raw.length > 1) raw[0] = raw[1];
  return smooth(raw);
}

/** The direction the hand was travelling at each point, as a unit vector. */
function headings(stroke: ContractStroke): { x: number; y: number }[] {
  return stroke.map((point, index) => {
    const before = stroke[Math.max(0, index - 1)];
    const after = stroke[Math.min(stroke.length - 1, index + 1)];
    const dx = after.x - before.x;
    const dy = after.y - before.y;
    const length = Math.hypot(dx, dy);
    return length ? { x: dx / length, y: dy / length } : { x: 1, y: 0 };
  });
}

/**
 * A run of samples curved through rather than joined up. A pointer is read
 * every few milliseconds and a key not much oftener, and joining those up with
 * straight lines draws a polyline, which no hand ever made: so the line is
 * curved through the samples, each one the control point for the arc between
 * its neighbours' midpoints.
 */
function curved(points: [number, number][]): string {
  const place = ([x, y]: [number, number]) => `${round(x)} ${round(y)}`;
  if (points.length < 3) return points.slice(1).map((point) => `L ${place(point)}`).join(' ');
  const parts: string[] = [];
  for (let index = 1; index < points.length - 1; index += 1) {
    const middle: [number, number] = [
      (points[index][0] + points[index + 1][0]) / 2,
      (points[index][1] + points[index + 1][1]) / 2,
    ];
    parts.push(`Q ${place(points[index])} ${place(middle)}`);
  }
  parts.push(`L ${place(points[points.length - 1])}`);
  return parts.join(' ');
}

/**
 * The wet line itself: the path down one side of the stroke and back up the
 * other, so the gap between them is the nib's width at that moment. Filled,
 * not stroked — a stroked line is one width all the way along, which is the
 * one thing a pen never is.
 */
export function ribbon(stroke: ContractStroke): string {
  if (stroke.length < 2) return '';
  const widths = speeds(stroke).map(nibWidth);
  const way = headings(stroke);
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  stroke.forEach((point, index) => {
    const half = widths[index] / 2;
    const { x: dx, y: dy } = way[index];
    left.push([point.x - dy * half, point.y + dx * half]);
    right.push([point.x + dy * half, point.y - dx * half]);
  });
  right.reverse();
  return `M ${round(left[0][0])} ${round(left[0][1])} ${curved(left)} L ${round(right[0][0])} ${round(right[0][1])} ${curved(right)} Z`;
}

/** A bead of ink standing on the paper: where it is, and how far it spread. */
export type ContractPool = { x: number; y: number; r: number };

/**
 * Where the ink pooled. The nib leaves a bead wherever the hand hesitated or
 * doubled back on itself, and the beads are drawn over the ribbon and over each
 * other, so two of them together are darker than one. A single touch that never
 * moved is all bead and no line.
 */
export function pools(stroke: ContractStroke): ContractPool[] {
  if (stroke.length === 0) return [];
  if (stroke.length === 1) return [{ x: round(stroke[0].x), y: round(stroke[0].y), r: round(NIB.wide / 2) }];
  const pace = speeds(stroke);
  const way = headings(stroke);
  const found: ContractPool[] = [];
  for (let index = 1; index < stroke.length - 1; index += 1) {
    const turn = way[index - 1].x * way[index + 1].x + way[index - 1].y * way[index + 1].y;
    const dawdling = pace[index] < NIB.starve * 0.55;
    const doubling = turn < 0.25;
    if (!dawdling && !doubling) continue;
    const spread = nibWidth(pace[index]) * (doubling ? 0.62 : 0.48);
    const last = found[found.length - 1];
    // One bead, not a string of them: a pool within a pool's reach of the last is the same pool.
    if (last && Math.hypot(stroke[index].x - last.x, stroke[index].y - last.y) < last.r) continue;
    found.push({ x: round(stroke[index].x), y: round(stroke[index].y), r: round(spread) });
  }
  return found;
}

/** How far the nib travelled over a stroke, in box units. */
export function strokeLength(stroke: ContractStroke): number {
  let length = 0;
  for (let index = 1; index < stroke.length; index += 1) {
    length += Math.hypot(stroke[index].x - stroke[index - 1].x, stroke[index].y - stroke[index - 1].y);
  }
  return length;
}

/** How far the nib travelled over the whole signature, in box units. */
export function signatureLength(signature: ContractSignature | null | undefined): number {
  return (signature?.strokes ?? []).reduce((total, stroke) => total + strokeLength(stroke), 0);
}

/** Whether what is on the line is a signature. A dot and a scratch are ink, but nobody signed anything. */
export function isSigned(signature: ContractSignature | null | undefined): boolean {
  return signatureLength(signature) >= CONTRACT_SIGNED_LENGTH;
}

/* --- The hand that writes for the keyboard ------------------------------- */

/*
  Held down, the pen writes by itself, and it has to write like a hand and not
  like a plotter. The signature is a run of curves, and the pen spends the same
  amount of time on each of them however long it is: so it crawls round the tight
  loops and runs away with itself on the long sweeps, and the ink thins and
  thickens on its own, out of the same measurement as a dragged one.
*/
type Curve = [[number, number], [number, number], [number, number], [number, number]];

const HAND: Curve[] = [
  // The upstroke and bowl of a capital, taken slowly.
  [[26, 88], [22, 52], [24, 20], [36, 12]],
  [[36, 12], [68, 6], [74, 40], [44, 46]],
  [[44, 46], [58, 52], [70, 66], [86, 84]],
  // Two quick humps of whatever the rest of the name is.
  [[86, 84], [96, 60], [110, 58], [116, 78]],
  [[116, 78], [124, 62], [136, 60], [146, 76]],
  // A tall loop, up and back down through itself.
  [[146, 76], [150, 38], [156, 16], [168, 14]],
  [[168, 14], [182, 16], [176, 46], [160, 62]],
  // The tail, getting away from itself.
  [[160, 62], [178, 82], [208, 74], [232, 60]],
  [[232, 60], [258, 50], [276, 66], [300, 42]],
  // And the flourish back underneath, across the printed rule.
  [[300, 42], [248, 104], [118, 106], [46, 92]],
];

/** Where the hand's pen is once it is `progress` of the way, 0 to 1, through the signature. */
export function handAt(progress: number): { x: number; y: number } {
  const along = Math.min(0.999999, Math.max(0, progress)) * HAND.length;
  const curve = HAND[Math.floor(along)];
  const t = along - Math.floor(along);
  const u = 1 - t;
  const [p0, c1, c2, p1] = curve;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: round(a * p0[0] + b * c1[0] + c * c2[0] + d * p1[0]),
    y: round(a * p0[1] + b * c1[1] + c * c2[1] + d * p1[1]),
  };
}

/* --- The rubber -------------------------------------------------------- */

/** A number between 0 and 1 that is always the same for the same words: the stamp's own crookedness. */
function seeded(text: string, salt: number): number {
  let hash = 2166136261 ^ salt;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) / 10000;
}

/** How a particular stamp came down: never square, never evenly inked, never all there. */
export type ContractImpression = {
  /** How far off square it landed, in degrees. */
  angle: number;
  /** Which way the hand leaned on it, in degrees round the face: that edge printed and the far one didn't. */
  lean: number;
  /** Holes where the rubber was too dry to take, as a fraction of the impression's width and height. */
  gaps: { x: number; y: number; r: number }[];
};

/**
 * The impression a given stamp leaves. Worked out from the words on it, so one
 * stamp is crooked the same way every time it comes down — it is the same piece
 * of rubber — while another reads differently.
 */
export function impression(text: string): ContractImpression {
  const angle = -3 - seeded(text, 1) * 7;
  const lean = seeded(text, 2) * 360;
  const gaps = [0, 1, 2, 3].map((index) => ({
    x: 0.08 + seeded(text, 10 + index) * 0.84,
    y: 0.12 + seeded(text, 20 + index) * 0.76,
    r: 0.04 + seeded(text, 30 + index) * 0.08,
  }));
  return { angle: round(angle), lean: round(lean), gaps };
}
