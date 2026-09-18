import { DESK_SIZE, LAMP_WIDTH, LAMP_HEIGHT, mmToUnits } from '../../geometry/physicalScale';
import { useState, type ReactNode } from 'react';
import { Movable, type Place } from '../../behaviors/Movable/Movable';
import { DeskLighting, DEFAULT_SHADOW_STRENGTH } from '../../behaviors/DeskLighting/DeskLighting';
import { Desk } from '../../components/3D/Desk/Desk';
import { DeskLamp } from '../../components/3D/DeskLamp/DeskLamp';
import { GENTLE_DEPTH, GENTLE_VIEW, Perspective, Solid, type Foot } from '../../behaviors/Perspective/Perspective';
import { ROUND_CASE, type StudyCamera, type StudyShape } from '../../behaviors/Perspective/elevation';
import { StudyLighting } from '../../behaviors/Perspective/CastShadow';
import { Relief } from '../../behaviors/Perspective/Relief';
import './DeskObjectStudy.css';

export type DeskObjectStudyProps = {
  name: string;
  widthMm?: number;
  depthRatio?: number;
  heightMm?: number;
  note?: string;
  shapes?: StudyShape[];
  solid?: { height: number; foot: Foot; localCoordinates?: boolean };
  bare?: boolean;
  customRelief?: boolean;
  sideColors?: readonly [string, string, string];
  children?: ReactNode | ((place: Place, camera: StudyCamera) => ReactNode);
};

/** Shared physical-scale inspection bench. Source objects remain interactive; all cast shadows belong to the lamp. */
export function DeskObjectStudy({ name, widthMm = 120, depthRatio = 1, heightMm = 30, note, shapes = [{ path: ROUND_CASE }], solid, bare, customRelief, sideColors, children }: DeskObjectStudyProps) {
  const initialPlace = { x: 150, y: widthMm > 400 ? 650 : 410, rotation: 0 };
  const surfaceHeight = widthMm > 400 ? 1300 : 900;
  const [place, setPlace] = useState<Place>(initialPlace);
  const [lamp, setLamp] = useState({ x: 470, y: 60, rotation: 0 });
  const [on, setOn] = useState(true);
  const [angle, setAngle] = useState(GENTLE_VIEW);
  const [strength, setStrength] = useState(DEFAULT_SHADOW_STRENGTH);
  const [zoom, setZoom] = useState(1);
  const width = mmToUnits(widthMm), depth = width * depthRatio;
  /* A thing with a foot turns about where it stands, the way it does on the desk. */
  const pivotHere = solid ? { x: solid.foot.x, y: solid.foot.y / depthRatio } : { x: 0.5, y: 0.5 };
  const camera = { angle, depth: GENTLE_DEPTH, width: DESK_SIZE.width, surfaceHeight };
  const content = typeof children === 'function' ? children(place, camera) : children;
  return <section className="desk-study">
    <div className="desk-study__controls">
      <strong>{name} · On desk</strong>
      <label>View <input aria-label="View angle" type="range" min="78" max="90" value={angle} onChange={e => setAngle(Number(e.target.value))} /> {angle}°</label>
      <label>Shadow <input aria-label="Shadow strength" type="range" min="0" max="1" step="0.01" value={strength} onChange={e => setStrength(Number(e.target.value))} /></label>
      <label>Zoom <select aria-label="Preview zoom" value={zoom} onChange={e => setZoom(Number(e.target.value))}><option value={1}>1×</option><option value={1.5}>1.5×</option><option value={2}>2×</option></select></label>
      <button onClick={() => { setPlace(initialPlace); setLamp({ x: 470, y: 60, rotation: 0 }); }}>Reset positions</button>
    </div>
    <p>{bare ? 'Move and articulate the lamp to inspect the desktop.' : `${widthMm} mm artwork width · ${heightMm} mm height. ${note ?? 'Height is estimated; shadow uses an approximate solid silhouette.'}`} Drag the object or lamp base; drag the shade to aim and click it to switch.</p>
    <div className="desk-study__viewport"><div style={{ width: `${zoom * 100}%`, minWidth: 720 }}>
      <DeskLighting><Perspective {...camera} className="perspective--lamp-study"><Desk height={surfaceHeight} edge={12}>
        <StudyLighting surfaceHeight={surfaceHeight} place={place} pivot={pivotHere} width={width} depth={depth} shapes={bare ? [] : shapes} heightMm={heightMm} />
        {!bare && <Movable {...place} width={width} pivot={pivotHere} label={name} grab="anywhere" onMove={to => setPlace(at => ({ ...at, ...to }))}>
          {solid ? <Solid {...solid}>{content}</Solid> : customRelief ? content : <Relief sideColors={sideColors} place={place} camera={camera} width={width} depth={depth} heightMm={heightMm} path={shapes[0]?.path ?? ROUND_CASE}>{content}</Relief>}
        </Movable>}
        <Movable {...lamp} width={LAMP_WIDTH} label="Desk lamp" className="perspective__lamp" onMove={to => setLamp(at => ({ ...at, ...to }))}>
          <DeskLamp camera={camera} lightPosition={{ ...lamp, width: LAMP_WIDTH, height: LAMP_HEIGHT }} shadowStrength={strength} on={on} onToggle={setOn} enamel="green" />
        </Movable>
      </Desk></Perspective></DeskLighting>
    </div></div>
  </section>;
}
