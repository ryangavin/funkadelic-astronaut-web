import type React from 'react';
import { useId } from 'react';
import './Mug.css';

export type MugProps = {
  /** Optional contact grounding; directional cast shadows belong to the scene light. */
  shadow?: 'none' | 'contact';
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

/** How tall a mug is, as a multiple of the width of its drawing: 95 mm against 140. */
export const MUG_HEIGHT = 95 / 140;
/** 140 mm across the drawing, at two desk units per millimetre. */
export const MUG_WIDTH = 280;
/** Where it stands within that drawing: the middle of its base, which is off to the left to leave room for the handle. */
export const MUG_FOOT = { x: 104 / 240, y: 120 / 240 };

const clamp = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

/**
 * A coffee mug seen straight down: the thick rim of the glaze, the inside wall
 * shading away from the window, the surface of the drink with the window's
 * reflection and a few bubbles gathered at the edge, and the handle sticking
 * out. Cast shadows are supplied by the scene light. Sized by its parent.
 *
 * It is 95 mm tall, and on a surface seen at an angle that height is worth
 * something. Stand it in a `Solid` of {@link MUG_HEIGHT} and the rim and the
 * handle rise off the desk and lean away from the eye, the side slides out
 * from under them, and the base stays where the mug is standing. Without one,
 * or seen from straight above, all of that is worth nothing and the drawing is
 * exactly what it always was.
 */
export function Mug({ shadow = 'none', glaze = '#e8dfcc', coffee = 0.7, rotation = 30, drink = '#3a2113', className = '', style }: MugProps) {
  const id = `mug-${useId().replace(/:/g, '')}`;
  const level = clamp(coffee);
  /* The surface sinks a little as it empties: seen from above it is nearer the bottom, so a shade smaller. */
  const surface = 54 - (1 - level) * 5;
  return (
    <div className={`mug ${shadow === 'contact' ? 'mug--contact' : ''} ${className}`} style={{ '--mug-rotation': `${rotation}deg`, '--mug-glaze': glaze, '--mug-drink': drink, ...style } as React.CSSProperties}>
      <svg className="mug__art" viewBox="0 0 240 240" aria-hidden="true" focusable="false">
        <defs>
          {/* A sheen on the glaze from the window. It only lifts: what shades the glaze is the cylinder it is part of. */}
          <radialGradient id={`${id}-glaze`} cx="0.36" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#fff" stopOpacity="0.3" />
            <stop offset="0.45" stopColor="#fff" stopOpacity="0.05" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
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
          {/* A cylinder under the window: bright a third of the way across, dark round both edges.
              In user space, so the wall and the base below it are lit as one piece. */}
          <linearGradient id={`${id}-side`} gradientUnits="userSpaceOnUse" x1="34" y1="0" x2="174" y2="0">
            <stop offset="0" stopColor="#000" stopOpacity="0.45" />
            <stop offset="0.14" stopColor="#000" stopOpacity="0.1" />
            <stop offset="0.3" stopColor="#fff" stopOpacity="0.26" />
            <stop offset="0.46" stopColor="#fff" stopOpacity="0.1" />
            <stop offset="0.7" stopColor="#000" stopOpacity="0.16" />
            <stop offset="1" stopColor="#000" stopOpacity="0.55" />
          </linearGradient>
          {/* Down the side, drawn where the side is drawn: the shade under the lip where the rim
              overhangs and the light down the middle. Fade to clear where the rectangle
              meets the base circle; the under gradient continues the shading from that join. */}
          <linearGradient id={`${id}-outer-wall`} gradientUnits="userSpaceOnUse" x1="0" y1="-43" x2="0" y2="120">
            <stop offset="0" stopColor="#000" stopOpacity="0.38" />
            <stop offset="0.07" stopColor="#000" stopOpacity="0.1" />
            <stop offset="0.16" stopColor="#fff" stopOpacity="0.07" />
            <stop offset="0.62" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </linearGradient>
          {/* The bottom of the mug turning away from the light, and the desk close under it. */}
          <linearGradient id={`${id}-under`} gradientUnits="userSpaceOnUse" x1="0" y1="120" x2="0" y2="184">
            <stop offset="0" stopColor="#000" stopOpacity="0" />
            <stop offset="0.55" stopColor="#000" stopOpacity="0.14" />
            <stop offset="1" stopColor="#000" stopOpacity="0.46" />
          </linearGradient>
          <filter id={`${id}-shadow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
          <clipPath id={`${id}-bowl`}>
            <circle cx="104" cy="120" r={surface} />
          </clipPath>
        </defs>

        {shadow === 'contact' && <circle className="mug__contact" cx="104" cy="122" r="71" fill="#140c06" opacity="0.28" filter={`url(#${id}-shadow)`} />}

        {/* The side of the mug: a second layer, drawn straight on at the shape it really is — 140 across
            at the rim, tapering to 124 at the base it stands on, and 163 tall. Seen from straight above it
            has no height at all and is hidden under the rim; as the view comes down it slides out from
            under it, stretched into the gap and leaning with it, which is one transform and so carries its
            shading through whole. The base is the footprint and does not move: it is where the mug stands,
            and being narrower than the rim is what keeps the mug from reading as a tumbler. */}
        <g className="mug__side">
          <circle className="mug__base" cx="104" cy="120" r="62" />
          <circle cx="104" cy="120" r="62" fill={`url(#${id}-side)`} />
          <circle cx="104" cy="120" r="62" fill={`url(#${id}-under)`} />
          <g className="mug__wall">
            <path className="mug__wall-glaze" d="M34 -43 H174 L166 120 H42 Z" />
            <path d="M34 -43 H174 L166 120 H42 Z" fill={`url(#${id}-side)`} />
            <path d="M34 -43 H174 L166 120 H42 Z" fill={`url(#${id}-outer-wall)`} />
          </g>
        </g>

        <g className="mug__top">
        {/* The handle: a loop of glaze, lit along its outer edge. */}
        <g className="mug__handle">
          <path d="M160 84 C 214 74 214 166 160 156" fill="none" strokeWidth="21" strokeLinecap="round" />
          <path d="M160 84 C 214 74 214 166 160 156" fill="none" stroke={`url(#${id}-handle)`} strokeWidth="21" strokeLinecap="round" />
          <path d="M160 84 C 214 74 214 166 160 156" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="5" strokeLinecap="round" transform="translate(-2 -3)" />
        </g>

        {/* The rim of the glaze, then the inside wall, then the drink. */}
        {/* The outer glaze is lit as the same cylinder as the wall below it, in the same user space, so
            the rim's own outline does not crease across the side of the mug where the two meet. */}
        <circle className="mug__body" cx="104" cy="120" r="70" />
        <circle cx="104" cy="120" r="70" fill={`url(#${id}-side)`} />
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
        </g>
      </svg>
    </div>
  );
}
