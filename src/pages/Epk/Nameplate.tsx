import type { CSSProperties } from 'react';

/*
  The band's nameplate, drawn: a lowercase geometric alphabet in the spirit of
  Bauhaus 93, only the letters "funkadelic astronaut" needs. Every letter is a
  centre line stroked fat with round ends, on one grid:

  - the stroke is 30 units, so a letter's outer edge sits 15 outside its line;
  - ascenders reach y 0, the x-height is y 50, the baseline y 150;
  - bowls are circles of radius 35 centred on y 100, so they fill the x-height.

  Each glyph's centre lines start 15 in from its left edge, and `width` is its
  outer width, so letters set side by side at a fixed gap.
*/
export const NAMEPLATE_STROKE = 30;
const GAP = 9;
const LINE_HEIGHT = 168;

type Glyph = { width: number; d: string };

const GLYPHS: Record<string, Glyph> = {
  a: { width: 100, d: 'M50 65 A35 35 0 1 0 50 135 A35 35 0 1 0 50 65 M85 65 V135' },
  c: { width: 88, d: 'M72.5 73.2 A35 35 0 1 0 72.5 126.8' },
  d: { width: 100, d: 'M50 65 A35 35 0 1 0 50 135 A35 35 0 1 0 50 65 M85 15 V135' },
  e: { width: 100, d: 'M15 100 H85 A35 35 0 1 0 76.8 122.5' },
  f: { width: 82, d: 'M30 135 V45 A30 30 0 0 1 60 15 H67 M15 65 H60' },
  i: { width: 30, d: 'M15 65 V135 M15 22 V22' },
  k: { width: 88, d: 'M15 15 V135 M70 65 L28 101 L73 135' },
  l: { width: 30, d: 'M15 15 V135' },
  n: { width: 100, d: 'M15 65 V135 M15 100 A35 35 0 0 1 85 100 V135' },
  o: { width: 100, d: 'M50 65 A35 35 0 1 0 50 135 A35 35 0 1 0 50 65' },
  r: { width: 78, d: 'M15 65 V135 M15 100 A35 35 0 0 1 63 67.5' },
  s: { width: 80, d: 'M62 74 A24 17.5 0 1 0 40 100 A24 17.5 0 1 1 18 126' },
  t: { width: 78, d: 'M30 15 V105 A30 30 0 0 0 60 135 H63 M15 65 H60' },
  u: { width: 100, d: 'M15 65 V100 A35 35 0 0 0 85 100 M85 65 V135' },
};

/** Lays a word out: each glyph's left edge, and the word's total width. */
const setWord = (word: string) => {
  let x = 0;
  const glyphs = [...word].map((letter, index) => {
    const glyph = GLYPHS[letter];
    if (!glyph) throw new Error(`The nameplate has no "${letter}"`);
    const at = x;
    x += glyph.width + (index < word.length - 1 ? GAP : 0);
    return { letter, at, d: glyph.d };
  });
  return { glyphs, width: x };
};

export type NameplateProps = {
  /** The words, one per line, lowercase. */
  lines?: string[];
  className?: string;
  style?: CSSProperties;
};

/**
 * The nameplate as artwork that styles like type: the letters are stroked in
 * `currentColor`, with an outline and an offset shadow in `--nameplate-edge`
 * drawn from the same lines underneath, so colour, outline and shadow are all
 * set from CSS. Lines are centred on the widest.
 */
export function Nameplate({ lines = ['funkadelic', 'astronaut'], className = '', style }: NameplateProps) {
  const words = lines.map(setWord);
  const width = Math.max(...words.map(word => word.width));
  const height = LINE_HEIGHT * (lines.length - 1) + 150;
  const letters = words.map((word, line) =>
    word.glyphs.map(glyph => (
      <path
        key={`${line}-${glyph.at}`}
        d={glyph.d}
        transform={`translate(${glyph.at + (width - word.width) / 2} ${line * LINE_HEIGHT})`}
      />
    )),
  );
  // The outline and shadow need room past the outer edges.
  const pad = 12;
  return (
    <svg
      className={`nameplate ${className}`}
      viewBox={`${-pad} ${-pad} ${width + pad * 2} ${height + pad * 2}`}
      role="img"
      aria-label={lines.join(' ')}
      style={style}
    >
      <g className="nameplate__shadow">{letters}</g>
      <g className="nameplate__edge">{letters}</g>
      <g className="nameplate__ink">{letters}</g>
    </svg>
  );
}
