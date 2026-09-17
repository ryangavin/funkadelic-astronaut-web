import type React from 'react';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { PrintInkFilter } from '../../../foundations/Distressed/Distressed';
import './Ribbon.css';

/** The site's fountain-pen inks, as the ribbon's outer band. */
export const RIBBON_COLORS = {
  purple: '#9275b2',
  amber: '#c58930',
  red: '#a52837',
  green: '#228542',
  blue: '#639ec8',
  black: '#121420',
} as const;
export type RibbonColor = keyof typeof RIBBON_COLORS;
export const RIBBON_COLOR_NAMES = Object.keys(RIBBON_COLORS) as RibbonColor[];

export type RibbonWave = {
  /** Complete waves across the width. */
  frequency: number;
  /** Wave depth, as a percentage of the band height. */
  amplitude: number;
  /** Tilt of the whole wave, in degrees. */
  rotation: number;
  /** Horizontal phase shift, as a percentage of the width. */
  x: number;
  /** Vertical shift, as a percentage of the band height. */
  y: number;
};

/** The wave under the home page footer. */
export const FOOTER_RIBBON_WAVE: RibbonWave = { frequency: 1.3, amplitude: 15, rotation: 0, x: 0, y: -8 };
export const FOOTER_RIBBON_HEIGHT = 64;

const PAPER = '#ead3a7';
const INK = '#121420';
/** Stroke widths at the 1090px reference width: outer colour, paper, ink. */
const STROKES = [44, 26, 14];
const PHASE = 0.1;

/**
 * The seam's centreline as an SVG path in pixel units, bleeding past both
 * edges so the strokes and the worn-ink displacement never show an end.
 */
export function ribbonPath({ frequency, amplitude, rotation, x, y }: RibbonWave, width: number, height: number) {
  width = Math.max(1, width);
  const omega = 2 * Math.PI * frequency;
  const tilt = Math.tan((rotation * Math.PI) / 180);
  const shift = PHASE + x / 100;
  const at = (px: number) =>
    height * (0.5 + y / 100 + (amplitude / 100) * Math.cos(omega * (px / width - shift))) + tilt * (px - width / 2);
  const slope = (px: number) =>
    (-height / width) * (amplitude / 100) * omega * Math.sin(omega * (px / width - shift)) + tilt;
  const point = (px: number, py: number) => `${px.toFixed(3)} ${py.toFixed(3)}`;
  const count = Math.max(8, Math.ceil(frequency * 8));
  const bleed = Math.max(32, width * 0.05);
  const start = -bleed;
  const span = width + 2 * bleed;
  let d = `M ${point(start, at(start))}`;
  for (let i = 0; i < count; i++) {
    const from = start + (i * span) / count;
    const to = start + ((i + 1) * span) / count;
    const third = (to - from) / 3;
    d += ` C ${point(from + third, at(from) + slope(from) * third)} ${point(to - third, at(to) - slope(to) * third)} ${point(to, at(to))}`;
  }
  return d;
}

export type RibbonProps = Partial<RibbonWave> & {
  /** Ink of the outer band. The footer's is purple. Any CSS colour also works. */
  color?: RibbonColor | (string & {});
  /** Height of the wave band in pixels. The footer uses 64. */
  height?: number;
  /** Fill below the wave. The footer sits on ink; use `transparent` for the seam alone. */
  background?: string;
  /** Worn-ink finish on the strokes. */
  worn?: boolean;
  /** Whatever sits on the block, laid out below the band. */
  children?: React.ReactNode;
};

/**
 * A block whose top edge is one of the site's ribbons: a wavy seam of colour,
 * paper and ink, with the block's own background cut along the same wave so
 * whatever sits above shows through the crests.
 */
export function Ribbon({
  color = 'purple',
  height = FOOTER_RIBBON_HEIGHT,
  frequency = FOOTER_RIBBON_WAVE.frequency,
  amplitude = FOOTER_RIBBON_WAVE.amplitude,
  rotation = FOOTER_RIBBON_WAVE.rotation,
  x = FOOTER_RIBBON_WAVE.x,
  y = FOOTER_RIBBON_WAVE.y,
  background = INK,
  worn = true,
  children,
}: RibbonProps) {
  const filterId = `ribbon-ink-${useId().replace(/:/g, '')}`;
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 1440, height });

  useLayoutEffect(() => {
    const host = ref.current;
    if (!host) return;
    const measure = () =>
      setSize((previous) => {
        // A block that is hidden or not yet laid out measures 0 wide; keep the last real size.
        if (!host.clientWidth) return previous;
        const next = { width: host.clientWidth, height: host.clientHeight };
        return previous.width === next.width && previous.height === next.height ? previous : next;
      });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const { width } = size;
  const wave = ribbonPath({ frequency, amplitude, rotation, x, y }, width, height);
  const ink = color in RIBBON_COLORS ? RIBBON_COLORS[color as RibbonColor] : color;
  const strokes = [ink, PAPER, INK];

  return (
    <div
      ref={ref}
      className="ribbon"
      style={
        {
          '--ribbon-height': `${height}px`,
          '--ribbon-background': background,
          clipPath: `path('${wave} L ${width} ${size.height} L 0 ${size.height} Z')`,
        } as React.CSSProperties
      }
    >
      {/* The filter goes on the whole seam, as on the site: its region then covers
          the band rather than the centreline's bounding box, which would crop the strokes. */}
      <svg
        className="ribbon__seam"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
        style={worn ? { filter: `url(#${filterId})` } : undefined}
      >
        <defs>{worn ? <PrintInkFilter id={filterId} /> : null}</defs>
        {strokes.map((stroke, index) => (
          <path key={index} d={wave} fill="none" stroke={stroke} strokeWidth={(STROKES[index] * width) / 1090} />
        ))}
      </svg>
      <div className="ribbon__content">{children}</div>
    </div>
  );
}
