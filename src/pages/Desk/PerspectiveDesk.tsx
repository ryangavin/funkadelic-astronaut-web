import { DeskObjects, DeskObjectShadows, DEFAULT_OBJECT_PLACEMENTS, type ObjectPlacements } from './DeskObjects';
import { articulateLamp, lampPoseFromAngles, lampPoseAngles } from '../../components/3D/DeskLamp/articulation';
import { useEffect, useState, type ReactNode } from 'react';
import { GENTLE_DEPTH, GENTLE_VIEW, Perspective } from '../../behaviors/Perspective/Perspective';
import { DeskLighting, DEFAULT_SHADOW_STRENGTH, useDeskLight } from '../../behaviors/DeskLighting/DeskLighting';
import { Movable, type Place } from '../../behaviors/Movable/Movable';
import { DESK_WIDTH, Desk, type DeskWood } from '../../components/3D/Desk/Desk';
import { DeskLamp, LampLight, type DeskLampEnamel } from '../../components/3D/DeskLamp/DeskLamp';
import { LampShadows } from '../../components/3D/DeskLamp/LampShadows';
import './PerspectiveDesk.css';

export const DESK_DEPTH = 810;
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

/** The main desk composition, starting with its surface and working lamp. */
export function PerspectiveDesk({ objectPlacements = DEFAULT_OBJECT_PLACEMENTS, showObjects = true, showSettings = true, onCaptureSettings, lampX, lampY, lampRotation, lampWidth = 576, lampLowerAngle, lampUpperAngle, lampEnamel = 'green', onArticulate, angle = GENTLE_VIEW, depth = GENTLE_DEPTH, wood = 'walnut', lamp = true, shadowStrength = DEFAULT_SHADOW_STRENGTH, onLamp, onArrange, children }: PerspectiveDeskProps) {
  const [place, setPlace] = useState({ x: lampX ?? INITIAL_LAMP.x, y: lampY ?? INITIAL_LAMP.y, rotation: lampRotation ?? 0 });
  useEffect(() => { setPlace({ x: lampX ?? INITIAL_LAMP.x, y: lampY ?? INITIAL_LAMP.y, rotation: lampRotation ?? 0 }); }, [lampX, lampY, lampRotation]);
  const [pose, setPose] = useState(() => lampLowerAngle !== undefined && lampUpperAngle !== undefined ? lampPoseFromAngles(lampLowerAngle, lampUpperAngle) : articulateLamp({ x: 200, y: 420 }));
  useEffect(() => {
    if (lampLowerAngle !== undefined && lampUpperAngle !== undefined) setPose(lampPoseFromAngles(lampLowerAngle, lampUpperAngle));
  }, [lampLowerAngle, lampUpperAngle]);
  const [placements, setPlacements] = useState({ ...DEFAULT_OBJECT_PLACEMENTS, ...objectPlacements });
  useEffect(() => setPlacements({ ...DEFAULT_OBJECT_PLACEMENTS, ...objectPlacements }), [objectPlacements]);
  const [exported, setExported] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [override, setOverride] = useState<{ initial: boolean; on: boolean }>();
  const on = override?.initial === lamp ? override.on : lamp;
  const camera = { angle, depth, width: DESK_WIDTH, surfaceHeight: DESK_DEPTH };
  const capture = () => {
    const angles = lampPoseAngles(pose);
    return { angle, depth, wood, lamp: on, shadowStrength, lampX: place.x, lampY: place.y, lampRotation: place.rotation, lampWidth, lampEnamel, lampLowerAngle: angles.lower, lampUpperAngle: angles.upper, objectPlacements: placements, showObjects };
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
    <div className="perspective-desk__frame"><DeskLighting>
      <Perspective {...camera} className="perspective--lamp-study">
        <Desk className="desk-study-materials" wood={wood} height={DESK_DEPTH} edge={12}>
          <div className="perspective-desk__lighting" aria-hidden="true"><DeskLightLayers />{showObjects && <DeskObjectShadows placements={placements} height={DESK_DEPTH} />}</div>
          {showObjects && <DeskObjects placements={placements} camera={camera} onMove={(id, next) => setPlacements(current => ({ ...current, [id]: next }))} />}
          {children}
          <Movable {...place} width={lampWidth} label="Desk lamp" className="perspective__lamp" onMove={next => {
            const moved = { ...place, ...next };
            setPlace(moved);
            onArrange?.(moved);
          }}>
            <DeskLamp camera={camera} lightPosition={{ ...place, width: lampWidth, height: 700 * lampWidth / 960 }} shadowStrength={shadowStrength} on={on} enamel={lampEnamel} pose={pose} onPoseChange={next => { setPose(next); onArticulate?.(lampPoseAngles(next)); }} onToggle={next => {
              setOverride({ initial: lamp, on: next });
              onLamp?.(next);
            }} />
          </Movable>
        </Desk>
      </Perspective>
    </DeskLighting></div>
  </main>;
}
