import { useId } from 'react';

/*
  A compact cassette, drawn to the real proportions: a 100 x 63.5 mm shell as
  400 x 254. The label covers the face but for one wide window that spans
  both hubs, 43 mm apart, so the tape packs show: as the track plays the
  pack on the left shrinks and the one on the right grows. The hubs spin
  whenever the transport moves.
*/

export const CASSETTE_BOX = [400, 254] as const;

const LEFT = 114;
const RIGHT = 286;
const AXIS = 118;
const HUB = 21;
const PACK_MIN = 30;
const PACK_MAX = 90;
/** The window in the label and shell: x, y, width, height. */
export const CASSETTE_WINDOW = [72, 84, 256, 68] as const;

export type CassetteProps = {
  /** Handwriting on the label. */
  label?: string;
  /** The side that is up. */
  side?: 'A' | 'B';
  /** How far through the tape, 0 to 1. Moves tape from the left reel to the right. */
  progress?: number;
  className?: string;
};

const clamp = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

/* The spinning group carries no attribute transform of its own: the CSS rotation would replace it. */
function Hub({ cx }: { cx: number }) {
  const teeth = Array.from({ length: 6 }, (_, i) => i * 60);
  return (
    <g transform={`translate(${cx} ${AXIS})`}>
      <g className="cassette__hub">
        <circle className="cassette__hub-ring" r={HUB} />
        {teeth.map((angle) => (
          <rect key={angle} className="cassette__tooth" x={-2.8} y={-HUB + 1} width={5.6} height={8} rx={1} transform={`rotate(${angle})`} />
        ))}
        <circle className="cassette__hub-eye" r={HUB * 0.4} />
      </g>
    </g>
  );
}

export function Cassette({ label = '', side = 'A', progress = 0, className = '' }: CassetteProps) {
  const clip = useId();
  const p = clamp(progress);
  const leftPack = PACK_MIN + (PACK_MAX - PACK_MIN) * (1 - p);
  const rightPack = PACK_MIN + (PACK_MAX - PACK_MIN) * p;
  const [wx, wy, ww, wh] = CASSETTE_WINDOW;
  return (
    <svg className={`cassette ${className}`} viewBox={`0 0 ${CASSETTE_BOX[0]} ${CASSETTE_BOX[1]}`} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={clip}>
          <rect x={wx} y={wy} width={ww} height={wh} rx={10} />
        </clipPath>
        {/* Wound tape is glossy black: a soft catch of light off the top left of each pack. */}
        <radialGradient id={`${clip}-pack`} cx="38%" cy="34%" r="70%">
          <stop offset="0" stopColor="#35323a" />
          <stop offset="0.55" stopColor="#1a181d" />
          <stop offset="1" stopColor="#0f0e12" />
        </radialGradient>
      </defs>
      {/* Shell */}
      <rect className="cassette__shell" x={2} y={2} width={396} height={250} rx={9} />
      <rect className="cassette__shell-sheen" x={2} y={2} width={396} height={250} rx={9} />
      {/* Label */}
      <rect className="cassette__label" x={22} y={14} width={356} height={182} rx={5} />
      <rect className="cassette__label-band" x={22} y={14} width={356} height={26} rx={5} />
      <rect className="cassette__label-band" x={22} y={28} width={356} height={12} />
      <text className="cassette__label-print" x={34} y={31}>
        STEREO · C60
      </text>
      <text className="cassette__label-print" x={366} y={31} textAnchor="end">
        NORMAL BIAS · EQ 120µs
      </text>
      <line className="cassette__label-rule" x1={34} y1={70} x2={366} y2={70} />
      <text className="cassette__label-hand" x={38} y={66}>
        {label}
      </text>
      <text className="cassette__label-side" x={47} y={134} textAnchor="middle">
        {side}
      </text>
      <path className="cassette__label-arrow" d="M338 118 h26 m-9 -9 l9 9 l-9 9" />
      <line className="cassette__label-rule" x1={34} y1={180} x2={366} y2={180} />
      <text className="cassette__label-print" x={34} y={176}>
        NR ☐ ON ☐ OFF
      </text>
      <text className="cassette__label-print" x={366} y={176} textAnchor="end">
        60 MIN
      </text>
      {/* The inside, seen through the window: the packs, the tape between them, the hubs. */}
      <g clipPath={`url(#${clip})`}>
        <rect className="cassette__inside" x={0} y={0} width={400} height={254} />
        <circle className="cassette__pack" cx={LEFT} cy={AXIS} r={leftPack} fill={`url(#${clip}-pack)`} />
        <circle className="cassette__pack" cx={RIGHT} cy={AXIS} r={rightPack} fill={`url(#${clip}-pack)`} />
        <line className="cassette__tape" x1={LEFT} y1={AXIS + leftPack} x2={RIGHT} y2={AXIS + rightPack} />
        <Hub cx={LEFT} />
        <Hub cx={RIGHT} />
      </g>
      <rect className="cassette__hole-rim" x={wx} y={wy} width={ww} height={wh} rx={10} />
      {/* Bottom edge: guide holes, capstan holes and the head opening */}
      <rect className="cassette__hole" x={52} y={210} width={14} height={14} rx={2} />
      <rect className="cassette__hole" x={334} y={210} width={14} height={14} rx={2} />
      <circle className="cassette__hole" cx={108} cy={224} r={6} />
      <circle className="cassette__hole" cx={292} cy={224} r={6} />
      <rect className="cassette__hole" x={158} y={206} width={84} height={32} rx={3} />
      <rect className="cassette__pad" x={188} y={228} width={24} height={6} rx={1} />
      {/* Screws */}
      {[
        [14, 14],
        [386, 14],
        [14, 240],
        [386, 240],
        [200, 244],
      ].map(([cx, cy]) => (
        <g key={`${cx}-${cy}`} className="cassette__screw" transform={`translate(${cx} ${cy})`}>
          <circle r={4.5} />
          <path d="M-2.6 0 H2.6 M0 -2.6 V2.6" />
        </g>
      ))}
    </svg>
  );
}
