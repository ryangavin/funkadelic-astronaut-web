import { DeskObjects, DeskObjectShadows, DEFAULT_OBJECT_PLACEMENTS, type ObjectPlacements } from './DeskObjects';
import { articulateLamp, lampPoseFromAngles, lampPoseAngles } from '../../components/3D/DeskLamp/articulation';
import type React from 'react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { GENTLE_DEPTH, GENTLE_VIEW, Perspective } from '../../behaviors/Perspective/Perspective';
import { DeskLighting, DEFAULT_SHADOW_STRENGTH, useDeskLight } from '../../behaviors/DeskLighting/DeskLighting';
import { Movable, type Place } from '../../behaviors/Movable/Movable';
import { Inspector, InspectorVeil } from '../../behaviors/Inspectable/Inspectable';
import { DESK_WIDTH, Desk, type DeskWood } from '../../components/3D/Desk/Desk';
import { DeskLamp, LampLight, type DeskLampEnamel } from '../../components/3D/DeskLamp/DeskLamp';
import { LampShadows } from '../../components/3D/DeskLamp/LampShadows';
import { DeskRoom, ROOM_DESK_DEPTH, ROOM_DESK_SHARE, ROOM_LIP } from './DeskRoom';
import type { FloorWood } from '../../components/3D/Floor/Floor';
import type { WallFinish } from '../../components/3D/Wall/Wall';
import './PerspectiveDesk.css';

export const DESK_DEPTH = ROOM_DESK_DEPTH;
const INITIAL_LAMP: Place = { x: 770, y: 100, rotation: 0 };

export type PerspectiveDeskProps = {
  objectPlacements?: ObjectPlacements;
  showObjects?: boolean;
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
  /** How much of the frame's width the desk itself takes, 0 to 1. The rest is room. */
  deskShare?: number;
  /** How far the frame reaches below the desk's front edge, in desk units: a strip of the boards under it. 0 puts the edge on the frame's bottom. */
  roomLip?: number;
  lamp?: boolean;
  shadowStrength?: number;
  onLamp?: (on: boolean) => void;
  onArrange?: (place: Place) => void;
  children?: ReactNode;
};

function DeskLightLayers() {
  const light = useDeskLight();
  if (!light) return null;
  const size = light.height * 1.4;
  return <>
    <LampLight on={light.on} style={{ position: 'absolute', width: `${size / DESK_WIDTH * 100}%`, aspectRatio: '1', left: `${(light.x - size / 2) / DESK_WIDTH * 100}%`, top: `${(light.y - size / 2) / DESK_DEPTH * 100}%` }} />
    <LampShadows surfaceHeight={DESK_DEPTH} />
  </>;
}

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

/** The main desk composition, starting with its surface and working lamp. */
export function PerspectiveDesk({ objectPlacements = DEFAULT_OBJECT_PLACEMENTS, showObjects = true, showSettings = true, onCaptureSettings, lampX, lampY, lampRotation, lampWidth = 576, lampLowerAngle, lampUpperAngle, lampEnamel = 'green', onArticulate, angle = GENTLE_VIEW, depth = GENTLE_DEPTH, wood = 'walnut', room = true, floor = 'pine', wall = 'red', roomBlur = 1, roomDim = 0.32, deskShare = ROOM_DESK_SHARE, roomLip = ROOM_LIP, lamp = true, shadowStrength = DEFAULT_SHADOW_STRENGTH, onLamp, onArrange, children }: PerspectiveDeskProps) {
  const [place, setPlace] = useState({ x: lampX ?? INITIAL_LAMP.x, y: lampY ?? INITIAL_LAMP.y, rotation: lampRotation ?? 0 });
  useEffect(() => { setPlace({ x: lampX ?? INITIAL_LAMP.x, y: lampY ?? INITIAL_LAMP.y, rotation: lampRotation ?? 0 }); }, [lampX, lampY, lampRotation]);
  const [pose, setPose] = useState(() => lampLowerAngle !== undefined && lampUpperAngle !== undefined ? lampPoseFromAngles(lampLowerAngle, lampUpperAngle) : articulateLamp({ x: 200, y: 420 }));
  useEffect(() => {
    if (lampLowerAngle !== undefined && lampUpperAngle !== undefined) setPose(lampPoseFromAngles(lampLowerAngle, lampUpperAngle));
  }, [lampLowerAngle, lampUpperAngle]);
  const [placements, setPlacements] = useState(() => arranged(objectPlacements));
  useEffect(() => setPlacements(arranged(objectPlacements)), [objectPlacements]);
  const [exported, setExported] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [override, setOverride] = useState<{ initial: boolean; on: boolean }>();
  const on = override?.initial === lamp ? override.on : lamp;
  /* Handed to every thing on the desk, which is memoised: a fresh camera each
     render would redraw the whole desk on every step of a drag. */
  const camera = useMemo(() => ({ angle, depth, width: DESK_WIDTH, surfaceHeight: DESK_DEPTH }), [angle, depth]);
  const capture = () => {
    const angles = lampPoseAngles(pose);
    return { angle, depth, wood, room, floor, wall, roomBlur, roomDim, deskShare, roomLip, lamp: on, shadowStrength, lampX: place.x, lampY: place.y, lampRotation: place.rotation, lampWidth, lampEnamel, lampLowerAngle: angles.lower, lampUpperAngle: angles.upper, objectPlacements: placements, showObjects };
  };
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
    <Inspector className="perspective-desk__frame" data-room={room ? '' : undefined} style={{ '--perspective-desk-share': deskShare, '--perspective-desk-lip': room ? roomLip : 0 } as React.CSSProperties}><DeskLighting>
      {room && <DeskRoom angle={angle} depth={depth} deskDepth={DESK_DEPTH} lip={roomLip} floor={floor} wall={wall} blur={roomBlur} dim={roomDim} deskShare={deskShare} shadowStrength={shadowStrength} />}
      <div className="perspective-desk__stand">
      <Perspective {...camera} className="perspective--lamp-study">
        <Desk className="desk-study-materials" wood={wood} height={DESK_DEPTH} edge={12}>
          <div className="perspective-desk__lighting" aria-hidden="true"><DeskLightLayers />{showObjects && <DeskObjectShadows placements={placements} height={DESK_DEPTH} />}</div>
          {/* Drawn on the desk itself, so it takes the desk's perspective and pushes everything under it away. */}
          <InspectorVeil />
          {showObjects && <DeskObjects placements={placements} camera={camera} onMove={(id, next) => setPlacements(current => ({ ...current, [id]: next }))} />}
          {children}
          {/* The lamp's own place is kept here so it follows the pointer, and whoever
              owns it is told once, when it is put down: a story that writes every
              step back into its controls re-renders the desk under the drag. */}
          <Movable {...place} width={lampWidth} label="Desk lamp" className="perspective__lamp" onMove={next => setPlace(current => ({ ...current, ...next }))} onSettle={next => onArrange?.(next)}>
            <DeskLamp camera={camera} lightPosition={{ ...place, width: lampWidth, height: 700 * lampWidth / 960 }} shadowStrength={shadowStrength} on={on} enamel={lampEnamel} pose={pose} onPoseChange={next => { setPose(next); onArticulate?.(lampPoseAngles(next)); }} onToggle={next => {
              setOverride({ initial: lamp, on: next });
              onLamp?.(next);
            }} />
          </Movable>
        </Desk>
      </Perspective>
    </div>
    </DeskLighting></Inspector>
  </main>;
}
