import { roomSurfaceExtents } from '../../geometry/roomCoverage';
import { lightingSetup, type LightTuning } from '../../geometry/lightingSetup';
import { roomSetup, roomFraming, positive, type PhysicalRoomInputs } from '../../geometry/roomSetup';
import { mmToUnits } from '../../geometry/physicalScale';
import { PerformanceOverlay } from '../../debug/PerformanceOverlay/PerformanceOverlay';
import { LAMP_WIDTH, LAMP_HEIGHT } from '../../geometry/physicalScale';
import { articulateLamp, lampPoseFromAngles, lampPoseAngles, type LampPose } from '../../components/3D/DeskLamp/articulation';
import type React from 'react';
import { createContext, memo, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { GENTLE_DEPTH, GENTLE_VIEW, Perspective } from '../../behaviors/Perspective/Perspective';
import { DeskLighting, DEFAULT_SHADOW_STRENGTH } from '../../behaviors/DeskLighting/DeskLighting';
import { Movable, type Place } from '../../behaviors/Movable/Movable';
import { PlacesProvider, usePlaceStore, type PlaceStore } from '../../behaviors/Movable/places';
import { Inspector, InspectorVeil } from '../../behaviors/Inspectable/Inspectable';
import type { StudyCamera } from '../../behaviors/Perspective/elevation';
import { DESK_WIDTH, Desk, type DeskWood } from '../../components/3D/Desk/Desk';
import { DeskLamp, type DeskLampEnamel } from '../../components/3D/DeskLamp/DeskLamp';
import { LampPool, LampShadows } from '../../components/3D/DeskLamp/LampShadows';
import { DeskRoom, ROOM_DESK_DEPTH, ROOM_DESK_SHARE, ROOM_LIP } from './DeskRoom';
import type { FloorWood } from '../../components/3D/Floor/Floor';
import type { WallFinish } from '../../components/3D/Wall/Wall';
import './Room.css';

/** How deep the desk top is, front edge to the wall: the surface everything in here stands on. */
export const DESK_DEPTH = ROOM_DESK_DEPTH;
/** What the lamp is called in the room's places. */
export const ROOM_LAMP = 'lamp';
/** Where the lamp stands until somebody carries it somewhere else. */
export const ROOM_LAMP_PLACE: Place = { x: 770, y: 100, rotation: 0 };

/**
 * The eye this room is seen from, for whatever is standing in it.
 *
 * Everything on the desk that has a height has to raise itself through the same
 * view the desk is drawn in, and the room is what owns that view — so a thing
 * asks for it rather than being handed it down through whoever composed the
 * room. It is held, so asking costs a render only when the eye actually moves.
 */
const RoomCamera = createContext<StudyCamera>({ angle: GENTLE_VIEW, depth: GENTLE_DEPTH, width: DESK_WIDTH, surfaceHeight: DESK_DEPTH });
export const useRoomCamera = () => useContext(RoomCamera);

export type RoomSceneGeometry = { setup: ReturnType<typeof roomSetup>; extents: ReturnType<typeof roomSurfaceExtents> | null; lensFieldOfViewDegrees?: number };
const AcceptedRoom = createContext<RoomSceneGeometry | null>(null);
/** The exact geometry retained by the visible scene, including failed-edit fallback. */
export const useRoomSceneGeometry = () => useContext(AcceptedRoom);

export type RoomProps = PhysicalRoomInputs & {
  /** Physical horizontal lens angle, strictly between 0 and 180 degrees. Omit to preserve deskShare reference framing. */
  horizontalFieldOfViewDegrees?: number;
  /** Tiny screen-aligned animation-frame timing; disabled means no sampling. */
  showPerformance?: boolean;
  /** Relative lamp pool brightness; 1 preserves the original light. No aesthetic maximum. */
  lampIntensity?: number;
  /** Advanced artistic pool/shadow shaping; defaults preserve existing scenes. */
  lightTuning?: Partial<LightTuning>;
  /** Optional exact room extents in mm. Omit to extend each surface to cover the frame. */
  roomSpanMm?: number;
  floorFrontMm?: number;
  wallHeightMm?: number;
  /** How far above the desk the eye is, in degrees. 90 is straight down, the way everything is drawn. */
  angle?: number;
  /** How far the eye is from the desk, in desk units: far away converges gently, near sharply. */
  depth?: number;
  /** The timber the desk top is made of. */
  wood?: DeskWood;
  /** Whether the desk stands in a room at all, or on its own against the page. */
  room?: boolean;
  /** The timber the floor is laid in. */
  floor?: FloorWood;
  /** What the brick behind the desk has been finished in. */
  wall?: WallFinish;
  /** How far out of focus the room is, 0 to 3. 0 is everything sharp; the boards, being further off, go first. */
  roomBlur?: number;
  /** How far the room falls away from the light on the desk, 0 to 1. */
  roomDim?: number;
  /** Reference desk width fraction in physical mode; fitted desk width fraction in legacy mode. */
  deskShare?: number;
  /** How far the frame reaches below the desk's front edge, in desk units: a strip of the boards under it. 0 puts the edge on the frame's bottom. */
  roomLip?: number;
  /** Whether the lamp is on. Clicking its shade switches it. */
  lamp?: boolean;
  lampX?: number;
  lampY?: number;
  lampRotation?: number;
  lampWidth?: number;
  lampLowerAngle?: number;
  lampUpperAngle?: number;
  lampEnamel?: DeskLampEnamel;
  /** How dark the shadows in here are, 0 to 1. */
  shadowStrength?: number;
  onLamp?: (on: boolean) => void;
  onArticulate?: (angles: { lower: number; upper: number }) => void;
  /** Told once when the lamp is put down, with where it has got to. */
  onArrange?: (place: Place) => void;
  /**
   * Where everything in here lies. The room keeps the lamp's place; a
   * composition that has things of its own to place hands in the store they
   * share, so it can read the whole arrangement back at once.
   */
  places?: PlaceStore;
  /**
   * What the things on the desk throw. Shadows are drawn in the lighting layer
   * rather than by the objects themselves, so they stop at the wood's edge
   * along with the lamp's own pool, and so a thing keeps its shadow even when
   * it is the only thing on an otherwise bare desk.
   */
  shadows?: ReactNode;
  /** What is on the desk. Placed in desk units, in the desk's own perspective. */
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

/* Held, so the desk can render round it without rebuilding it. See lightPosition below. */
const SteadyLamp = memo(DeskLamp);

/*
  The pool the lamp throws and the lamp's own cast arm.

  Neither reads the light through a render any more: each subscribes and writes
  its own geometry. This component used to call useDeskLight, so carrying the
  lamp rebuilt the pool and rebuilt every path of the arm's shadow beneath it —
  the last two things on the desk that the lamp still re-rendered.
*/
function DeskLightLayers({ width, depth }: { width: number; depth: number }) {
  return <>
    <LampPool surfaceWidth={width} surfaceHeight={depth} />
    <LampShadows surfaceWidth={width} surfaceHeight={depth} />
  </>;
}

/**
 * A room with a desk in it and a lamp on the desk: the ground every composition
 * in this library stands on.
 *
 * It is one 16 x 9 frame holding three real things. The room is boards
 * underfoot and brick behind, drawn in the desk's own space and seen from the
 * desk's own eye. The desk stands in it by its front edge, at its share of the
 * frame's width, pushed up to the brick. The lamp stands on the desk, and is
 * the light in here: it can be carried about, aimed, and switched off, and
 * every shadow in the room — the desk's on the boards, each thing's on the
 * wood — is thrown from wherever it has got to.
 *
 * Where the eye is is a prop, because the same room is worth looking at from
 * more than one place: straight down at it while something is being drawn,
 * and a little off overhead once it is. Everything else in here is measured
 * from that eye rather than tuned to it.
 *
 * Anything given as children is laid on the desk, in desk units, inside the
 * desk's perspective; what those things throw goes in `shadows`.
 */
/** Invalid numeric edits show a recoverable diagnostic instead of broken CSS. */
export function Room(props: RoomProps) {
  const { cameraMode, deskWidthMm, deskDepthMm, deskHeightMm, deskEdgeMm, eyeHeightMm, viewerSetbackMm, headTiltDegrees, angle, depth } = props;
  const measured = useMemo(() => {
    try {
      const setup = roomSetup({ cameraMode, deskWidthMm, deskDepthMm, deskHeightMm, deskEdgeMm, eyeHeightMm, viewerSetbackMm, headTiltDegrees }, angle ?? GENTLE_VIEW, depth ?? GENTLE_DEPTH);
      return { setup };
    } catch (error) { return { error: error instanceof Error ? error.message : 'Invalid room geometry' }; }
  }, [cameraMode, deskWidthMm, deskDepthMm, deskHeightMm, deskEdgeMm, eyeHeightMm, viewerSetbackMm, headTiltDegrees, angle, depth]);
  const resolved = useMemo(() => {
    if ('error' in measured) return { error: measured.error ?? 'Invalid room geometry' };
    try {
      const setup = measured.setup;
      const tuning = lightingSetup(props.lightTuning);
      for (const [name, value, zero] of [
        ['lampIntensity', props.lampIntensity ?? 1, true], ['lampWidth', props.lampWidth ?? LAMP_WIDTH, false],
        ['roomSpanMm', props.roomSpanMm ?? 2200, false], ['floorFrontMm', props.floorFrontMm ?? 400 / 1.2, true],
        ['wallHeightMm', props.wallHeightMm ?? 2400, false], ['deskShare', props.deskShare ?? ROOM_DESK_SHARE, false],
        ['roomBlur', props.roomBlur ?? 1, true],
      ] as const) positive(name, value, zero);
      for (const [name, value] of [['shadowStrength', props.shadowStrength ?? DEFAULT_SHADOW_STRENGTH], ['roomDim', props.roomDim ?? 0.32]] as const)
        if (!Number.isFinite(value) || value < 0 || value > 1) throw new RangeError(`${name} must be between 0 and 1 (normalized opacity)`);
      if (!Number.isFinite(props.roomLip ?? ROOM_LIP)) throw new RangeError('roomLip must be finite');
      const framing = roomFraming(setup.camera, cameraMode === 'physical', props.deskShare ?? ROOM_DESK_SHARE, props.roomLip ?? ROOM_LIP, props.horizontalFieldOfViewDegrees);
      // Check material allocation before accepting a new scene. Failed edits keep
      // the last valid scene alive, including its object arrangement and lamp.
      const extents = props.room !== false ? roomSurfaceExtents({
        angle: setup.camera.angle, depth: setup.camera.depth,
        deskWidth: setup.camera.width, deskDepth: setup.camera.surfaceHeight, stand: setup.stand,
        ...framing, targetY: setup.camera.targetY, frameAnchor: cameraMode === 'physical' ? .5 : 1,
      }, {
        span: props.roomSpanMm === undefined ? undefined : mmToUnits(props.roomSpanMm),
        front: props.floorFrontMm === undefined ? undefined : mmToUnits(props.floorFrontMm),
        wallHeight: props.wallHeightMm === undefined ? undefined : mmToUnits(props.wallHeightMm),
      }) : null;
      return { setup, tuning, extents };
    } catch (error) { return { error: error instanceof Error ? error.message : 'Invalid room setup' }; }
  }, [measured, props.room, props.lightTuning, props.lampIntensity, props.lampWidth, props.roomSpanMm, props.floorFrontMm, props.wallHeightMm, props.deskShare, props.roomBlur, props.shadowStrength, props.roomDim, props.roomLip, props.horizontalFieldOfViewDegrees]);
  // Numeric fields pass through incomplete values while typing. Keep the last
  // valid scene mounted so editing never discards places, switch state or pose.
  const previous = useRef<RoomSceneGeometry & { props: RoomProps; tuning: LightTuning } | null>(null);
  const error = 'error' in resolved ? resolved.error : undefined;
  if (!('error' in resolved)) previous.current = { props, setup: resolved.setup, tuning: resolved.tuning, extents: resolved.extents };
  const scene = previous.current;
  return <>
    {error && <div className="room__diagnostic" role="alert">Room setup: {error}. {scene ? 'Showing the last valid scene; your arrangement is retained.' : 'Enter valid values to show the scene.'}</div>}
    {scene && <RoomScene {...scene.props} showPerformance={props.showPerformance} setup={scene.setup} tuning={scene.tuning} extents={scene.extents} />}
    {!error && cameraMode === 'physical' && scene && <p className="room__diagnostic" role="status">Physical camera: {scene.setup.camera.angle.toFixed(1)}°; eye clearance {(scene.setup.camera.depth * Math.sin(scene.setup.camera.angle * Math.PI / 180) / 1.2).toFixed(1)} mm. Artwork layers at or above the eye plane are hidden. Objects are 2.5D drawings; low views reveal their limitations.</p>}
  </>;
}

function RoomScene({ setup, extents, tuning, cameraMode, horizontalFieldOfViewDegrees, showPerformance = false, lampIntensity = 1, roomSpanMm, floorFrontMm, wallHeightMm, wood = 'walnut', room = true, floor = 'pine', wall = 'red', roomBlur = 1, roomDim = 0.32, deskShare = ROOM_DESK_SHARE, roomLip = ROOM_LIP, lamp = true, lampX, lampY, lampRotation, lampWidth = LAMP_WIDTH, lampLowerAngle, lampUpperAngle, lampEnamel = 'green', shadowStrength = DEFAULT_SHADOW_STRENGTH, onLamp, onArticulate, onArrange, places: given, shadows, children, className = '', style }: RoomProps & RoomSceneGeometry & { tuning: LightTuning }) {
  const { camera, stand, edge } = setup;
  const framing = roomFraming(camera, cameraMode === 'physical', deskShare, room || cameraMode === 'physical' ? roomLip : 0, horizontalFieldOfViewDegrees);
  const span = roomSpanMm === undefined ? undefined : mmToUnits(roomSpanMm);
  const front = floorFrontMm === undefined ? undefined : mmToUnits(floorFrontMm);
  const wallHeight = wallHeightMm === undefined ? undefined : mmToUnits(wallHeightMm);
  /*
    Where the lamp stands lives in a store, not in this component's state.

    Held here it was state that every step of a drag had to set, so carrying the
    lamp re-rendered the whole desk sixty times a second -- and the lamp is the
    dearest thing on it to render, at some 30ms a drag by the bench's count. Now
    the Movable writes its place straight to the store, the lamp reads the light
    off the same subscription without rendering, and this component hears
    nothing until the lamp is put down.
  */
  const lampAt = { x: lampX ?? ROOM_LAMP_PLACE.x, y: lampY ?? ROOM_LAMP_PLACE.y, rotation: lampRotation ?? 0 };
  /* A room composed into something larger shares that thing's store, so one
     arrangement covers the lamp and everything standing beside it. On its own,
     the room keeps its own, holding the one thing it owns. */
  const own = usePlaceStore({});
  const places = given ?? own;
  /* The lamp has to be in the store before anything reads it, and a shadow
     subscribes in its own layout effect — which runs before this component's.
     Seeded from an effect, the first paint would have a light with nowhere to
     stand. So a store that has not heard of the lamp is told here, once. */
  if (!places.get(ROOM_LAMP)) places.set(ROOM_LAMP, lampAt);
  useEffect(() => { places.set(ROOM_LAMP, { x: lampX ?? ROOM_LAMP_PLACE.x, y: lampY ?? ROOM_LAMP_PLACE.y, rotation: lampRotation ?? 0 }); }, [places, lampX, lampY, lampRotation]);
  /*
    What the arm is doing. This holds only what the composition's own settings
    have asked for; while the shade is being aimed the lamp owns its arm and
    this does not change, so the desk holds still through the gesture.
  */
  const [pose, setPose] = useState(() => lampLowerAngle !== undefined && lampUpperAngle !== undefined ? lampPoseFromAngles(lampLowerAngle, lampUpperAngle) : articulateLamp({ x: 200, y: 420 }));
  useEffect(() => {
    if (lampLowerAngle === undefined || lampUpperAngle === undefined) return;
    setPose(lampPoseFromAngles(lampLowerAngle, lampUpperAngle));
  }, [lampLowerAngle, lampUpperAngle]);
  const [override, setOverride] = useState<{ initial: boolean; on: boolean }>();
  const on = override?.initial === lamp ? override.on : lamp;
  /* Handed to every thing on the desk, which is memoised: a fresh camera each
     render would redraw the whole desk on every step of a drag. */

  /*
    Everything the lamp is handed, held still.

    The bench found the lamp re-rendering forty-nine times and spending 33.7ms
    while a sheet of paper was dragged across the other side of the desk — nine
    tenths of all the React on the desk, for a thing nobody had touched. It was
    not the lamp's fault: it sits in this component's render, so every step of
    every drag rebuilt it, and it was handed a fresh lightPosition and two fresh
    callbacks each time, so there was nothing to memoise against either.
  */
  const lightPosition = useMemo(() => ({ x: ROOM_LAMP_PLACE.x, y: ROOM_LAMP_PLACE.y, rotation: 0, width: lampWidth, height: LAMP_HEIGHT * lampWidth / LAMP_WIDTH }), [lampWidth]);
  const articulated = useCallback((next: LampPose) => { told.current.onArticulate?.(lampPoseAngles(next)); }, []);
  const switched = useCallback((next: boolean) => {
    setOverride({ initial: told.current.lamp, on: next });
    told.current.onLamp?.(next);
  }, []);
  /* The callbacks above must keep their identity, so what they call is read when
     they run rather than captured when they are made. */
  const told = useRef({ onArticulate, onLamp, lamp });
  told.current = { onArticulate, onLamp, lamp };

  const accepted = useMemo(() => ({ setup, extents,
    lensFieldOfViewDegrees: cameraMode === 'physical' ? 2 * Math.atan(camera.width / (2 * camera.depth * framing.deskShare)) * 180 / Math.PI : undefined,
  }), [setup, extents, cameraMode, camera.width, camera.depth, framing.deskShare]);
  return <AcceptedRoom.Provider value={accepted}><PlacesProvider store={places}>
    <RoomCamera.Provider value={camera}>
      {/* The frame: 16 x 9, cropping the room. Told there is a room in it, it
          becomes the container the desk takes its share of the width from. */}
      <Inspector className={`room ${className}`.trim()} data-room={room ? '' : undefined} data-physical={cameraMode === 'physical' ? '' : undefined} style={{ '--room-desk-width': camera.width, '--room-share': framing.deskShare, '--room-lip': framing.lip, '--room-target': camera.targetY ?? camera.surfaceHeight, ...style } as React.CSSProperties}><DeskLighting>
        {room && <DeskRoom targetY={camera.targetY} frameAnchor={cameraMode === 'physical' ? .5 : 1} angle={camera.angle} depth={camera.depth} deskWidth={camera.width} deskDepth={camera.surfaceHeight} stand={stand} span={span} front={front} wallHeight={wallHeight} lip={framing.lip} floor={floor} wall={wall} blur={roomBlur} dim={roomDim} deskShare={framing.deskShare} shadowStrength={shadowStrength} />}
        <div className="room__stand">
          <Perspective {...camera} className="perspective--lamp-study">
            {/* The materials class is what tells the things on it they are being
                seen in the round rather than flat in a plan: no print filter on a
                pen, a lip of light along a moulded case. */}
            <Desk className="desk-study-materials" wood={wood} width={camera.width} height={camera.surfaceHeight} edge={edge}>
              <div className="room__lighting" aria-hidden="true"><DeskLightLayers width={camera.width} depth={camera.surfaceHeight} />{shadows}</div>
              {/* Drawn on the desk itself, so it takes the desk's perspective and pushes everything under it away. */}
              <InspectorVeil />
              {children}
              {/* The lamp's own place is kept in the store so it follows the pointer, and whoever
                  owns it is told once, when it is put down: a composition that writes every
                  step back into its controls re-renders the desk under the drag. */}
              <Movable id={ROOM_LAMP} {...lampAt} width={lampWidth} label="Desk lamp" className="perspective__lamp" onMove={() => {}} onSettle={next => onArrange?.(next)}>
                <SteadyLamp tuning={tuning} intensity={lampIntensity} camera={camera} placeId={ROOM_LAMP} lightPosition={lightPosition} shadowStrength={shadowStrength} on={on} enamel={lampEnamel} pose={pose} onPoseChange={articulated} onToggle={switched} />
              </Movable>
            </Desk>
          </Perspective>
        </div>
      </DeskLighting>
      {showPerformance && <PerformanceOverlay />}
      </Inspector>
    </RoomCamera.Provider>
  </PlacesProvider></AcceptedRoom.Provider>;
}
