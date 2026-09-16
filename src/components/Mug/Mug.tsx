import type React from 'react';
import { useId } from 'react';
import './Mug.css';

export type MugProps = {
  /** The glaze: any CSS colour. */
  glaze?: string;
  /** How full it is, 0 to 1. Empty shows the bottom of the mug and what dried on it. */
  coffee?: number;
  /** Which way the handle points, in degrees clockwise from the right. */
  rotation?: number;
  /** What is drunk from it: the colour of the surface. */
  drink?: string;
  className?: string;
  style?: React.CSSProperties;
};

const clamp = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

/**
 * A coffee mug seen straight down: the thick rim of the glaze, the inside wall
 * shading away from the window, the surface of the drink with the window's
 * reflection and a few bubbles gathered at the edge, and the handle sticking
 * out. It stands on the desk so it casts a real shadow. Sized by its parent.
 */
export function Mug({ glaze = '#e8dfcc', coffee = 0.7, rotation = 30, drink = '#3a2113', className = '', style }: MugProps) {
  const id = `mug-${useId().replace(/:/g, '')}`;
  const level = clamp(coffee);
  /* The surface sinks a little as it empties: seen from above it is nearer the bottom, so a shade smaller. */
  const surface = 54 - (1 - level) * 5;
  return (
    <div className={`mug ${className}`} style={{ '--mug-rotation': `${rotation}deg`, '--mug-glaze': glaze, '--mug-drink': drink, ...style } as React.CSSProperties}>
      <svg className="mug__art" viewBox="0 0 240 240" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id={`${id}-glaze`} cx="0.36" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="0.45" stopColor="#fff" stopOpacity="0.08" />
            <stop offset="1" stopColor="#000" stopOpacity="0.22" />
          </radialGradient>
          <radialGradient id={`${id}-wall`} cx="0.62" cy="0.68" r="0.62">
            <stop offset="0" stopColor="#000" stopOpacity="0.02" />
            <stop offset="0.72" stopColor="#000" stopOpacity="0.2" />
            <stop offset="1" stopColor="#000" stopOpacity="0.55" />
          </radialGradient>
          <radialGradient id={`${id}-drink`} cx="0.42" cy="0.38" r="0.7">
            <stop offset="0" stopColor="#fff" stopOpacity="0.18" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.45" />
          </radialGradient>
          <linearGradient id={`${id}-handle`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
            <stop offset="1" stopColor="#000" stopOpacity="0.3" />
          </linearGradient>
          <filter id={`${id}-shadow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
          <clipPath id={`${id}-bowl`}>
            <circle cx="104" cy="120" r={surface} />
          </clipPath>
        </defs>

        {/* The shadow the mug throws down and to the right, handle and all. */}
        <g className="mug__shadow" filter={`url(#${id}-shadow)`} transform="translate(12 16)">
          <circle cx="104" cy="120" r="70" />
          <path d="M162 84 C 214 74 214 166 162 156" fill="none" strokeWidth="20" strokeLinecap="round" />
        </g>

        {/* The handle: a loop of glaze, lit along its outer edge. */}
        <g className="mug__handle">
          <path d="M160 84 C 214 74 214 166 160 156" fill="none" strokeWidth="21" strokeLinecap="round" />
          <path d="M160 84 C 214 74 214 166 160 156" fill="none" stroke={`url(#${id}-handle)`} strokeWidth="21" strokeLinecap="round" />
          <path d="M160 84 C 214 74 214 166 160 156" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="5" strokeLinecap="round" transform="translate(-2 -3)" />
        </g>

        {/* The rim of the glaze, then the inside wall, then the drink. */}
        <circle className="mug__body" cx="104" cy="120" r="70" />
        <circle cx="104" cy="120" r="70" fill={`url(#${id}-glaze)`} />
        <circle className="mug__rim" cx="104" cy="120" r="66.5" fill="none" strokeWidth="1.2" />
        <circle className="mug__inside" cx="104" cy="120" r="61" />
        <circle cx="104" cy="120" r="61" fill={`url(#${id}-wall)`} />

        {level > 0.02 ? (
          <g clipPath={`url(#${id}-bowl)`}>
            <circle className="mug__drink" cx="104" cy="120" r={surface} />
            <circle cx="104" cy="120" r={surface} fill={`url(#${id}-drink)`} />
            {/* The window in the drink. */}
            <rect className="mug__window" x="66" y="78" width="30" height="18" rx="4" transform="rotate(-28 81 87)" />
            {/* Bubbles drift to the edge on the far side. */}
            <g className="mug__bubbles">
              <circle cx="139" cy="150" r="4.2" />
              <circle cx="146" cy="142" r="2.6" />
              <circle cx="133" cy="157" r="2.2" />
              <circle cx="148" cy="152" r="1.8" />
              <circle cx="140" cy="160" r="1.4" />
            </g>
          </g>
        ) : (
          <g>
            <circle className="mug__bottom" cx="104" cy="120" r="50" />
            <circle className="mug__dregs" cx="104" cy="120" r="40" fill="none" strokeWidth="5" strokeDasharray="70 9 120 14 40 6" />
          </g>
        )}

        {/* The lip catches the light on the near side. */}
        <path className="mug__glint" d="M52 92 A 62 62 0 0 1 96 54" fill="none" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}
