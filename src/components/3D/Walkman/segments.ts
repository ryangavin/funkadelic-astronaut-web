/*
  A fourteen-segment alphanumeric display, the kind that spelled out track
  names on late-eighties decks. Each glyph is a bitmask over the segments in
  SEGMENTS order: the seven-segment outline first (a to f round the edge, the
  middle bar split into g1 and g2), then the four diagonals and the two
  centre verticals, then the decimal point. Digits use only the outline, so
  the same table drives a plain seven-segment counter.
*/

export const SEGMENTS = ['a', 'b', 'c', 'd', 'e', 'f', 'g1', 'g2', 'h', 'i', 'j', 'k', 'l', 'm', 'dp'] as const;
export type Segment = (typeof SEGMENTS)[number];

const bit = (segment: Segment) => 1 << SEGMENTS.indexOf(segment);
const lit = (...segments: Segment[]) => segments.reduce((mask, segment) => mask | bit(segment), 0);

/** The seven-segment outline, for telling a digit-only display which ghosts to draw. */
export const OUTLINE = lit('a', 'b', 'c', 'd', 'e', 'f', 'g1', 'g2');

export const GLYPHS: Record<string, number> = {
  ' ': 0,
  '0': lit('a', 'b', 'c', 'd', 'e', 'f'),
  '1': lit('b', 'c'),
  '2': lit('a', 'b', 'g1', 'g2', 'e', 'd'),
  '3': lit('a', 'b', 'g1', 'g2', 'c', 'd'),
  '4': lit('f', 'g1', 'g2', 'b', 'c'),
  '5': lit('a', 'f', 'g1', 'g2', 'c', 'd'),
  '6': lit('a', 'f', 'g1', 'g2', 'e', 'd', 'c'),
  '7': lit('a', 'b', 'c'),
  '8': lit('a', 'b', 'c', 'd', 'e', 'f', 'g1', 'g2'),
  '9': lit('a', 'b', 'f', 'g1', 'g2', 'c', 'd'),
  A: lit('a', 'b', 'c', 'e', 'f', 'g1', 'g2'),
  B: lit('a', 'b', 'c', 'd', 'g2', 'i', 'l'),
  C: lit('a', 'd', 'e', 'f'),
  D: lit('a', 'b', 'c', 'd', 'i', 'l'),
  E: lit('a', 'd', 'e', 'f', 'g1'),
  F: lit('a', 'e', 'f', 'g1'),
  G: lit('a', 'c', 'd', 'e', 'f', 'g2'),
  H: lit('b', 'c', 'e', 'f', 'g1', 'g2'),
  I: lit('a', 'd', 'i', 'l'),
  J: lit('b', 'c', 'd', 'e'),
  K: lit('e', 'f', 'g1', 'j', 'm'),
  L: lit('d', 'e', 'f'),
  M: lit('b', 'c', 'e', 'f', 'h', 'j'),
  N: lit('b', 'c', 'e', 'f', 'h', 'm'),
  O: lit('a', 'b', 'c', 'd', 'e', 'f'),
  P: lit('a', 'b', 'e', 'f', 'g1', 'g2'),
  Q: lit('a', 'b', 'c', 'd', 'e', 'f', 'm'),
  R: lit('a', 'b', 'e', 'f', 'g1', 'g2', 'm'),
  S: lit('a', 'f', 'g1', 'g2', 'c', 'd'),
  T: lit('a', 'i', 'l'),
  U: lit('b', 'c', 'd', 'e', 'f'),
  V: lit('e', 'f', 'j', 'k'),
  W: lit('b', 'c', 'e', 'f', 'k', 'm'),
  X: lit('h', 'j', 'k', 'm'),
  Y: lit('h', 'j', 'l'),
  Z: lit('a', 'd', 'j', 'k'),
  '-': lit('g1', 'g2'),
  '+': lit('g1', 'g2', 'i', 'l'),
  '*': lit('g1', 'g2', 'h', 'i', 'j', 'k', 'l', 'm'),
  '/': lit('j', 'k'),
  '\\': lit('h', 'm'),
  '(': lit('j', 'm'),
  ')': lit('h', 'k'),
  '<': lit('j', 'm'),
  '>': lit('h', 'k'),
  "'": lit('i'),
  '"': lit('i', 'j'),
  '.': lit('dp'),
  ',': lit('k'),
  ':': lit('i', 'l'),
  _: lit('d'),
  '=': lit('g1', 'g2', 'd'),
  '?': lit('a', 'b', 'g2', 'l'),
  '!': lit('b', 'c', 'dp'),
  '&': lit('a', 'c', 'd', 'e', 'f', 'g1', 'g2'),
  '@': lit('a', 'b', 'd', 'e', 'f', 'g2', 'i'),
  '%': lit('f', 'c', 'j', 'k'),
  '$': lit('a', 'f', 'g1', 'g2', 'c', 'd', 'i', 'l'),
  '[': lit('a', 'd', 'e', 'f'),
  ']': lit('a', 'b', 'c', 'd'),
  '|': lit('i', 'l'),
  '#': lit('b', 'c', 'e', 'f', 'g1', 'g2', 'd'),
};

/** Dashes of every kind read as the display's own dash; smart quotes as its quote. */
const LOOKALIKES: Record<string, string> = {
  '–': '-',
  '—': '-',
  '−': '-',
  '‘': "'",
  '’': "'",
  '“': '"',
  '”': '"',
  '…': '.',
  '·': '.',
  '•': '.',
  '×': 'X',
};

/** What the display can show for a character: upper case, diacritics stripped, blank if it has no glyph. */
export function normalise(char: string): string {
  const plain = (LOOKALIKES[char] ?? char).normalize('NFD').replace(/\p{M}/gu, '').toUpperCase();
  return plain in GLYPHS ? plain : ' ';
}

/** The segment mask for one character. */
export const encode = (char: string): number => GLYPHS[normalise(char)] ?? 0;

/** Which segments a mask lights. */
export const litSegments = (mask: number): Segment[] => SEGMENTS.filter((segment) => mask & bit(segment));

/** Blank cells between the end of a scrolling title and its start coming round again. */
export const SCROLL_GAP = 3;

/** How many steps a title takes to scroll all the way round; 0 when it fits. */
export const scrollLength = (text: string, cells: number): number => (text.length > cells ? text.length + SCROLL_GAP : 0);

/**
 * The characters showing in a row of `cells`, `offset` steps into the scroll.
 * Text that fits sits left-aligned and never moves; longer text wraps round with
 * a gap, and the offset is taken modulo the loop.
 */
export function window(text: string, cells: number, offset = 0): string[] {
  const length = scrollLength(text, cells);
  if (length === 0) return [...text.padEnd(cells)];
  const loop = text + ' '.repeat(SCROLL_GAP);
  const start = ((offset % length) + length) % length;
  return Array.from({ length: cells }, (_, cell) => loop[(start + cell) % length]);
}

/** Seconds as a tape counter: `MM:SS`, or dashes when there is nothing to count. */
export function counter(seconds: number | undefined): string {
  if (seconds === undefined || !Number.isFinite(seconds)) return '--:--';
  const whole = Math.max(0, Math.floor(seconds));
  const minutes = Math.min(99, Math.floor(whole / 60));
  return `${String(minutes).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`;
}

/** A file's own name as a title, when nothing better was written on the tape. */
export function titleFrom(src: string): string {
  const name = decodeURIComponent(src.split(/[?#]/)[0].split('/').pop() ?? '');
  return name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').trim() || 'TAPE';
}
