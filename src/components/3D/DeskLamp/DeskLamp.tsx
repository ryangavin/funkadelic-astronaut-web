import type { LightTuning } from '../../../geometry/lightingSetup';
import { LAMP_HEIGHT, mmToUnits } from '../../../geometry/physicalScale';
import type React from 'react';
import { useContext, useEffect, useId, useRef, useState } from 'react';
import { MovableProject } from '../../../behaviors/Movable/Movable';
import { articulateLamp, type LampPose, type LampPoint } from './articulation';
import './DeskLamp.css';
import { projectElevation } from '../../../behaviors/Perspective/elevation';
import { DEFAULT_SHADOW_STRENGTH, useDeskLightWriter, useRegisterDeskLight } from '../../../behaviors/DeskLighting/DeskLighting';
import { usePlaceEffect, usePlaces } from '../../../behaviors/Movable/places';

export const DESK_LAMP_ENAMELS = ['red', 'mustard', 'green', 'black'] as const;
export type DeskLampEnamel = (typeof DESK_LAMP_ENAMELS)[number];

/** Where the shade's centre is in the lamp's box, and its radius, in 720ths of the box's width. */
export const DESK_LAMP_SHADE = { x: 200, y: 420, radius: 130 } as const;

/*
  The light spilling round the rim.

  This was a solid disc put through a Gaussian blur, which is a radial gradient
  drawn the expensive way: a blur filter is rasterised on its own every time
  what is under it changes, and the lamp is the thing most often dragged across
  the desk. The stops are that blur's own profile. A disc blurred by a deviation
  of s is still solid about two deviations inside its edge, exactly half at the
  edge, and gone about two deviations outside it, so the falloff below draws
  what the filter drew — and the compositor can now simply move it.
*/
const SPILL_BLUR = 22;
const SPILL_CORE = DESK_LAMP_SHADE.radius + 30;
const SPILL_EDGE = SPILL_CORE + SPILL_BLUR * 2.5;
const spillStop = (at: number) => +(at / SPILL_EDGE).toFixed(4);

export type DeskLampProps = {
  /** Full controlled articulation, including the lower hinge orientation. */
  pose?: LampPose;
  onPoseChange?: (pose: LampPose) => void;
  /** Controlled shade position in the 720×600 artwork; otherwise the lamp keeps its own position. */
  head?: LampPoint;
  onHeadChange?: (head: LampPoint) => void;
  /**
   * What the lamp is called in the surface's places, if it keeps any. Given one,
   * where the lamp stands is read from there and its light is written from the
   * same subscription — so carrying the lamp about moves every shadow on the
   * desk without rendering the lamp, which is the dearest thing on it to render.
   */
  placeId?: string;
  /** Shared camera for physically elevated artwork; requires lightPosition. */
  camera?: Parameters<typeof projectElevation>[3];
  /** Darkness of shadows this light casts on the desk, from 0 (none) to 1 (strongest). */
  shadowStrength?: number;
  /** Relative brightness of the emitted light pools. */
  intensity?: number;
  tuning?: LightTuning;
  /** Opt in to scene lighting: lamp box placement and bulb elevation in desk units. */
  lightPosition?: { x: number; y: number; width: number; height: number; rotation?: number };
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
export function DeskLamp({ pose: controlledPose, onPoseChange, head: controlledHead, onHeadChange, camera, tuning, intensity = 1, shadowStrength = DEFAULT_SHADOW_STRENGTH, lightPosition, placeId, on = true, onToggle, enamel = 'red', rotation = 0, className = '', style }: DeskLampProps) {
  const id = `lamp-${useId().replace(/:/g, '')}`;
  const [ownArm, setOwnArm] = useState(() => controlledPose ?? articulateLamp(controlledHead ?? DESK_LAMP_SHADE));
  /*
    A pose handed in is an override, not a leash. The composition pushes one in
    when its own settings change the arm, and the lamp keeps its own arm between
    times.

    Held the other way round it was the dearest gesture on the desk: aiming the
    shade told the composition, the composition put it in state, and the whole
    desk re-rendered to hand the lamp back the arm it had just worked out
    itself — every pointer report, for the length of the gesture.
  */
  useEffect(() => { if (controlledPose) setOwnArm(controlledPose); }, [controlledPose]);
  const arm = controlledHead && (controlledHead.x !== ownArm.head.x || controlledHead.y !== ownArm.head.y)
    ? articulateLamp(controlledHead, ownArm, 0) : ownArm;
  const { x, y } = arm.head;
  const { radius } = DESK_LAMP_SHADE;
  const svg = useRef<SVGSVGElement>(null);
  const project = useContext(MovableProject);
  const drag = useRef<{ id: number; px: number; py: number; pointer: LampPoint; head: LampPoint; pose: LampPose; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const turn = (rotation + (lightPosition?.rotation ?? 0)) * Math.PI / 180;
  const changeHead = (next: LampPoint) => {
    const pose = articulateLamp(next, arm);
    setOwnArm(pose);
    onHeadChange?.(pose.head);
    onPoseChange?.(pose);
  };
  const dx = (x - 360) / 720;
  const dy = (y - 300) / 720;
  const elevated = !!(camera && lightPosition);
  /*
    Where the lamp is standing right now. With a place of its own that is the
    store's, which the props have stopped keeping up with on purpose — both the
    elevation of its own artwork and the mapping of the pointer onto the shade
    are worked out from where it actually is, not from where it was last
    rendered.
  */
  const places = usePlaces();
  const standing = () => (placeId && places?.get(placeId)) || lightPosition;

  // Estimated construction heights: base 25 mm, elbow 230 mm, shade 50 mm above the bulb.
  const point = (px: number, py: number, height: number) => {
    if (!camera || !lightPosition) return { x: px, y: py, scale: 1 };
    const unit = lightPosition.width / 720;
    const ox = (px - 360) * unit, oy = (py - 300) * unit;
    const at = standing()!;
    const cx = at.x + 360 * unit, cy = at.y + 300 * unit;
    const world = projectElevation(cx + ox * Math.cos(turn) - oy * Math.sin(turn), cy + ox * Math.sin(turn) + oy * Math.cos(turn), height, camera);
    return { x: 360 + ((world.x - cx) * Math.cos(turn) + (world.y - cy) * Math.sin(turn)) / unit,
      y: 300 + (-(world.x - cx) * Math.sin(turn) + (world.y - cy) * Math.cos(turn)) / unit, scale: world.scale };
  };
  const bulbHeight = lightPosition?.height ?? LAMP_HEIGHT;
  const constructionScale = bulbHeight / LAMP_HEIGHT;
  const base = point(600, 110, mmToUnits(25) * constructionScale);
  const elbow = point(arm.elbow.x, arm.elbow.y, mmToUnits(230) * constructionScale);
  const neck = point(x, y, bulbHeight + mmToUnits(50) * constructionScale);
  const shade = point(x, y, bulbHeight + mmToUnits(50) * constructionScale);
  const rim = point(x, y, bulbHeight);
  const tubeGradient = (from: LampPoint, to: LampPoint, width: number) => {
    const length = Math.hypot(to.x - from.x, to.y - from.y) || 1;
    const nx = -(to.y - from.y) / length * width / 2;
    const ny = (to.x - from.x) / length * width / 2;
    const cx = (from.x + to.x) / 2, cy = (from.y + to.y) / 2;
    return { x1: cx - nx, y1: cy - ny, x2: cx + nx, y2: cy + ny };
  };
  const layer = (p: { x: number; y: number; scale: number }, cx: number, cy: number) => `translate(${p.x} ${p.y}) scale(${p.scale}) translate(${-cx} ${-cy})`;
  /*
    Where the bulb is, worked out from where the lamp stands. Everything but the
    standing comes from the pose, which only changes when the shade is aimed.
  */
  const bulbAt = (at: { x: number; y: number } | undefined) => {
    if (!lightPosition || !at) return null;
    const unit = lightPosition.width / 720;
    const world = (px: number, py: number, height: number, radius: number) => ({
      x: at.x + unit * (360 + (px - 360) * Math.cos(turn) - (py - 300) * Math.sin(turn)),
      y: at.y + unit * (300 + (px - 360) * Math.sin(turn) + (py - 300) * Math.cos(turn)),
      height, radius: radius * unit,
    });
    return {
      x: at.x + lightPosition.width * (0.5 + dx * Math.cos(turn) - dy * Math.sin(turn)),
      y: at.y + lightPosition.width * (300 / 720 + dx * Math.sin(turn) + dy * Math.cos(turn)),
      height: lightPosition.height,
      lamp: { base: world(600, 110, mmToUnits(25) * constructionScale, 110), elbow: world(arm.elbow.x, arm.elbow.y, mmToUnits(230) * constructionScale, 12), neck: world(x, y, bulbHeight + mmToUnits(50) * constructionScale, 11) },
      shadowStrength: Number.isFinite(shadowStrength) ? Math.min(1, Math.max(0, shadowStrength)) : DEFAULT_SHADOW_STRENGTH,
      on: on && intensity > 0,
      intensity,
      tuning,
    };
  };
  /* Without a place of its own the light follows the props, as it always did. */
  useRegisterDeskLight(placeId ? null : bulbAt(lightPosition));
  /*
    And with one, it follows the store instead: on every step of a drag, and
    after every render of the lamp, so aiming the shade moves the light too.
    Kept in a ref so the subscription outlives the renders that change the pose.
  */
  const writeLight = useDeskLightWriter();
  const current = useRef(bulbAt);
  current.current = bulbAt;
  usePlaceEffect(placeId, place => { if (placeId) writeLight(current.current(place)); });
  // Map the pointer back through the surface camera, then through the shade's elevation and rotation.
  const pointer = (clientX: number, clientY: number): LampPoint => {
    if (project && camera && lightPosition) {
      const surface = project(clientX, clientY);
      const unit = lightPosition.width / 720;
      const tilt = (90 - camera.angle) * Math.PI / 180;
      const k = projectElevation(0, 0, bulbHeight + mmToUnits(50) * constructionScale, camera).scale;
      if (k === 0) return { x, y };
      const wx = camera.width / 2 + (surface.x - camera.width / 2) / k;
      const target = camera.targetY ?? camera.surfaceHeight;
      const wy = target + (surface.y - target) / k + (bulbHeight + mmToUnits(50) * constructionScale) * Math.tan(tilt);
      const at = standing()!;
      const ox = wx - at.x - 360 * unit, oy = wy - at.y - 300 * unit;
      return { x: 360 + (ox * Math.cos(turn) + oy * Math.sin(turn)) / unit, y: 300 + (-ox * Math.sin(turn) + oy * Math.cos(turn)) / unit };
    }
    const matrix = svg.current?.getScreenCTM();
    const local = matrix ? new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse()) : { x: clientX, y: clientY };
    return { x: local.x, y: local.y };
  };
  const beginHead = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    suppressClick.current = false;
    drag.current = { id: event.pointerId, px: event.clientX, py: event.clientY, pointer: pointer(event.clientX, event.clientY), head: { x, y }, pose: arm, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveHead = (event: React.PointerEvent<HTMLButtonElement>) => {
    const start = drag.current;
    if (!start || start.id !== event.pointerId) return;
    event.stopPropagation();
    if (!start.moved && Math.hypot(event.clientX - start.px, event.clientY - start.py) < 5) return;
    start.moved = true;
    const at = pointer(event.clientX, event.clientY);
    changeHead({ x: start.head.x + at.x - start.pointer.x, y: start.head.y + at.y - start.pointer.y });
  };
  const endHead = (event: React.PointerEvent<HTMLButtonElement>) => {
    const start = drag.current;
    if (!start || start.id !== event.pointerId) return;
    event.stopPropagation();
    suppressClick.current = start.moved;
    drag.current = null;
    if (event.type === 'pointercancel') { setOwnArm(start.pose); onHeadChange?.(start.pose.head); onPoseChange?.(start.pose); }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return (
    <div className={`desk-lamp ${elevated ? 'desk-lamp--elevated' : ''} ${className}`} data-on={on ? '' : undefined} data-enamel={enamel} style={{ '--desk-lamp-rotation': `${rotation}deg`, ...style } as React.CSSProperties}>
      <svg ref={svg} viewBox="0 0 720 600" aria-hidden="true" focusable="false">
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
          {[
            { name: 'lower-tube', from: base, to: elbow, width: 24 },
            { name: 'upper-tube', from: elbow, to: neck, width: 22 },
          ].map(({ name, from, to, width }) => (
            <linearGradient key={name} id={`${id}-${name}`} gradientUnits="userSpaceOnUse" {...tubeGradient(from, to, width)}>
              <stop offset="0" stopColor="#646a74" />
              <stop offset="0.28" stopColor="#edf0f4" />
              <stop offset="0.44" stopColor="#c9cdd4" />
              <stop offset="0.75" stopColor="#9298a3" />
              <stop offset="1" stopColor="#444a54" />
            </linearGradient>
          ))}
          <radialGradient id={`${id}-base`} cx="0.4" cy="0.35" r="0.7">
            <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
            <stop offset="0.6" stopColor="#fff" stopOpacity="0.02" />
            <stop offset="1" stopColor="#000" stopOpacity="0.5" />
          </radialGradient>
          {/* The spill's own falloff, in place of the blur that used to make it. */}
          <radialGradient id={`${id}-spill`}>
            <stop offset={spillStop(SPILL_CORE - SPILL_BLUR * 2)} stopColor="var(--desk-lamp-spill)" stopOpacity="1" />
            <stop offset={spillStop(SPILL_CORE - SPILL_BLUR)} stopColor="var(--desk-lamp-spill)" stopOpacity="0.86" />
            <stop offset={spillStop(SPILL_CORE)} stopColor="var(--desk-lamp-spill)" stopOpacity="0.5" />
            <stop offset={spillStop(SPILL_CORE + SPILL_BLUR)} stopColor="var(--desk-lamp-spill)" stopOpacity="0.14" />
            <stop offset="1" stopColor="var(--desk-lamp-spill)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* The base, and the arm on its elbow. */}
        <g className="desk-lamp__base" transform={layer(base, 600, 110)}>
          <circle cx="600" cy="110" r="110" />
          <circle cx="600" cy="110" r="110" fill={`url(#${id}-base)`} />
          <circle cx="600" cy="110" r="30" fill={`url(#${id}-arm)`} />
        </g>
        <g className="desk-lamp__arm">
          <path d={`M ${base.x} ${base.y} L ${elbow.x} ${elbow.y}`} stroke={`url(#${id}-lower-tube)`} strokeWidth="24" strokeLinecap="round" />
          <circle cx={elbow.x} cy={elbow.y} r={20 * elbow.scale} fill={`url(#${id}-arm)`} />
          {/* Continue to the central mount beneath the opaque shade. */}
          <path d={`M ${elbow.x} ${elbow.y} L ${neck.x} ${neck.y}`} stroke={`url(#${id}-upper-tube)`} strokeWidth="22" strokeLinecap="round" />
        </g>

        {/* The light spilling round the rim, and the shade over it. */}
        <g transform={layer(rim, x, y)}>
        <circle className="desk-lamp__spill" cx={x} cy={y} r={SPILL_EDGE} fill={`url(#${id}-spill)`} />
        </g>
        {elevated && <g className="desk-lamp__side">
          <circle cx={rim.x} cy={rim.y} r={radius * rim.scale} />
          <path d={`M ${rim.x - radius * rim.scale} ${rim.y} L ${shade.x - radius * shade.scale} ${shade.y} L ${shade.x + radius * shade.scale} ${shade.y} L ${rim.x + radius * rim.scale} ${rim.y} Z`} />
        </g>}
        <g className="desk-lamp__shade" transform={layer(shade, x, y)}>
          <circle cx={x} cy={y} r={radius} />
          <circle cx={x} cy={y} r={radius} fill={`url(#${id}-shade)`} />
          <circle className="desk-lamp__rim" cx={x} cy={y} r={radius - 4} fill="none" strokeWidth="4" />
        </g>
        <g transform={layer(shade, x, y)}>
          <circle className="desk-lamp__cap" cx={x} cy={y} r="22" fill={`url(#${id}-arm)`} />
        </g>
      </svg>
      <span className="desk-lamp__base-handle" aria-hidden="true" style={{ left: `${(base.x - 110 * base.scale) / 720 * 100}%`, top: `${(base.y - 110 * base.scale) / 600 * 100}%`, width: `${220 * base.scale / 720 * 100}%`, height: `${220 * base.scale / 600 * 100}%` }} />
      <button type="button" className="desk-lamp__switch"
        title="Drag to aim the lamp. Click to switch it. Arrow keys move the head."
        onPointerDown={beginHead} onPointerMove={moveHead} onPointerUp={endHead} onPointerCancel={endHead} onLostPointerCapture={endHead}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 30 : 6;
          const offsets: Record<string, LampPoint> = { ArrowLeft: { x: -step, y: 0 }, ArrowRight: { x: step, y: 0 }, ArrowUp: { x: 0, y: -step }, ArrowDown: { x: 0, y: step } };
          const offset = offsets[event.key];
          if (offset) { event.preventDefault(); event.stopPropagation(); changeHead({ x: x + offset.x, y: y + offset.y }); }
        }} aria-label={on ? 'Turn the lamp off' : 'Turn the lamp on'} aria-pressed={on} onClick={(event) => { if (suppressClick.current && event.detail !== 0) { suppressClick.current = false; return; } onToggle?.(!on); }} style={{ left: `${((shade.x - radius * shade.scale) / 720) * 100}%`, top: `${((shade.y - radius * shade.scale) / 600) * 100}%`, width: `${((2 * radius * shade.scale) / 720) * 100}%`, height: `${((2 * radius * shade.scale) / 600) * 100}%` }} />
    </div>
  );
}

export type LampLightProps = {
  on?: boolean;
  /** Handed out so a caller can place the pool by writing to it, rather than by rendering it. */
  ref?: React.Ref<HTMLDivElement>;
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
export function LampLight({ on = true, color = '#ffd9a0', className = '', style, ref }: LampLightProps) {
  return <div ref={ref} className={`lamp-light ${className}`} data-on={on ? '' : undefined} style={{ '--lamp-light-color': color, ...style } as React.CSSProperties} aria-hidden="true" />;
}
