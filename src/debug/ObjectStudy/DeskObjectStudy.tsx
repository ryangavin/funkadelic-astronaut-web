import { mmToUnits } from '../../geometry/physicalScale';
import { useState, type ReactNode } from 'react';
import { Movable, type Place } from '../../behaviors/Movable/Movable';
import { DEFAULT_SHADOW_STRENGTH } from '../../behaviors/DeskLighting/DeskLighting';
import { usePlace, usePlaceStore } from '../../behaviors/Movable/places';
import { Room, ROOM_LAMP, useRoomCamera } from '../../foundations/Room/Room';
import { GENTLE_VIEW, Solid, type Foot } from '../../behaviors/Perspective/Perspective';
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

const OBJECT = 'study-object';
const LAMP_PLACE: Place = { x: 470, y: 60, rotation: 0 };
const DEFAULT_SHAPES: StudyShape[] = [{ path: ROUND_CASE }];

/** Only drawings whose markup depends on position subscribe through React. */
function PositionedContent({ initialPlace, children }: { initialPlace: Place; children: (place: Place, camera: StudyCamera) => ReactNode }) {
  const place = usePlace(OBJECT) ?? initialPlace;
  return children(place, useRoomCamera());
}

/** Solid measures its screen-space foot after a move; keep that render local. */
function PositionedSolid({ solid, children }: { solid: NonNullable<DeskObjectStudyProps['solid']>; children: ReactNode }) {
  usePlace(OBJECT);
  return <Solid {...solid}>{children}</Solid>;
}

function StudyObject({ initialPlace, width, depth, pivot, solid, customRelief, sideColors, heightMm, shapes, name, children }: DeskObjectStudyProps & {
  initialPlace: Place; width: number; depth: number; pivot: Foot; heightMm: number; shapes: StudyShape[];
}) {
  const camera = useRoomCamera();
  const content = typeof children === 'function' ? <PositionedContent initialPlace={initialPlace}>{children}</PositionedContent> : children;
  return <Movable id={OBJECT} {...initialPlace} width={width} pivot={pivot} label={name} grab="anywhere">
    {solid ? <PositionedSolid solid={solid}>{content}</PositionedSolid> : customRelief ? content : <Relief sideColors={sideColors} place={initialPlace} placeId={OBJECT} camera={camera} width={width} depth={depth} heightMm={heightMm} path={shapes[0]?.path ?? ROUND_CASE}>{content}</Relief>}
  </Movable>;
}

function StudyShadow({ initialPlace, width, depth, pivot, shapes, heightMm }: { initialPlace: Place; width: number; depth: number; pivot: Foot; shapes: StudyShape[]; heightMm: number }) {
  const camera = useRoomCamera();
  return <StudyLighting shadowOnly surfaceHeight={camera.surfaceHeight} place={initialPlace} placeId={OBJECT} pivot={pivot} width={width} depth={depth} shapes={shapes} heightMm={heightMm} />;
}

/** An inspection composition on the shared Room's fixed physical desktop. */
export function DeskObjectStudy({ name, widthMm = 120, depthRatio = 1, heightMm = 30, note, shapes = DEFAULT_SHAPES, solid, bare, customRelief, sideColors, children }: DeskObjectStudyProps) {
  const initialPlace = { x: 150, y: widthMm > 400 ? 650 : 410, rotation: 0 };
  const places = usePlaceStore({ [OBJECT]: initialPlace, [ROOM_LAMP]: LAMP_PLACE });
  const [angle, setAngle] = useState(GENTLE_VIEW);
  const [strength, setStrength] = useState(DEFAULT_SHADOW_STRENGTH);
  const [zoom, setZoom] = useState(1);
  const width = mmToUnits(widthMm), depth = width * depthRatio;
  /* Keep the object's rotation and its shadow hinged at the same physical foot. */
  const pivotHere = solid ? { x: solid.foot.x, y: solid.foot.y / depthRatio } : { x: 0.5, y: 0.5 };
  return <section className="desk-study">
    <div className="desk-study__controls">
      <strong>{name} · On desk</strong>
      <label>View <input aria-label="View angle" type="range" min="78" max="90" value={angle} onChange={e => setAngle(Number(e.target.value))} /> {angle}°</label>
      <label>Shadow <input aria-label="Shadow strength" type="range" min="0" max="1" step="0.01" value={strength} onChange={e => setStrength(Number(e.target.value))} /></label>
      <label>Zoom <select aria-label="Preview zoom" value={zoom} onChange={e => setZoom(Number(e.target.value))}><option value={1}>1×</option><option value={1.5}>1.5×</option><option value={2}>2×</option></select></label>
      <button onClick={() => { places.reset({ [OBJECT]: initialPlace, [ROOM_LAMP]: LAMP_PLACE }); }}>Reset positions</button>
    </div>
    <p>{bare ? 'Move and articulate the lamp to inspect the desktop.' : `${widthMm} mm artwork width · ${heightMm} mm height. ${note ?? 'Height is estimated; shadow uses an approximate solid silhouette.'}`} Drag the object or lamp base; drag the shade to aim and click it to switch.</p>
    <div className="desk-study__viewport"><div style={{ width: `${zoom * 100}%`, minWidth: 720 }}>
      <Room places={places} angle={angle} shadowStrength={strength} lampX={LAMP_PLACE.x} lampY={LAMP_PLACE.y}
        shadows={!bare && <StudyShadow initialPlace={initialPlace} width={width} depth={depth} pivot={pivotHere} shapes={shapes} heightMm={heightMm} />}>
        {!bare && <StudyObject name={name} initialPlace={initialPlace} width={width} depth={depth} pivot={pivotHere} solid={solid} customRelief={customRelief} sideColors={sideColors} heightMm={heightMm} shapes={shapes}>{children}</StudyObject>}
      </Room>
    </div></div>
  </section>;
}
