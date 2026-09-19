import { WallWindow } from '../../components/3D/WallWindow/WallWindow';
import { roomSurfaceExtents } from '../../geometry/roomCoverage';
import { DEFAULT_LIGHT_TUNING } from '../../geometry/lightingSetup';
import { DESK_SIZE, mmToUnits } from '../../geometry/physicalScale';
import type React from 'react';
import { memo, useId, useRef, type Ref } from 'react';
import { useDeskLightEffect } from '../../behaviors/DeskLighting/DeskLighting';
import { DESK_WIDTH } from '../../components/3D/Desk/Desk';
import { Floor, type FloorWood } from '../../components/3D/Floor/Floor';
import { Wall, type WallFinish } from '../../components/3D/Wall/Wall';
import './DeskRoom.css';

/**
 * Everything here is in desk units: 1440 across is the desk's 1200
 * millimetres, so a unit is five sixths of a millimetre and every size below
 * is the size it is in a room.
 */
/** How much of the room the frame takes in: 1.3 metres, a hand's width past the desk each side. */
export const ROOM_WIDTH = 1580;
/** What is left of the frame for the desk once the room is around it. */
export const ROOM_DESK_SHARE = DESK_WIDTH / ROOM_WIDTH;
/** How high the desk top stands off the boards: 750 millimetres, an ordinary desk. */
export const DESK_STAND = DESK_SIZE.height;
/** How deep the desk is, front edge to the wall it stands against: 800 millimetres. */
export const ROOM_DESK_DEPTH = DESK_SIZE.depth;
/** How far the frame reaches below the desk's front edge, in desk units on the screen: a strip of the boards under it. */
export const ROOM_LIP = 60;
/** How much floor and wall is drawn: 2.2 metres, so the frame is covered however the eye moves. */
export const ROOM_SPAN = mmToUnits(2200);
/*
  The boards run across the drawing, so what we see of them is their length.
  Only a shallow strip of floor is in frame and it is foreshortened hard, so a
  course is laid narrow and a board kept short — narrower and shorter than the
  boards really are. A strip that only takes two courses at their true width
  reads as a field rather than a floor; at these sizes several courses and
  several joints fall inside the little of it we can see, which is what says
  boards.
*/
const FLOOR_COURSE = 96;
const FLOOR_RUN = 360;
/*
  How much of the desk's true throw is drawn. A bulb this low over the top
  really would scale the desk's outline past three times its size and put the
  whole room in shade, which is true and unusable: it would bury the boards
  and leave nothing for the shadow to move against. So the throw is reined in
  the way the room's light is, by tempering the ratio rather than by capping
  how far a corner may travel — the outline still grows and shrinks about the
  bulb, it just does less of it.
*/
const THROW_TEMPER = 0.42;

/**
 * Where the floor lies in relation to the desk top, seen from this eye.
 *
 * The floor is a desk's height below the top, along the top's own normal.
 * The top is tipped away by the tilt, so that normal leans toward the eye,
 * and a surface dropped along it goes both further from the eye and lower on
 * the screen: `back` and `down`, in desk units, straight out of the one
 * height. Everything in the room is placed by these two numbers and the
 * desk's own depth, so the floor cannot quietly end up level with the desk
 * top, and the wall's foot cannot end up anywhere but where the boards stop.
 */
export function floorLies(angle: number, stand: number) {
  const tilt = ((90 - angle) * Math.PI) / 180;
  return { tilt, back: stand * Math.cos(tilt), down: stand * Math.sin(tilt) };
}

export type DeskRoomProps = {
  windowHeightMm?: number;
  windowSillHeightMm?: number;
  /** How far above the surface the eye is, in degrees: the same camera the desk is seen from. */
  angle: number;
  /** How far the eye is, in desk units: the same distance the desk is seen from. */
  depth: number;
  /** How much of the frame's width the desk takes, which is what a desk unit is worth in the frame. */
  deskShare?: number;
  /** How deep the desk top is, front edge to the wall, in desk units. */
  deskDepth?: number;
  deskWidth?: number;
  targetY?: number;
  frameAnchor?: number;
  span?: number;
  front?: number;
  wallHeight?: number;
  /** How high the desk top stands off the boards, in desk units. */
  stand?: number;
  /** How far the frame reaches below the desk's front edge, in desk units on the screen. */
  lip?: number;
  /** The timber the floor is laid in. */
  floor?: FloorWood;
  /** What the brick has been finished in. */
  wall?: WallFinish;
  /** How far out of focus the room is, 0 to 3. 0 is everything sharp; the boards, being further off, go first. */
  blur?: number;
  /** How far the room falls away from the light on the desk, 0 to 1. */
  dim?: number;
  /** How dark the desk's shadow on the boards is when the lamp is on, 0 to 1. */
  shadowStrength?: number;
};

/**
 * The lamp's light on the boards, and the desk's shadow in it.
 *
 * The same rule every object on the desk casts by: a point is thrown away
 * from the bulb by its drop over the bulb's height above it. For the desk
 * top the drop is the whole stand, so the shadow of each corner is the
 * corner moved away from the bulb by that much of its distance from it, and
 * the shadow is the four moved corners joined up — long on the side away
 * from the lamp, short on the side under it. Round it, where the light gets
 * past the top, the boards are lit: a warm pool under the bulb that the
 * shadow is cut out of, so the floor is bright beside the desk on the lamp's
 * side and dark on the other, and swaps over when the lamp is moved. It is
 * all drawn in the floor's own plane, in desk units, so it lies on the
 * boards and foreshortens with them.
 *
 * It is thrown very soft. A bulb under a shade is a broad source and the room
 * around it is not black, so the boards get light from the walls and the air
 * as well as straight from the lamp, and the edge of anything this far from
 * the source washes out over a hand's width rather than cutting. So the throw
 * is drawn twice: a wide, faint halo for the light bouncing round the room,
 * and a slightly tighter core inside it for the lamp itself. Neither is a
 * hard edge. Off, only the dark under the desk itself is left, and that is
 * soft too.
 */
/*
  How many rings make a penumbra.

  The throw used to be a polygon put through a Gaussian of a hundred and
  seventy, which is a blur so broad it keeps almost none of the shape it was
  given — and it was the single most expensive thing on the desk, because a
  filter is rasterised on its own every time what it covers changes, and the
  lamp moves over it constantly. Taking the deviation down to five barely
  helped: it is not the width of the blur that costs, it is having one.

  So the soft edge is drawn instead of computed, the same way the things on the
  desk fake their own height — nested copies of the outline, each a little
  larger and all faint, piling up toward the middle. Nine is enough that the
  steps disappear at this softness, and because each ring strictly contains the
  next the build-up is monotonic and there are no seams.
*/
const THROW_RINGS = 9;

type Point = { x: number; y: number };

/** The middle of an outline, for growing it about. */
function middleOf(outline: Point[]): Point {
  const sum = outline.reduce((at, p) => ({ x: at.x + p.x, y: at.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / outline.length, y: sum.y / outline.length };
}

/** An outline grown about its own middle. */
const grownBy = (outline: Point[], by: number) => {
  const mid = middleOf(outline);
  return outline.map(p => ({ x: mid.x + (p.x - mid.x) * by, y: mid.y + (p.y - mid.y) * by }));
};

const points = (list: Point[]) => list.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

/** The rings of one soft-edged shape, outermost first. */
const ringsOf = (outline: Point[], spread: number) =>
  Array.from({ length: THROW_RINGS }, (_, ring) => grownBy(outline, 1 + spread * (1 - ring / (THROW_RINGS - 1))));

/** Each ring carries the same little of the total, so the stack thickens evenly inward. */
const perRing = (weight: number) => 1 - (1 - weight) ** (1 / THROW_RINGS);

/**
 * A pile of rings making one soft-edged shape. The outline it is given is only
 * its first: where the shape ends up is written on afterwards by whoever owns
 * the light, so this never re-renders for the lamp.
 */
function SoftShape({ outline, spread, weight, className, ref }: { outline: Point[]; spread: number; weight: number; className?: string; ref?: Ref<SVGGElement> }) {
  const each = perRing(weight);
  return <g ref={ref} className={className}>
    {ringsOf(outline, spread).map((ring, index) => <polygon key={index} points={points(ring)} fill="#0a0603" opacity={each} />)}
  </g>;
}

function DeskFloorShadow({ deskWidth, span, deskDepth, stand, floorDepth, strength }: { deskWidth: number; span: number; deskDepth: number; stand: number; floorDepth: number; strength: number }) {
  const id = `desk-floor-shadow-${useId().replace(/:/g, '')}`;
  const x0 = (span - deskWidth) / 2;
  const foot = { x: x0, y: 0, w: deskWidth, h: deskDepth };
  const corners = [
    { x: foot.x, y: foot.y },
    { x: foot.x + foot.w, y: foot.y },
    { x: foot.x + foot.w, y: foot.y + foot.h },
    { x: foot.x, y: foot.y + foot.h },
  ];
  const halo = useRef<SVGGElement>(null);
  const core = useRef<SVGGElement>(null);
  const bulbPool = useRef<SVGCircleElement>(null);
  const switched = useRef<boolean | null>(null);
  const poolStops = useRef<SVGRadialGradientElement>(null);

  /*
    Everything below depends on where the lamp is, and is therefore written
    straight onto the shapes rather than rendered. The dark under the desk is
    not here at all: the desk does not move, so its own shadow is drawn once and
    then left alone. Rewriting all twenty-seven of these outlines through React
    every frame was worth some fifteen milliseconds, for a shape that mostly
    never changed.
  */
  useDeskLightEffect(light => {
    const on = !!light?.on;
    /* Whether the lamp is lit changes when it is switched, not when it is carried:
       written then rather than every frame of a drag, since an opacity put back at
       the value it already had still marks its layer to be drawn again. */
    if (on !== switched.current) {
      switched.current = on;
      for (const group of [halo.current, core.current, bulbPool.current]) group?.setAttribute('opacity', on ? '1' : '0');
    }
    bulbPool.current?.style.setProperty('filter', (light?.intensity ?? 1) === 1 ? '' : `brightness(${light?.intensity})`);
    bulbPool.current?.style.setProperty('visibility', light?.intensity === 0 ? 'hidden' : '');
    if (!light || !on) return;
    /*
      The same projection every object on the desk casts by, with the desk top as
      the occluder and the boards as the ground: a point is thrown away from the
      bulb by its drop over the bulb's height above it, so the shadow is the
      desk's outline scaled about the bulb. Scaling about the bulb is what makes
      it behave — the outline grows away from the light and shrinks toward it, so
      an edge near the lamp casts a short shadow and the far edge a long one, and
      every edge still lands outside the desk. Move the lamp to the left of the
      desk and there is still a shadow off its left side, a short one, which a
      shadow pushed out by distance alone could never give.
    */
    const ratio = Math.min(light.tuning?.floorShadowLimit ?? DEFAULT_LIGHT_TUNING.floorShadowLimit, stand / Math.max(1, light.height)) * (light.tuning?.floorShadowTemper ?? THROW_TEMPER);
    const bulb = { x: x0 + light.x, y: light.y };
    const thrown = corners.map(c => ({ x: bulb.x + (c.x - bulb.x) * (1 + ratio), y: bulb.y + (c.y - bulb.y) * (1 + ratio) }));
    for (const [group, spread] of [[halo.current, 0.24], [core.current, 0.11]] as const) {
      if (!group) continue;
      ringsOf(thrown, spread).forEach((ring, index) => (group.children[index] as SVGPolygonElement | undefined)?.setAttribute('points', points(ring)));
    }
    /* How far the light gets across the boards: the bulb's height over them, and a little. */
    const pool = (light.height + stand) * (light.tuning?.floorPoolSpread ?? DEFAULT_LIGHT_TUNING.floorPoolSpread);
    for (const [name, value] of [['cx', bulb.x], ['cy', bulb.y], ['r', pool]] as const) {
      bulbPool.current?.setAttribute(name, String(value));
      poolStops.current?.setAttribute(name, String(value));
    }
  });

  return (
    <svg className="desk-room__shadow" viewBox={`0 0 ${span} ${floorDepth}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <radialGradient ref={poolStops} id={`${id}-pool`} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1">
          <stop offset="0" stopColor="#ffd9a3" stopOpacity="0.5" />
          <stop offset="0.55" stopColor="#ffd9a3" stopOpacity="0.28" />
          <stop offset="1" stopColor="#ffd9a3" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* What the lamp lights, laid down first so that what it throws falls over
          it — which is what the mask used to do, and a mask is a filter's worth
          of rasterising for a thing that stacking gives away free. */}
      <circle ref={bulbPool} className="desk-room__pool" cx="0" cy="0" r="1" opacity="0" fill={`url(#${id}-pool)`} />
      {/* Nothing is drawn on the desk's own footprint. The desk is a slab seen
          from above and it is opaque, so every ring that used to be stacked under
          it was painted and then covered over — nine outlines the size of the desk,
          for a thing no one can see. What shows of the boards is the strip in front
          of its edge and the floor to either side, and the throw below reaches those
          on its own. */}
      {/* And what it throws: the halo the room's own bounced light leaves, and
          the lamp's own core inside it. */}
      <SoftShape ref={halo} className="desk-room__thrown" outline={corners} spread={0.24} weight={strength * 0.75} />
      <SoftShape ref={core} className="desk-room__thrown" outline={corners} spread={0.11} weight={strength * 0.5} />
    </svg>
  );
}

/**
 * The room the desk stands in: boards underfoot and brick behind.
 *
 * Both are real surfaces in the desk's own space, seen from the desk's own
 * eye. The eye is over the desk's front edge, at the depth the desk's
 * Perspective puts it; the floor is the desk top's plane dropped a desk's
 * height, and the wall is stood up on the floor at the desk's back edge,
 * because the desk is pushed against it. Each is a plan or an elevation
 * drawn flat and put in place with one CSS transform, and the projection
 * does the rest: the floor is drawn smaller and lower than the desk top for
 * being further off, the wall's foot goes behind the desk and its top comes
 * toward the eye, so its courses are seen from above and its perpends lean
 * out. Nothing is tuned to look right; it is measured, and it looks the way
 * that measures.
 *
 * The desk has no body: it is a slab, the way everything here is a drawing
 * of its top. What shows under its front edge is the boards beneath it, in
 * its own shadow.
 *
 * What is not honest is the light. The lamp on the desk is the light in here,
 * so the room is dimmed and softened a little rather than lit as far as it
 * really would be.
 */
/*
  Memoised, and it matters more than it looks.

  Nothing in this room depends on where anything on the desk is. But it is
  rendered from the same component that owns the placements, so every step of
  every drag used to re-render the whole of it — and DeskFloorShadow below
  writes its geometry in a layout effect that runs after each of its own
  renders, whether or not the lamp has moved. That put some two dozen attribute
  writes a frame onto the shadow, none of which changed a value, and each of
  them marked the floor to be drawn again: twelve courses of turbulence and
  displacement rasterised afresh, then blurred, to put a shadow exactly where
  it already was. It was measured at twenty-six milliseconds a frame — the
  difference between a desk at twenty-three a second and one at sixty.

  Held, the room renders when the room changes. The lamp still moves the shadow,
  through the light store, which is what the store is for.
*/
export const DeskRoom = memo(function DeskRoom({ windowHeightMm, windowSillHeightMm, angle, depth, deskShare = ROOM_DESK_SHARE, deskWidth = DESK_WIDTH, span: givenSpan, front: givenFront, wallHeight: givenWallHeight, deskDepth = ROOM_DESK_DEPTH, targetY = deskDepth, frameAnchor = 1, stand = DESK_STAND, lip = ROOM_LIP, floor = 'pine', wall = 'red', blur = 1, dim = 0.32, shadowStrength = 0.36 }: DeskRoomProps) {
  const { back, down } = floorLies(angle, stand);
  let extents;
  try {
    extents = roomSurfaceExtents(
      { angle, depth, deskWidth, deskDepth, stand, deskShare, lip, targetY, frameAnchor },
      { span: givenSpan, front: givenFront, wallHeight: givenWallHeight },
    );
  } catch (error) {
    // Room normally catches this before accepting the scene. Keep direct
    // DeskRoom consumers safe too; never allocate an unbounded material tree.
    return <div className="room__diagnostic" role="alert">{error instanceof Error ? error.message : 'Room background exceeds rendering capacity'}</div>;
  }
  const { span, front, wallHeight } = extents;
  const floorDepth = deskDepth + front;
  return (
    <div
      className="desk-room"
      aria-hidden="true"
      style={
        {
          '--desk-room-share': deskShare,
          '--desk-room-width': deskWidth,
          '--desk-room-eye': depth,
          '--desk-room-tilt': `${90 - angle}deg`,
          '--desk-room-stand': stand,
          '--desk-room-back': back,
          '--desk-room-down': down,
          '--desk-room-lip': lip,
          '--desk-room-target': targetY,
          '--desk-room-anchor': frameAnchor,
          '--desk-room-depth': deskDepth,
          '--desk-room-front': front,
          '--desk-room-span': span,
          '--desk-room-blur': blur,
          '--desk-room-dim': dim,
        } as React.CSSProperties
      }
    >
      {/* The boards: the desk top's plane a desk's height down, running from in front of the desk back to the wall. */}
      <div className="desk-room__layer desk-room__layer--floor">
        <div className="desk-room__floor">
          <Floor materialOrigin={{ x: -span / 2, y: 0 }} wood={floor} width={span} height={floorDepth} lay="across" board={FLOOR_COURSE} run={FLOOR_RUN} light={0} />
          <DeskFloorShadow deskWidth={deskWidth} span={span} deskDepth={deskDepth} stand={stand} floorDepth={floorDepth} strength={shadowStrength} />
        </div>
      </div>

      {/* The brick, stood up on the boards where they stop, its bottom courses behind the desk. */}
      <div className="desk-room__layer desk-room__layer--wall">
        <div className="desk-room__wall">
          <Wall materialOrigin={{ x: -span / 2, y: -wallHeight }} finish={wall} width={span} height={wallHeight} flat weathered light={0} />
          <WallWindow height={windowHeightMm} sill={windowSillHeightMm} />
        </div>
      </div>


      {/* The air: the lamp is on the desk, and the room falls off away from it. */}
      <div className="desk-room__haze" />
    </div>
  );
});
