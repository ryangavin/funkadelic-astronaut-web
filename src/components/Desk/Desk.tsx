import type React from 'react';
import { useId } from 'react';
import './Desk.css';

export const DESK_WOODS = ['walnut', 'oak', 'ebony'] as const;
export type DeskWood = (typeof DESK_WOODS)[number];

/** The desk is measured like a sheet: 1440 units across. */
export const DESK_WIDTH = 1440;

export type DeskProps = {
  /** The timber the top is made of. */
  wood?: DeskWood;
  /** Height of the top in desk units, where 1440 is its width. */
  height?: number;
  /** How many boards the top is glued up from. 1 is a single slab. */
  boards?: number;
  /** How strongly the room's light falls across the top, 0 to 1: a sheen from the upper left and shade in the corners. */
  light?: number;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * A wooden desktop seen from above, the surface everything else is laid on.
 * The grain is drawn, not photographed: bands of tone run the length of the
 * top and are pushed about by turbulence, so no two boards match, with pores
 * over that and the room's light falling from the upper left. Children are
 * placed on it with Pin, in desk units, so a composition on it scales as one
 * piece.
 */
export function Desk({ wood = 'walnut', height = 1000, boards = 3, light = 1, children, className = '', style, ...rest }: DeskProps & Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'className' | 'style'>) {
  const id = `desk-${useId().replace(/:/g, '')}`;
  const count = Math.max(1, Math.round(boards));
  return (
    <div
      {...rest}
      className={`desk ${className}`}
      data-wood={wood}
      style={{ '--desk-height': height, '--desk-light': light, '--desk-boards': count, ...style } as React.CSSProperties}
    >
      <div className="desk__top">
      <svg className="desk__filters" aria-hidden="true" focusable="false">
        <defs>
          {/* The grain: low-frequency turbulence, stretched along the boards, that bends the bands of tone. */}
          <filter id={`${id}-grain`} x="-5%" y="-10%" width="110%" height="120%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.0022 0.03" numOctaves="3" seed="11" result="wave" />
            <feDisplacementMap in="SourceGraphic" in2="wave" scale="48" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          {/* Pores: fine noise, tilted to the grain, lit from the side. */}
          <filter id={`${id}-pores`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.06 0.9" numOctaves="2" seed="3" result="noise" />
            <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 -0.12" />
          </filter>
        </defs>
      </svg>
      <div className="desk__boards" aria-hidden="true">
        {Array.from({ length: count }, (_, board) => (
          <div key={board} className="desk__board" style={{ '--desk-board': board } as React.CSSProperties}>
            <div className="desk__bands" style={{ filter: `url(#${id}-grain)` }} />
          </div>
        ))}
      </div>
      <svg className="desk__pores" aria-hidden="true" focusable="false" preserveAspectRatio="none">
        <rect width="100%" height="100%" filter={`url(#${id}-pores)`} />
      </svg>
      <div className="desk__light" aria-hidden="true" />
      <div className="desk__things">{children}</div>
      </div>
    </div>
  );
}
