import { DESK_SIZE } from '../../../geometry/physicalScale';
import type React from 'react';
import { useId } from 'react';
import './Desk.css';

export const DESK_WOODS = ['walnut', 'oak', 'ebony', 'cherry'] as const;
export type DeskWood = (typeof DESK_WOODS)[number];

export const DESK_SURFACES = ['timber', 'laminate'] as const;
/**
 * What the top actually is. `timber` is a board: the bands of tone are pushed
 * about by turbulence into figure, and the pores lie over it. `laminate` is a
 * picture of a board — a printed film on chipboard — so it is the same bands
 * with the figure taken out and nothing under them: the grain repeats, every
 * board of it is the same board, and there are no pores at all, because the
 * surface is a sheet of melamine. That evenness is the whole tell, and it is
 * why a folding table never looks like a desk.
 */
export type DeskSurface = (typeof DESK_SURFACES)[number];

/** The desk is measured like a sheet: 1440 units across. */
export const DESK_WIDTH = DESK_SIZE.width;

export type DeskProps = {
  /** The timber the top is made of, or the timber its print is of. */
  wood?: DeskWood;
  /** Whether the top is a board or a printed film over chipboard. */
  surface?: DeskSurface;
  /** Height of the top in desk units, where 1440 is its width. */
  height?: number;
  /** Physical surface width in desk units; object units remain unchanged. */
  width?: number;
  /** How many boards the top is glued up from. 1 is a single slab, the usual desk top. */
  boards?: number;
  /** How strongly the room's light falls across the top, 0 to 1: a satin sheen from the upper left and shade in the corners. */
  light?: number;
  /** The desk's front edge along the bottom, in units, seen because we are looking a little down at it. 0 hides it. */
  edge?: number;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * A wooden desktop seen from above, the surface everything else is laid on.
 * The grain is drawn, not photographed: broad bands of tone run the length of
 * the top and are pushed about by turbulence into figure, pores lie over
 * that, and the room's light falls across the satin finish from the upper
 * left. Along the bottom is the desk's rounded front edge. Children are
 * placed on it with Pin, in desk units, so a composition on it scales as one
 * piece.
 */
export function Desk({ wood = 'walnut', surface = 'timber', width = DESK_WIDTH, height = 810, boards = 1, light = 1, edge = 22, children, className = '', style, ...rest }: DeskProps & Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'className' | 'style'>) {
  const id = `desk-${useId().replace(/:/g, '')}`;
  const count = Math.max(1, Math.round(boards));
  return (
    <div
      {...rest}
      className={`desk ${className}`}
      data-wood={wood}
      data-surface={surface}
      style={{ '--desk-width': width, '--desk-height': height, '--desk-light': light, '--desk-boards': count, '--desk-edge': edge, ...style } as React.CSSProperties}
    >
      <div className="desk__top">
        <svg className="desk__filters" aria-hidden="true" focusable="false">
          <defs>
            {/* The figure: low-frequency turbulence, stretched along the top, that bends the bands of tone. */}
            <filter id={`${id}-grain`} x="-5%" y="-10%" width="110%" height="120%" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.0016 0.012" numOctaves="3" seed="11" result="wave" />
              <feDisplacementMap in="SourceGraphic" in2="wave" scale="90" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            {/* Pores: fine noise, tilted to the grain, lit from the side. */}
            <filter id={`${id}-pores`} x="0" y="0" width="100%" height="100%" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.05 0.8" numOctaves="2" seed="3" result="noise" />
              <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.4 -0.1" />
            </filter>
          </defs>
        </svg>
        <div className="desk__boards" aria-hidden="true">
          {Array.from({ length: count }, (_, board) => (
            <div key={board} className="desk__board" style={{ '--desk-board': board } as React.CSSProperties}>
              {/* Filter primitives now see desk units, rather than responsive CSS pixels.
                  Keep the existing gradients and their 14% overscan inside that space. */}
              {/* A printed top has no figure to bend, so it skips the filter
                  — and the drawing of it is the honest one: the same bands,
                  repeating exactly, which is what a print is. */}
              {surface === 'laminate'
                ? <div className="desk__grain"><div className="desk__bands" /></div>
                : <svg className="desk__grain" viewBox={`0 0 ${width * 1.28} ${height / count * 1.28}`} preserveAspectRatio="none" focusable="false">
                    <foreignObject width={width * 1.28} height={height / count * 1.28} filter={`url(#${id}-grain)`}>
                      <div className="desk__bands" style={{ '--sheet-unit': '1px' } as React.CSSProperties} />
                    </foreignObject>
                  </svg>}
            </div>
          ))}
        </div>
        <svg className="desk__pores" viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false" preserveAspectRatio="none">
          <rect width="100%" height="100%" filter={`url(#${id}-pores)`} />
        </svg>
        <div className="desk__light" aria-hidden="true" />
        {edge > 0 ? <div className="desk__edge" aria-hidden="true" /> : null}
        <div className="desk__things">{children}</div>
      </div>
    </div>
  );
}
