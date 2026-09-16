import type React from 'react';
import { useId } from 'react';
import './DeskLamp.css';

export const DESK_LAMP_ENAMELS = ['red', 'mustard', 'green', 'black'] as const;
export type DeskLampEnamel = (typeof DESK_LAMP_ENAMELS)[number];

/** Where the shade's centre is in the lamp's box, and its radius, in 720ths of the box's width. */
export const DESK_LAMP_SHADE = { x: 200, y: 420, radius: 130 } as const;

export type DeskLampProps = {
  /** Whether it is switched on. Clicking the shade switches it. */
  on?: boolean;
  onToggle?: (on: boolean) => void;
  /** The shade's enamel. */
  enamel?: DeskLampEnamel;
  /** Tilt in degrees. */
  rotation?: number;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * An articulated desk lamp seen from above: the weighted base at one end,
 * the arm reaching across on its elbow, and the enamelled shade at the other
 * end, a good way above the desk, so its shadow falls long and soft. On, the
 * light spills round the rim of the shade; the pool it throws on the desk is
 * drawn separately, by `LampLight`, beneath whatever lies in it. The shade is
 * the switch. Measured in 720ths of the box, which is 480 by 400 mm.
 */
export function DeskLamp({ on = true, onToggle, enamel = 'red', rotation = 0, className = '', style }: DeskLampProps) {
  const id = `lamp-${useId().replace(/:/g, '')}`;
  const { x, y, radius } = DESK_LAMP_SHADE;
  return (
    <div className={`desk-lamp ${className}`} data-on={on ? '' : undefined} data-enamel={enamel} style={{ '--desk-lamp-rotation': `${rotation}deg`, ...style } as React.CSSProperties}>
      <svg viewBox="0 0 720 600" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id={`${id}-shade`} cx="0.38" cy="0.32" r="0.72">
            <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
            <stop offset="0.4" stopColor="#fff" stopOpacity="0.06" />
            <stop offset="1" stopColor="#000" stopOpacity="0.4" />
          </radialGradient>
          <linearGradient id={`${id}-arm`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f2f3f5" />
            <stop offset="0.5" stopColor="#a6aab2" />
            <stop offset="1" stopColor="#4d5057" />
          </linearGradient>
          <radialGradient id={`${id}-base`} cx="0.4" cy="0.35" r="0.7">
            <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
            <stop offset="0.6" stopColor="#fff" stopOpacity="0.02" />
            <stop offset="1" stopColor="#000" stopOpacity="0.5" />
          </radialGradient>
          <filter id={`${id}-soft`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <filter id={`${id}-glow`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="22" />
          </filter>
        </defs>

        {/* Shadows, long and soft: the shade and the arm are high above the desk. */}
        <g className="desk-lamp__shadow" filter={`url(#${id}-soft)`}>
          <circle cx={x + 80} cy={y + 110} r={radius} />
          <path d={`M ${x + 120} ${y + 60} L 500 330 L 680 210`} fill="none" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="640" cy="150" r="112" />
        </g>

        {/* The base, and the arm on its elbow. */}
        <g className="desk-lamp__base">
          <circle cx="600" cy="110" r="110" />
          <circle cx="600" cy="110" r="110" fill={`url(#${id}-base)`} />
          <circle cx="600" cy="110" r="30" fill={`url(#${id}-arm)`} />
        </g>
        <g className="desk-lamp__arm">
          <path d="M 600 110 L 420 250" stroke={`url(#${id}-arm)`} strokeWidth="24" strokeLinecap="round" />
          <circle cx="420" cy="250" r="20" fill={`url(#${id}-arm)`} />
          <path d={`M 420 250 L ${x + 60} ${y - 40}`} stroke={`url(#${id}-arm)`} strokeWidth="22" strokeLinecap="round" />
          <circle cx={x + 60} cy={y - 40} r="17" fill={`url(#${id}-arm)`} />
        </g>

        {/* The light spilling round the rim, and the shade over it. */}
        <circle className="desk-lamp__spill" cx={x} cy={y} r={radius + 30} filter={`url(#${id}-glow)`} />
        <g className="desk-lamp__shade">
          <circle cx={x} cy={y} r={radius} />
          <circle cx={x} cy={y} r={radius} fill={`url(#${id}-shade)`} />
          <circle className="desk-lamp__rim" cx={x} cy={y} r={radius - 4} fill="none" strokeWidth="4" />
          <circle className="desk-lamp__cap" cx={x} cy={y} r="22" fill={`url(#${id}-arm)`} />
        </g>
      </svg>
      <button type="button" className="desk-lamp__switch" aria-label={on ? 'Turn the lamp off' : 'Turn the lamp on'} aria-pressed={on} onClick={() => onToggle?.(!on)} style={{ left: `${((x - radius) / 720) * 100}%`, top: `${((y - radius) / 600) * 100}%`, width: `${((2 * radius) / 720) * 100}%`, height: `${((2 * radius) / 600) * 100}%` }} />
    </div>
  );
}

export type LampLightProps = {
  on?: boolean;
  /** Warmth of the light: any CSS colour. */
  color?: string;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * The pool a lamp throws on the desk: a warm ellipse, brightest at the
 * centre, that fades into the room's light. Laid on the desk beneath what
 * lies in it, and again over everything at a whisper, so the papers in it
 * are lit too. Sized by its parent.
 */
export function LampLight({ on = true, color = '#ffd9a0', className = '', style }: LampLightProps) {
  return <div className={`lamp-light ${className}`} data-on={on ? '' : undefined} style={{ '--lamp-light-color': color, ...style } as React.CSSProperties} aria-hidden="true" />;
}
