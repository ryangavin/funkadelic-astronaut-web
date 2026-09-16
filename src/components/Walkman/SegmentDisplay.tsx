import { OUTLINE, SEGMENTS, encode, type Segment } from './segments';

/*
  Draws a row of segmented cells. Every cell carries every segment, lit or
  ghosted, the way a real LCD does: the unlit ones are still faintly there.
  The whole row leans a few degrees, like the italic digits on a deck.
*/

export const CELL_WIDTH = 64;
export const COLON_WIDTH = 26;
export const CELL_HEIGHT = 100;
const SLANT = 7;
const LEAN = Math.tan((SLANT * Math.PI) / 180) * CELL_HEIGHT;

const x0 = 8;
const x1 = 52;
const xm = 30;
const y0 = 8;
const y1 = 92;
const ym = 50;
const t = 8;
const g = 2;

const horizontal = (xa: number, xb: number, y: number) =>
  `${xa + g},${y} ${xa + g + t / 2},${y - t / 2} ${xb - g - t / 2},${y - t / 2} ${xb - g},${y} ${xb - g - t / 2},${y + t / 2} ${xa + g + t / 2},${y + t / 2}`;
const vertical = (x: number, ya: number, yb: number) =>
  `${x},${ya + g} ${x + t / 2},${ya + g + t / 2} ${x + t / 2},${yb - g - t / 2} ${x},${yb - g} ${x - t / 2},${yb - g - t / 2} ${x - t / 2},${ya + g + t / 2}`;
const diagonal = (xa: number, ya: number, xb: number, yb: number) => {
  const w = t * 0.42;
  return `${xa - w},${ya} ${xa + w},${ya} ${xb + w},${yb} ${xb - w},${yb}`;
};

const inCorner = t * 0.9;
const inCentre = t * 0.8;

const SHAPES: Record<Exclude<Segment, 'dp'>, string> = {
  a: horizontal(x0, x1, y0),
  b: vertical(x1, y0, ym),
  c: vertical(x1, ym, y1),
  d: horizontal(x0, x1, y1),
  e: vertical(x0, ym, y1),
  f: vertical(x0, y0, ym),
  g1: horizontal(x0, xm, ym),
  g2: horizontal(xm, x1, ym),
  h: diagonal(x0 + inCorner, y0 + inCorner, xm - inCentre, ym - inCentre),
  i: vertical(xm, y0, ym),
  j: diagonal(x1 - inCorner, y0 + inCorner, xm + inCentre, ym - inCentre),
  k: diagonal(x0 + inCorner, y1 - inCorner, xm - inCentre, ym + inCentre),
  l: vertical(xm, ym, y1),
  m: diagonal(x1 - inCorner, y1 - inCorner, xm + inCentre, ym + inCentre),
};

/* A digit-only display has a single middle bar and no diagonals. */
const SEVEN: Record<string, string> = {
  a: SHAPES.a,
  b: SHAPES.b,
  c: SHAPES.c,
  d: SHAPES.d,
  e: SHAPES.e,
  f: SHAPES.f,
  g: horizontal(x0, x1, ym),
};

const bitOf = (segment: Segment) => 1 << SEGMENTS.indexOf(segment);
const DP = bitOf('dp');
const G = bitOf('g1') | bitOf('g2');

export type SegmentDisplayProps = {
  text: string;
  /** How many cells the row has. Defaults to the text's length. */
  cells?: number;
  /** `alnum` is the full fourteen-segment cell; `digit` the seven-segment one, with a narrow colon cell. */
  kind?: 'alnum' | 'digit';
  className?: string;
};

/** A row of segmented characters. Purely visual: the text itself is read from elsewhere. */
export function SegmentDisplay({ text, cells = text.length, kind = 'alnum', className = '' }: SegmentDisplayProps) {
  const chars = [...text.padEnd(cells)].slice(0, cells);
  let x = 0;
  const glyphs = chars.map((char, index) => {
    const at = x;
    if (kind === 'digit' && char === ':') {
      x += COLON_WIDTH;
      return (
        <g key={index} className="segment-cell segment-cell--colon" transform={`translate(${at} 0)`}>
          <circle className="segment segment--colon" data-lit="" cx={COLON_WIDTH / 2} cy={ym - 15} r={t / 2 + 0.5} />
          <circle className="segment segment--colon" data-lit="" cx={COLON_WIDTH / 2} cy={ym + 15} r={t / 2 + 0.5} />
        </g>
      );
    }
    x += CELL_WIDTH;
    const mask = encode(char);
    const shapes: [string, boolean][] =
      kind === 'digit'
        ? Object.entries(SEVEN).map(([name, points]) => [points, name === 'g' ? (mask & G) !== 0 : (mask & bitOf(name as Segment)) !== 0])
        : (Object.entries(SHAPES) as [Exclude<Segment, 'dp'>, string][]).map(([name, points]) => [points, (mask & bitOf(name)) !== 0]);
    return (
      <g key={index} className="segment-cell" transform={`translate(${at} 0)`}>
        {shapes.map(([points, lit], i) => (
          <polygon key={i} className="segment" data-lit={lit ? '' : undefined} points={points} />
        ))}
        <circle className="segment" data-lit={mask & DP ? '' : undefined} cx={x1 + 8} cy={y1} r={t / 2 + 0.5} />
      </g>
    );
  });
  const width = x + LEAN;
  return (
    <svg className={`segment-display ${className}`} viewBox={`0 0 ${width} ${CELL_HEIGHT}`} aria-hidden="true" focusable="false">
      <g transform={`translate(${LEAN} 0) skewX(${-SLANT})`}>{glyphs}</g>
    </svg>
  );
}

/** Which of the outline segments a digit display draws, for tests and docs. */
export const DIGIT_OUTLINE = OUTLINE;
