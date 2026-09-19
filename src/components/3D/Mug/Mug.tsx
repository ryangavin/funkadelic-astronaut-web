import { mmToUnits } from '../../../geometry/physicalScale';
import type React from 'react';
import { useId } from 'react';
import { useMugLayer } from './projection';
import { BASE_LAYER, cylinderSide } from '../Wastebasket/cylinder';
import './Mug.css';

export type MugProps = {
  /** Optional contact grounding; directional cast shadows belong to the scene light. */
  shadow?: 'none' | 'contact';
  /** The glaze: any CSS colour. */
  glaze?: string;
  /** How full it is, 0 to 1. Empty shows the bottom of the mug and what dried on it. */
  coffee?: number;
  /** What is drunk from it: the colour of the surface. */
  drink?: string;
  className?: string;
  style?: React.CSSProperties;
};

/** How tall a mug is, in millimetres. */
export const MUG_TALL = 95;
/** Estimated ordinary coffee-mug height relative to its 140 mm artwork box.
 * The visible body occupies 140/240 of that box: about 82 mm diameter. */
export const MUG_HEIGHT = MUG_TALL / 140;
/** Artwork width in the shared desk coordinate system. */
export const MUG_WIDTH = mmToUnits(140);
/** Where it stands within that drawing: the middle of it, now that nothing stands beside it. */
export const MUG_FOOT = { x: 0.5, y: 0.5 };

/*
  What the mug blocks the light with: a circle, because that is what a mug is.

  It used to have a shadow of its own — a component that swept a circle and a
  stroked arc away from the bulb analytically, because the general way of casting
  here, stamping a silhouette up through its own height, had nothing to stamp.
  Given an outline it has, and the two were hard to tell apart on the desk. So the
  mug says what shape it is, like everything else, and the special case is gone.
*/
export const MUG_SILHOUETTE = [{ path: 'M50 20.8A29.2 29.2 0 1 0 50 79.2A29.2 29.2 0 1 0 50 20.8Z' }];

const clamp = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

/** Layered ceramic artwork with an exact elevated rim and a grounded base.
 * Outside a Perspective it retains its original overhead drawing. */
export function Mug({ shadow = 'none', glaze = '#e8dfcc', coffee = 0.7, drink = '#3a2113', className = '', style }: MugProps) {
  const id = `mug-${useId().replace(/:/g, '')}`;
  const level = clamp(coffee);
  const { host, layer } = useMugLayer(MUG_HEIGHT);
  const wall = cylinderSide(BASE_LAYER, 62, layer, 70, { x: 104, y: 120 });
  /* The surface sinks a little as it empties: seen from above it is nearer the bottom, so a shade smaller. */
  const surface = 54 - (1 - level) * 5;
  return (
    <div ref={host} className={`mug ${shadow === 'contact' ? 'mug--contact' : ''} ${className}`} style={{ '--mug-glaze': glaze, '--mug-drink': drink, ...style } as React.CSSProperties}>
      <span className="mug__measure mug__measure--center" aria-hidden="true" />
      <span className="mug__measure mug__measure--edge" aria-hidden="true" />
      <svg className="mug__art" viewBox="-16 0 240 240" aria-hidden="true" focusable="false">
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
          {/* A cylinder under the window: bright a third of the way across, dark round both edges.
              In user space, so the wall and the base below it are lit as one piece. */}
          <linearGradient id={`${id}-side`} gradientUnits="userSpaceOnUse" x1={Math.min(42, 104 + layer.x - 70 * layer.scale)} y1="0" x2={Math.max(166, 104 + layer.x + 70 * layer.scale)} y2="0">
            <stop offset="0" stopColor="#000" stopOpacity="0.45" />
            <stop offset="0.14" stopColor="#000" stopOpacity="0.1" />
            <stop offset="0.3" stopColor="#fff" stopOpacity="0.26" />
            <stop offset="0.46" stopColor="#fff" stopOpacity="0.1" />
            <stop offset="0.7" stopColor="#000" stopOpacity="0.16" />
            <stop offset="1" stopColor="#000" stopOpacity="0.55" />
          </linearGradient>
          <filter id={`${id}-shadow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
          <clipPath id={`${id}-bowl`}>
            <circle cx="104" cy="120" r={surface} />
          </clipPath>
        </defs>

        {shadow === 'contact' && <circle className="mug__contact" cx="104" cy="122" r="71" fill="#140c06" opacity="0.28" filter={`url(#${id}-shadow)`} />}

        <g className="mug__side">
          <circle data-mug-base-point="" cx="104" cy="120" r="0" />
          <circle data-mug-base="" className="mug__base" cx="104" cy="120" r="62" />
          <circle cx="104" cy="120" r="62" fill={`url(#${id}-side)`} />
          <path className="mug__wall-glaze" d={wall} />
          <path d={wall} fill={`url(#${id}-side)`} />
        </g>

        <g className="mug__top" visibility={layer.scale > 0 ? undefined : 'hidden'} transform={`translate(${104 + layer.x} ${120 + layer.y}) scale(${layer.scale}) translate(-104 -120)`}>
        <circle data-mug-rim="" cx="104" cy="120" r="0" />
        <circle data-mug-rim-left="" cx="34" cy="120" r="0" />
        <circle data-mug-rim-right="" cx="174" cy="120" r="0" />

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
