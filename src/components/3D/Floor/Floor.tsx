import type React from 'react';
import { useId } from 'react';
import './Floor.css';

export const FLOOR_WOODS = ['pine', 'oak', 'walnut', 'limed'] as const;
export type FloorWood = (typeof FLOOR_WOODS)[number];
export const FLOOR_LAYS = ['across', 'away'] as const;
/** Which way the boards run: across the drawing, or away up it, toward whatever is at the top. */
export type FloorLay = (typeof FLOOR_LAYS)[number];

/**
 * A surface is 1440 units across, the way a sheet and the desk are, and the
 * desk is about 1200 millimetres wide at that — so a unit is near enough five
 * sixths of a millimetre and the sizes below are the sizes they are in a room.
 */
/** The face width of an ordinary floorboard: 150 millimetres. */
export const FLOOR_BOARD = 180;
/** How far a board runs before it butts into the next one: about 1.25 metres. */
export const FLOOR_BOARD_RUN = 1500;

/** Deterministic wobble in 0..1, so a floor is laid the same way every render. */
function wobble(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Where one course of boards butts, in units across the floor. */
function joints(row: number, width: number, run: number) {
  const at: number[] = [];
  for (let x = -run * wobble(row * 7 + 1); x < width; x += run) {
    if (x > run * 0.18 && x < width - run * 0.18) at.push(x);
  }
  return at;
}

export type FloorProps = {
  /** The timber the boards are cut from. */
  wood?: FloorWood;
  /** The floor's design width in units, which is what every size here is measured against. */
  width?: number;
  /** How deep the floor runs, in the same units. */
  height?: number;
  /** The face width of one board, in units. 180 is a 150 millimetre board. */
  board?: number;
  /** How far a board runs before it butts into the next, in units. 0 lays the floor in unbroken lengths. */
  run?: number;
  /** Which way the boards run: `across` the drawing, or `away` up it, toward a wall at the top. */
  lay?: FloorLay;
  /** How strongly the room's light falls across the boards, 0 to 1. */
  light?: number;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * A board floor seen from above, the ground a room stands on. It is drawn the
 * way the desk top is — bands of tone pushed about by turbulence into figure,
 * pores over that, the room's light across the finish — but laid as a floor
 * rather than glued up as a top: the boards run across, each course has its
 * own cast and its own seam, and the courses butt at staggered ends the way a
 * floor is actually laid rather than running unbroken wall to wall. Laid
 * `away`, the same courses are turned to run up the drawing, toward whatever
 * stands at its top.
 *
 * It is a plan drawing and nothing else. It has no thickness and says nothing
 * about how far below the desk it lies; that belongs to whatever stands it in
 * a room. Tip it in a `Perspective` and it foreshortens like any other surface.
 */
export function Floor({
  wood = 'pine',
  width = 1440,
  height = 1620,
  board = FLOOR_BOARD,
  run = FLOOR_BOARD_RUN,
  lay = 'across',
  light = 1,
  children,
  className = '',
  style,
  ...rest
}: FloorProps & Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'className' | 'style'>) {
  const id = `floor-${useId().replace(/:/g, '')}`;
  /* A board runs the drawing's width, or its height if laid away; the courses count across the other. */
  const length = lay === 'across' ? width : height;
  const span = lay === 'across' ? height : width;
  const courses = Math.max(1, Math.ceil(span / Math.max(1, board)));
  return (
    <div
      {...rest}
      className={`floor ${className}`}
      data-wood={wood}
      data-lay={lay}
      style={{ '--floor-width': width, '--floor-height': height, '--floor-board': board, '--floor-light': light, ...style } as React.CSSProperties}
    >
      <div className="floor__ground">
        <svg className="floor__filters" aria-hidden="true" focusable="false">
          <defs>
            {/* The figure: turbulence stretched along the boards, bending the bands of tone. */}
            <filter id={`${id}-grain`} x="-5%" y="-10%" width="110%" height="120%" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.0018 0.014" numOctaves="3" seed="7" result="wave" />
              <feDisplacementMap in="SourceGraphic" in2="wave" scale="70" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>
        <div className="floor__boards" data-lay={lay} aria-hidden="true">
          {Array.from({ length: courses }, (_, course) => (
            <div key={course} className="floor__course" style={{ '--floor-course': course } as React.CSSProperties}>
              <div className="floor__bands" style={{ filter: `url(#${id}-grain)` }} />
              {run > 0
                ? joints(course, length, run).map((x) => (
                    <span key={x} className="floor__butt" style={{ '--floor-butt-at': x } as React.CSSProperties} />
                  ))
                : null}
            </div>
          ))}
        </div>
        <div className="floor__pores" data-lay={lay} aria-hidden="true" />
        <div className="floor__light" aria-hidden="true" />
        <div className="floor__things">{children}</div>
      </div>
    </div>
  );
}
