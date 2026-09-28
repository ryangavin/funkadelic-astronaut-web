import type React from 'react';
import './Wall.css';
import { wallMaterialBricks, type MaterialOrigin } from '../../../geometry/materialCoordinates';

export const WALL_FINISHES = ['whitewash', 'red', 'buff', 'black', 'panel', 'glaze'] as const;
export type WallFinish = (typeof WALL_FINISHES)[number];

export const WALL_BONDS = ['running', 'stack'] as const;
/** How one course sits over the one below: half a unit along, or squarely on it. */
export type WallBond = (typeof WALL_BONDS)[number];

/**
 * Measured like every other surface here: 1440 units across is the desk's
 * 1200 millimetres, so a unit is about five sixths of a millimetre and the
 * brick below is a real brick.
 */
/** A stretcher and the perpend beside it: a 215 millimetre brick and a 10 millimetre joint. */
export const WALL_BRICK = 270;
/** A course: a 65 millimetre brick on a 10 millimetre bed. */
export const WALL_COURSE = 90;
/** The mortar joint itself: 10 millimetres. */
export const WALL_JOINT = 12;
/** A wall of an ordinary room: 2.4 metres. */
export const WALL_HEIGHT = 2880;

/**
 * What a wall is made of, and therefore how it is set out.
 *
 * A finish is not a colour here: it names the material, and a material comes
 * with the size of the unit it is made in and the way those units are laid.
 * Brick is 215 by 65 on a 10 millimetre joint in running bond, whatever it has
 * been painted. A glazed tile is 200 by 100 on a 3 millimetre grout, still in
 * running bond, because that is how a tiler lays it. A melamine-faced panel is
 * a sheet — 1220 wide and the whole height of the wall, with a shadow gap
 * between one sheet and the next — so it is laid squarely, and it has no
 * horizontal joint at all within the height of an ordinary room.
 *
 * So the room asks the material how it is built rather than being told, and a
 * composition that wants a tiled wall says `wall="glaze"` and gets tiles the
 * size tiles are.
 */
export const WALL_COURSING: Record<WallFinish, { brick: number; course: number; joint: number; bond: WallBond; worn: number }> = {
  whitewash: { brick: WALL_BRICK, course: WALL_COURSE, joint: WALL_JOINT, bond: 'running', worn: 22 },
  red: { brick: WALL_BRICK, course: WALL_COURSE, joint: WALL_JOINT, bond: 'running', worn: 22 },
  buff: { brick: WALL_BRICK, course: WALL_COURSE, joint: WALL_JOINT, bond: 'running', worn: 22 },
  black: { brick: WALL_BRICK, course: WALL_COURSE, joint: WALL_JOINT, bond: 'running', worn: 22 },
  /* A 1220 sheet and its 6 millimetre shadow gap, full height. */
  panel: { brick: 1471, course: 2952, joint: 8, bond: 'stack', worn: 9 },
  /* A 200 by 100 metro tile on a 3 millimetre grout. */
  glaze: { brick: 244, course: 124, joint: 4, bond: 'running', worn: 7 },
};

/** Deterministic wobble in 0..1, so a wall is built the same way every render. */
function wobble(n: number) {
  const x = Math.sin(n * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * The bricks that do not match their neighbours. A wall is not one colour: it
 * is a few hundred separately fired things, and paint over them goes on thin
 * in some places and thick in others. Which bricks stand out is decided per
 * brick, from where it sits in the bond, so a wall of any size is variegated
 * at the same rate and always the same way.
 */
function variegation(width: number, height: number, brick: number, course: number, rate: number, stagger = 0.5) {
  const across = Math.max(1, Math.ceil(width / brick) + 1);
  const rows = Math.max(1, Math.ceil(height / course));
  const out: { x: number; y: number; worn: number; lean: number; tone: 'thin' | 'thick' }[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < across; col++) {
      if (wobble(row * 131 + col * 17 + 1) > rate / 100) continue;
      const kind = wobble(row * 29 + col * 53 + 2);
      out.push({
        x: col * brick - (row % 2 ? brick * stagger : 0),
        y: row * course,
        // Mostly brick showing through; a third of them are just a heavier coat.
        worn: 0.2 + kind * 0.7,
        lean: wobble(row * 7 + col * 11 + 3),
        tone: kind < 0.34 ? 'thick' : 'thin',
      });
    }
  }
  return out;
}

export type WallProps = {
  /** World coordinates at the crop’s top-left; omitted preserves standalone drawing. */
  materialOrigin?: MaterialOrigin;
  /** What the brick has been finished in. */
  finish?: WallFinish;
  /** The wall's design width in units, which is what every size here is measured against. */
  width?: number;
  /** How high the wall stands, in the same units. */
  height?: number;
  /** A stretcher and its perpend, in units. 270 is a 215 millimetre brick and a 10 millimetre joint. */
  brick?: number;
  /** A course, in units. 90 is a 65 millimetre brick on a 10 millimetre bed. */
  course?: number;
  /** How many bricks in a hundred do not match their neighbours. 0 is a wall painted last week. */
  worn?: number;
  /** The joint between one unit and the next, in units. */
  joint?: number;
  /** Running bond steps every other course half a unit along; stack bond lays them squarely. */
  bond?: WallBond;
  /** How strongly the room's light falls across the wall, 0 to 1. */
  light?: number;
  /** Drawn flat: no grit under the paint and no brushwork over it, and the odd bricks are plain blocks of another tone. */
  flat?: boolean;
  /** Keep inexpensive per-brick weathering in flat room artwork, without grit or brush layers. */
  weathered?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * A brick wall, drawn face on. Everything else in this library is drawn in
 * plan, looking straight down, because everything else lies on a surface; a
 * wall is a surface, and the view it is drawn in is its own — its plan is a
 * line. So this is an elevation, at full height and no foreshortening, and
 * whatever stands it in a room is what tips it back.
 *
 * The bond is real: stretchers 215 millimetres long on a 10 millimetre joint,
 * 65 millimetre courses, every other course offset by half a brick, which is
 * the running bond of any ordinary wall. The joints are struck back, so each
 * brick catches the light on its top arris and drops its bottom edge into
 * shade. Over that goes the finish — whitewash thins on the arrises and pools
 * in the joints, and here and there a brick has worn through it warm. Drawn
 * `flat`, all of that texture goes and what is left is the bond in plain
 * colour, the way the rest of this library draws things.
 */
export function Wall({
  materialOrigin,
  finish = 'whitewash',
  width = 1440,
  height = WALL_HEIGHT,
  brick = WALL_COURSING[finish].brick,
  course = WALL_COURSING[finish].course,
  joint = WALL_COURSING[finish].joint,
  bond = WALL_COURSING[finish].bond,
  worn = WALL_COURSING[finish].worn,
  light = 1,
  flat = false,
  weathered = false,
  children,
  className = '',
  style,
  ...rest
}: WallProps & Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'className' | 'style'>) {
  // Bare stock varies through the firing, beyond the bricks with worn paint.
  const variationRate = finish === 'red' && (!flat || weathered) && worn > 0 ? Math.min(100, worn * 3) : worn;
  const stagger = bond === 'stack' ? 0 : 0.5;
  const odd = worn > 0 ? (materialOrigin ? wallMaterialBricks(materialOrigin, width, height, brick, course, variationRate, stagger) : variegation(width, height, brick, course, variationRate, stagger)) : [];
  return (
    <div
      {...rest}
      className={`wall ${className}`}
      data-finish={finish}
      data-material-origin={materialOrigin ? `${materialOrigin.x},${materialOrigin.y}` : undefined}
      data-bond={bond}
      data-flat={flat ? '' : undefined}
      data-weathered={weathered ? '' : undefined}
      style={{ '--wall-width': width, '--wall-height': height, '--wall-brick': brick, '--wall-course': course, '--wall-joint': joint, '--wall-stagger': stagger, '--wall-light': light, '--wall-origin-x': materialOrigin?.x ?? 0, '--wall-origin-y': materialOrigin?.y ?? 0, ...style } as React.CSSProperties}
    >
      <div className="wall__face">
        {/* The bond: bed joints across the whole wall, and perpends that step
            half a brick from one course to the next. */}
        <div className="wall__bond" aria-hidden="true">
          <span className="wall__perpends" data-courses="even" />
          <span className="wall__perpends" data-courses="odd" />
          <span className="wall__beds" />
        </div>

        <span className="wall__grit" aria-hidden="true" />

        {/* The finish over the brick, and the bricks it has worn off. */}
        <div className="wall__finish" aria-hidden="true">
          <span className="wall__brush" aria-hidden="true" />
          {odd.map(({ x, y, worn: through, lean, tone }) => (
            <span
              key={`${x}:${y}`}
              className="wall__brick"
              data-tone={tone}
              data-material-cell={`${x},${y}`}
              style={{ '--wall-at-x': x - (materialOrigin?.x ?? 0), '--wall-at-y': y - (materialOrigin?.y ?? 0), '--wall-worn': through, '--wall-lean': lean } as React.CSSProperties}
            />
          ))}
        </div>

        <div className="wall__light" aria-hidden="true" />
        <div className="wall__things">{children}</div>
      </div>
    </div>
  );
}
