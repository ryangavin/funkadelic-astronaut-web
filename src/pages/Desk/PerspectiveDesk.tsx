import { LAMP_WIDTH } from '../../geometry/physicalScale';
import { DeskObjects, DeskObjectShadows, DEFAULT_OBJECT_PLACEMENTS, type ObjectPlacements } from './DeskObjects';
import { articulateLamp, lampPoseAngles } from '../../components/3D/DeskLamp/articulation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { GENTLE_DEPTH, GENTLE_VIEW } from '../../behaviors/Perspective/Perspective';
import { DEFAULT_SHADOW_STRENGTH } from '../../behaviors/DeskLighting/DeskLighting';
import type { Place } from '../../behaviors/Movable/Movable';
import { usePlaceStore } from '../../behaviors/Movable/places';
import type { DeskWood } from '../../components/3D/Desk/Desk';
import type { DeskLampEnamel } from '../../components/3D/DeskLamp/DeskLamp';
import { DESK_DEPTH, ROOM_LAMP, Room, useRoomCamera, type RoomProps } from '../../foundations/Room/Room';
import { ROOM_DESK_SHARE, ROOM_LIP } from '../../foundations/Room/DeskRoom';
import type { FloorWood } from '../../components/3D/Floor/Floor';
import type { WallFinish } from '../../components/3D/Wall/Wall';
import './PerspectiveDesk.css';

export { DESK_DEPTH } from '../../foundations/Room/Room';

export type RoomControls = Pick<RoomProps, 'showPerformance' | 'cameraMode' | 'deskWidthMm' | 'deskDepthMm' | 'deskHeightMm' | 'deskEdgeMm' | 'eyeHeightMm' | 'viewerSetbackMm' | 'headTiltDegrees' | 'horizontalFieldOfViewDegrees' | 'roomSpanMm' | 'floorFrontMm' | 'wallHeightMm' | 'lampIntensity' | 'lightTuning'>;
export type PerspectiveDeskProps = RoomControls & {
  objectPlacements?: ObjectPlacements;
  showObjects?: boolean;
  /** Which things are on the desk, by id. Left out, all of them are. A bench that wants
      one thing on an otherwise bare desk asks for it here, so the thing still gets its
      shadow — which is drawn in the lighting layer rather than by the object itself. */
  only?: readonly string[];
  showSettings?: boolean;
  onCaptureSettings?: (settings: Partial<PerspectiveDeskProps>) => void;
  lampX?: number;
  lampY?: number;
  lampRotation?: number;
  lampWidth?: number;
  lampLowerAngle?: number;
  lampUpperAngle?: number;
  lampEnamel?: DeskLampEnamel;
  onArticulate?: (angles: { lower: number; upper: number }) => void;
  angle?: number;
  depth?: number;
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
  lamp?: boolean;
  shadowStrength?: number;
  onLamp?: (on: boolean) => void;
  onArrange?: (place: Place) => void;
  children?: ReactNode;
};

/*
  A saved arrangement on top of where things start. It is merged a thing at a
  time rather than a map at a time, so an arrangement captured before a thing
  had a size of its own still leaves that thing at the size the composition
  gives it, instead of silently taking it back to life size.
*/
function arranged(saved: ObjectPlacements = {}): ObjectPlacements {
  const all = { ...DEFAULT_OBJECT_PLACEMENTS };
  for (const [id, place] of Object.entries(saved)) all[id] = { ...all[id], ...place };
  return all;
}

/** The things on the desk, drawn through the eye the room is seen from. */
function Objects({ only }: { only?: readonly string[] }) {
  return <DeskObjects camera={useRoomCamera()} only={only} />;
}

function ObjectShadows({ only }: { only?: readonly string[] }) {
  const camera = useRoomCamera();
  return <DeskObjectShadows height={camera.surfaceHeight} surfaceWidth={camera.width} only={only} />;
}

/** The main desk composition: the room, and the promoter's things on the desk in it. */
export function PerspectiveDesk({ objectPlacements = DEFAULT_OBJECT_PLACEMENTS, showObjects = true, only, showSettings = true, onCaptureSettings, lampX, lampY, lampRotation, lampWidth = LAMP_WIDTH, lampLowerAngle, lampUpperAngle, lampEnamel = 'green', onArticulate, angle = GENTLE_VIEW, depth = GENTLE_DEPTH, wood = 'walnut', room = true, floor = 'pine', wall = 'red', roomBlur = 1, roomDim = 0.32, deskShare = ROOM_DESK_SHARE, roomLip = ROOM_LIP, lamp = true, shadowStrength = DEFAULT_SHADOW_STRENGTH, onLamp, onArrange, children, ...roomControls }: PerspectiveDeskProps) {
  /*
    Where everything lies is a store rather than state, and it is this page's
    rather than the room's, because this page is what has things to place and
    what has to read the whole arrangement back when the settings are captured.
    Held as state it was every step of a drag re-rendering the whole desk;
    the room takes the same store and keeps the lamp's place in it.
  */
  const places = usePlaceStore(arranged(objectPlacements));
  /* A saved arrangement arriving from outside puts everything back at once. */
  useEffect(() => { for (const [id, where] of Object.entries(arranged(objectPlacements))) places.set(id, where); }, [places, objectPlacements]);
  /*
    Where the arm actually got to, for capture() to read. The room owns the arm
    while the shade is being aimed and tells us when it has moved, so this is a
    ref rather than state: nothing on the desk has to be drawn again for it.
  */
  const posed = useRef(lampLowerAngle !== undefined && lampUpperAngle !== undefined ? { lower: lampLowerAngle, upper: lampUpperAngle } : lampPoseAngles(articulateLamp({ x: 200, y: 420 })));
  useEffect(() => {
    if (lampLowerAngle === undefined || lampUpperAngle === undefined) return;
    posed.current = { lower: lampLowerAngle, upper: lampUpperAngle };
  }, [lampLowerAngle, lampUpperAngle]);
  const [exported, setExported] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [on, setOn] = useState(lamp);
  useEffect(() => { setOn(lamp); }, [lamp]);

  const capture = () => ({ ...roomControls, angle, depth, wood, room, floor, wall, roomBlur, roomDim, deskShare, roomLip, lamp: on, shadowStrength, lampX: places.get(ROOM_LAMP)?.x, lampY: places.get(ROOM_LAMP)?.y, lampRotation: places.get(ROOM_LAMP)?.rotation, lampWidth, lampEnamel, lampLowerAngle: posed.current.lower, lampUpperAngle: posed.current.upper, objectPlacements: places.all(), showObjects });

  return <main className="perspective-desk-room" aria-label="Perspective desk">
    {showSettings && <aside className="perspective-desk__settings">
      <button onClick={async () => {
        const text = JSON.stringify(capture(), null, 2);
        setExported(text);
        try { await navigator.clipboard.writeText(text); setCopyStatus('Copied desk settings'); }
        catch { setCopyStatus('Select and copy the settings below'); }
      }}>Copy desk settings</button>
      {onCaptureSettings && <button onClick={() => { onCaptureSettings(capture()); setCopyStatus('Controls updated — use Update story to save'); }}>Sync story controls</button>}
      <span role="status">{copyStatus}</span>
      {exported && <details open><summary>Desk settings JSON</summary><textarea aria-label="Desk settings JSON" readOnly value={exported} onFocus={event => event.currentTarget.select()} /><button onClick={() => setExported('')}>Close</button></details>}
    </aside>}
    <Room
      {...roomControls}
      places={places}
      angle={angle}
      depth={depth}
      wood={wood}
      room={room}
      floor={floor}
      wall={wall}
      roomBlur={roomBlur}
      roomDim={roomDim}
      deskShare={deskShare}
      roomLip={roomLip}
      lamp={lamp}
      lampX={lampX}
      lampY={lampY}
      lampRotation={lampRotation}
      lampWidth={lampWidth}
      lampLowerAngle={lampLowerAngle}
      lampUpperAngle={lampUpperAngle}
      lampEnamel={lampEnamel}
      shadowStrength={shadowStrength}
      onLamp={next => { setOn(next); onLamp?.(next); }}
      onArticulate={angles => { posed.current = angles; onArticulate?.(angles); }}
      onArrange={onArrange}
      shadows={showObjects && <ObjectShadows only={only} />}
    >
      {showObjects && <Objects only={only} />}
      {children}
    </Room>
  </main>;
}
