import { useId, useState, type ReactNode } from 'react';
import { Movable, type Place } from '../Movable/Movable';
import { DeskLighting, DEFAULT_SHADOW_STRENGTH, useDeskLight } from '../DeskLighting/DeskLighting';
import { Desk } from '../../components/3D/Desk/Desk';
import { DeskLamp, LampLight } from '../../components/3D/DeskLamp/DeskLamp';
import { LampShadows } from '../../components/3D/DeskLamp/LampShadows';
import { MugShadow } from '../../components/3D/Mug/MugShadow';
import { GENTLE_DEPTH, GENTLE_VIEW, Perspective, Solid, type Foot } from './Perspective';
import { elevatedLayer } from './elevation';
import './DeskObjectStudy.css';

export type StudyCamera = Parameters<typeof elevatedLayer>[2];
export type StudyShape = { path: string; heightMm?: number };
export const ROUND_CASE = 'M8 0H92Q100 0 100 8V92Q100 100 92 100H8Q0 100 0 92V8Q0 0 8 0Z';
export type DeskObjectStudyProps = {
  name: string;
  widthMm?: number;
  depthRatio?: number;
  heightMm?: number;
  note?: string;
  shapes?: StudyShape[];
  solid?: { height: number; foot: Foot };
  mug?: boolean;
  bare?: boolean;
  customRelief?: boolean;
  sideColors?: readonly [string, string, string];
  children?: ReactNode | ((place: Place, camera: StudyCamera) => ReactNode);
};

/** One scene-owned silhouette, composited once so overlapping layers never darken each other. */
function StudyLighting({ place, width, depth, shapes, heightMm, mug, surfaceHeight }: { surfaceHeight: number; place: Place; width: number; depth: number; shapes: StudyShape[]; heightMm: number; mug?: boolean }) {
  const light = useDeskLight();
  const id = `study-shadow-${useId().replace(/:/g, '')}`;
  if (!light) return null;
  const cx = place.x + width / 2, cy = place.y + depth / 2;
  const turn = (place.rotation ?? 0) * Math.PI / 180;
  const pool = light.height * 1.4;
  const local = `translate(${cx} ${cy}) rotate(${place.rotation ?? 0}) translate(${-width / 2} ${-depth / 2}) scale(${width / 100} ${depth / 100})`;
  const intensity = light.on ? (light.shadowStrength ?? DEFAULT_SHADOW_STRENGTH) / (1 + (Math.hypot(cx - light.x, cy - light.y) / 1000) ** 2) : 0;
  return <>
    <LampLight on={light.on} style={{ position: 'absolute', width: `${pool / 1440 * 100}%`, aspectRatio: '1', left: `${(light.x - pool / 2) / 1440 * 100}%`, top: `${(light.y - pool / 2) / surfaceHeight * 100}%` }} />
    <LampShadows surfaceHeight={surfaceHeight} />
    {mug ? <MugShadow x={cx - width / 15 * Math.cos(turn)} y={cy - width / 15 * Math.sin(turn)} width={width} rotation={place.rotation ?? 0} light={light} deskHeight={surfaceHeight} /> :
      <svg className="desk-study__shadow" viewBox={`0 0 1440 ${surfaceHeight}`} aria-hidden="true">
        <defs><filter id={id} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="5" /></filter></defs>
        <g className="desk-study__cast" opacity={intensity}>
          <g fill="#140c06" filter={`url(#${id})`}>
            {shapes.flatMap((shape, shapeIndex) => Array.from({ length: 16 }, (_, index) => {
              const height = 2 * (shape.heightMm ?? heightMm) * index / 15;
              const scale = Math.min(4, light.height / Math.max(1, light.height - height));
              return <g key={`${shapeIndex}-${index}`} transform={`translate(${light.x} ${light.y}) scale(${scale}) translate(${-light.x} ${-light.y})`}><path d={shape.path} transform={local} /></g>;
            }))}
          </g>
        </g>
      </svg>}
  </>;
}

function Relief({ children, place, camera, width, depth, heightMm, path, sideColors }: { sideColors?: readonly [string, string, string]; children: ReactNode; place: Place; camera: StudyCamera; width: number; depth: number; heightMm: number; path: string }) {
  // Shade through the physical thickness, not across the full artwork footprint.
  // Match the shell at the top, then blend smoothly into its underside.
  const steps = sideColors ? 33 : 9;
  const sideFill = (height: number) => {
    if (!sideColors) return '#33302d';
    const low = height < 0.5 ? sideColors[2] : sideColors[1];
    const high = height < 0.5 ? sideColors[1] : sideColors[0];
    const progress = height < 0.5 ? height * 2 : (height - 0.5) * 2;
    const blend = progress * progress * (3 - 2 * progress);
    return `color-mix(in srgb, ${high} ${blend * 100}%, ${low})`;
  };
  const layer = (fraction: number) => {
    const at = elevatedLayer(heightMm * 2 * fraction, { ...place, width, drawingWidth: 100, drawingHeight: depth / width * 100 }, camera);
    return `translate(${at.x} ${at.y / (depth / width)}) translate(50 50) scale(${at.scale}) translate(-50 -50)`;
  };
  const top = elevatedLayer(heightMm * 2, { ...place, width, drawingWidth: 100, drawingHeight: depth / width * 100 }, camera);
  return <div className="desk-study__relief" style={{ aspectRatio: `${width} / ${depth}` }}>
    <svg className="desk-study__sides" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {Array.from({ length: steps }, (_, i) => <path key={i} d={path} transform={layer(i / (steps - 1))} fill={sideFill(i / (steps - 1))} />)}
    </svg>
    <div className="desk-study__face" style={{ transform: `translate(${top.x}%, ${top.y / (depth / width)}%) scale(${top.scale})` }}>{children}</div>
  </div>;
}

/** Shared physical-scale inspection bench. Source objects remain interactive; all cast shadows belong to the lamp. */
export function DeskObjectStudy({ name, widthMm = 120, depthRatio = 1, heightMm = 30, note, shapes = [{ path: ROUND_CASE }], solid, mug, bare, customRelief, sideColors, children }: DeskObjectStudyProps) {
  const initialPlace = { x: 150, y: widthMm > 400 ? 650 : 410, rotation: 0 };
  const surfaceHeight = widthMm > 400 ? 1300 : 900;
  const [place, setPlace] = useState<Place>(initialPlace);
  const [lamp, setLamp] = useState({ x: 470, y: 60, rotation: 0 });
  const [on, setOn] = useState(true);
  const [angle, setAngle] = useState(GENTLE_VIEW);
  const [strength, setStrength] = useState(DEFAULT_SHADOW_STRENGTH);
  const [zoom, setZoom] = useState(1);
  const width = widthMm * 2, depth = width * depthRatio;
  const camera = { angle, depth: GENTLE_DEPTH, width: 1440, surfaceHeight };
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
        <StudyLighting surfaceHeight={surfaceHeight} place={place} width={width} depth={depth} shapes={bare ? [] : shapes} heightMm={heightMm} mug={mug} />
        {!bare && <Movable {...place} width={width} label={name} grab="anywhere" onMove={to => setPlace(at => ({ ...at, ...to }))}>
          {solid ? <Solid {...solid}>{content}</Solid> : customRelief ? content : <Relief sideColors={sideColors} place={place} camera={camera} width={width} depth={depth} heightMm={heightMm} path={shapes[0]?.path ?? ROUND_CASE}>{content}</Relief>}
        </Movable>}
        <Movable {...lamp} width={960} label="Desk lamp" className="perspective__lamp" onMove={to => setLamp(at => ({ ...at, ...to }))}>
          <DeskLamp camera={camera} lightPosition={{ ...lamp, width: 960, height: 700 }} shadowStrength={strength} on={on} onToggle={setOn} enamel="green" />
        </Movable>
      </Desk></Perspective></DeskLighting>
    </div></div>
  </section>;
}
