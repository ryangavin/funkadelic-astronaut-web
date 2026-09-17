import type React from 'react';
import { useId } from 'react';
import './DeskLamp.css';
import { projectElevation } from '../../../behaviors/Perspective/elevation';
import { DEFAULT_SHADOW_STRENGTH, useRegisterDeskLight } from '../../../behaviors/DeskLighting/DeskLighting';

export const DESK_LAMP_ENAMELS = ['red', 'mustard', 'green', 'black'] as const;
export type DeskLampEnamel = (typeof DESK_LAMP_ENAMELS)[number];

/** Where the shade's centre is in the lamp's box, and its radius, in 720ths of the box's width. */
export const DESK_LAMP_SHADE = { x: 200, y: 420, radius: 130 } as const;

export type DeskLampProps = {
  /** Shared camera for physically elevated artwork; requires lightPosition. */
  camera?: Parameters<typeof projectElevation>[3];
  /** Darkness of shadows this light casts on the desk, from 0 (none) to 1 (strongest). */
  shadowStrength?: number;
  /** Opt in to scene lighting: lamp box placement and bulb elevation in desk units. */
  lightPosition?: { x: number; y: number; width: number; height: number };
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
export function DeskLamp({ camera, shadowStrength = DEFAULT_SHADOW_STRENGTH, lightPosition, on = true, onToggle, enamel = 'red', rotation = 0, className = '', style }: DeskLampProps) {
  const id = `lamp-${useId().replace(/:/g, '')}`;
  const { x, y, radius } = DESK_LAMP_SHADE;
  const turn = rotation * Math.PI / 180;
  const dx = (x - 360) / 720;
  const dy = (y - 300) / 720;
  const elevated = !!(camera && lightPosition);
  // Estimated construction heights: base 25 mm, elbow 230 mm, shade 50 mm above the bulb.
  const point = (px: number, py: number, height: number) => {
    if (!camera || !lightPosition) return { x: px, y: py, scale: 1 };
    const unit = lightPosition.width / 720;
    const ox = (px - 360) * unit, oy = (py - 300) * unit;
    const cx = lightPosition.x + 360 * unit, cy = lightPosition.y + 300 * unit;
    const world = projectElevation(cx + ox * Math.cos(turn) - oy * Math.sin(turn), cy + ox * Math.sin(turn) + oy * Math.cos(turn), height, camera);
    return { x: 360 + ((world.x - cx) * Math.cos(turn) + (world.y - cy) * Math.sin(turn)) / unit,
      y: 300 + (-(world.x - cx) * Math.sin(turn) + (world.y - cy) * Math.cos(turn)) / unit, scale: world.scale };
  };
  const bulbHeight = lightPosition?.height ?? 700;
  const base = point(600, 110, 50);
  const elbow = point(420, 250, 460);
  const neck = point(x + 60, y - 40, bulbHeight + 100);
  const shade = point(x, y, bulbHeight + 100);
  const rim = point(x, y, bulbHeight);
  const layer = (p: { x: number; y: number; scale: number }, cx: number, cy: number) => `translate(${p.x} ${p.y}) scale(${p.scale}) translate(${-cx} ${-cy})`;
  useRegisterDeskLight(lightPosition ? {
    x: lightPosition.x + lightPosition.width * (0.5 + dx * Math.cos(turn) - dy * Math.sin(turn)),
    y: lightPosition.y + lightPosition.width * (300 / 720 + dx * Math.sin(turn) + dy * Math.cos(turn)),
    height: lightPosition.height,
    shadowStrength: Number.isFinite(shadowStrength) ? Math.min(1, Math.max(0, shadowStrength)) : DEFAULT_SHADOW_STRENGTH,
    on,
  } : null);
  return (
    <div className={`desk-lamp ${elevated ? 'desk-lamp--elevated' : ''} ${className}`} data-on={on ? '' : undefined} data-enamel={enamel} style={{ '--desk-lamp-rotation': `${rotation}deg`, ...style } as React.CSSProperties}>
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
        <g className="desk-lamp__base" transform={layer(base, 600, 110)}>
          <circle cx="600" cy="110" r="110" />
          <circle cx="600" cy="110" r="110" fill={`url(#${id}-base)`} />
          <circle cx="600" cy="110" r="30" fill={`url(#${id}-arm)`} />
        </g>
        <g className="desk-lamp__arm">
          <path d={`M ${base.x} ${base.y} L ${elbow.x} ${elbow.y}`} stroke={`url(#${id}-arm)`} strokeWidth="24" strokeLinecap="round" />
          <circle cx={elbow.x} cy={elbow.y} r={20 * elbow.scale} fill={`url(#${id}-arm)`} />
          <path d={`M ${elbow.x} ${elbow.y} L ${neck.x} ${neck.y}`} stroke={`url(#${id}-arm)`} strokeWidth="22" strokeLinecap="round" />
          <circle cx={neck.x} cy={neck.y} r={17 * neck.scale} fill={`url(#${id}-arm)`} />
        </g>

        {/* The light spilling round the rim, and the shade over it. */}
        <g transform={layer(rim, x, y)}>
        <circle className="desk-lamp__spill" cx={x} cy={y} r={radius + 30} filter={`url(#${id}-glow)`} />
        </g>
        {elevated && <g className="desk-lamp__side">
          <circle cx={rim.x} cy={rim.y} r={radius * rim.scale} />
          <path d={`M ${rim.x - radius * rim.scale} ${rim.y} L ${shade.x - radius * shade.scale} ${shade.y} L ${shade.x + radius * shade.scale} ${shade.y} L ${rim.x + radius * rim.scale} ${rim.y} Z`} />
        </g>}
        <g className="desk-lamp__shade" transform={layer(shade, x, y)}>
          <circle cx={x} cy={y} r={radius} />
          <circle cx={x} cy={y} r={radius} fill={`url(#${id}-shade)`} />
          <circle className="desk-lamp__rim" cx={x} cy={y} r={radius - 4} fill="none" strokeWidth="4" />
          <circle className="desk-lamp__cap" cx={x} cy={y} r="22" fill={`url(#${id}-arm)`} />
        </g>
      </svg>
      <button type="button" className="desk-lamp__switch" aria-label={on ? 'Turn the lamp off' : 'Turn the lamp on'} aria-pressed={on} onClick={() => onToggle?.(!on)} style={{ left: `${((shade.x - radius * shade.scale) / 720) * 100}%`, top: `${((shade.y - radius * shade.scale) / 600) * 100}%`, width: `${((2 * radius * shade.scale) / 720) * 100}%`, height: `${((2 * radius * shade.scale) / 600) * 100}%` }} />
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
