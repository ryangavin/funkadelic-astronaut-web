import { createContext, useContext, useId, type ReactNode } from 'react';
import { useRoomSceneGeometry } from '../../../foundations/Room/Room';
import { floorCamera } from '../../../foundations/Room/floorSurface';
import { projectElevation } from '../../../behaviors/Perspective/elevation';
import { mmToUnits } from '../../../geometry/physicalScale';
import './FloorProps.css';

type Point = { x: number; y: number };
/** Lifts a point on the floor, in millimetres from the wall's middle, to a height above it: where it is drawn in the floor's plane. */
type Lift = (x: number, y: number, height: number) => Point & { scale: number };
const FloorLift = createContext<Lift | null>(null);

/**
 * Things standing on the room's floor, beside the desk.
 *
 * It is one drawing in the floor's own plane, in millimetres: x across from
 * the middle of the wall, y out from the wall's foot. Give it to Room as
 * `floorContent`. Everything in it is a box with a real height, lifted through
 * the same eye as the room, so a road case is drawn by where its corners are
 * and not by shading one in.
 */
export function FloorProps({ children }: { children: ReactNode }) {
  const scene = useRoomSceneGeometry();
  if (!scene) return null;
  const { camera, stand } = scene.setup;
  const floor = floorCamera(camera, stand, 1, 0).camera;
  const width = camera.width / 1.2, depth = camera.surfaceHeight / 1.2;
  const lift: Lift = (x, y, height) => {
    const p = projectElevation(camera.width / 2 + mmToUnits(x), mmToUnits(y), mmToUnits(height), floor);
    return { x: (p.x - camera.width / 2) / 1.2, y: p.y / 1.2, scale: p.scale };
  };
  return <svg className="floor-props" viewBox={`${-width / 2} 0 ${width} ${depth}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <FloorLift.Provider value={lift}>{children}</FloorLift.Provider>
  </svg>;
}


export type FloorBoxProps = {
  /** The middle of its footprint, in millimetres from the wall's middle and out from the wall. */
  x: number;
  y: number;
  /** Footprint and height, in millimetres. Width runs across the room before it is turned. */
  width: number;
  depth: number;
  height: number;
  /** How far it is turned, in degrees. */
  rotation?: number;
  /** What it stands on: 0 is the floor, the height of whatever it is stacked on otherwise. */
  base?: number;
  /** The colour of its sides. */
  side?: string;
  /** Its lid, drawn in plan across `width` by `depth` with its origin at the top-left corner. */
  children?: ReactNode;
};

/**
 * A box on the floor, stood up the way a Relief stands a thing on the desk:
 * its outline drawn again and again from the floor to its lid, each copy
 * lifted to its own height through the room's eye, and shaded through the
 * thickness — aluminium valance at the bottom, the case's side up the middle,
 * the lid's extrusion at the top. The copies pile into its sides; the lid is
 * the last and the only one with anything drawn on it.
 */
export function FloorBox({ x, y, width, depth, height, rotation = 0, base = 0, side = '#1d1d1c', children }: FloorBoxProps) {
  const lift = useContext(FloorLift);
  const id = `floor-box-${useId().replace(/:/g, '')}`;
  if (!lift) return null;
  const steps = Math.max(12, Math.min(48, Math.round(height / 14)));
  const at = (h: number) => { const p = lift(x, y, h); return `translate(${p.x} ${p.y}) rotate(${rotation}) scale(${p.scale}) translate(${-width / 2} ${-depth / 2})`; };
  const edge = 30 / height; // how much of the height is the aluminium extrusion at top and bottom
  const shade = (t: number) => t < edge || t > 1 - edge ? `color-mix(in srgb, #b9bcbd ${60 + t * 40}%, #4a4d4f)` : `color-mix(in srgb, ${side} ${55 + t * 45}%, #000)`;
  const outline = (r: number) => <rect width={width} height={depth} rx={r} />;
  return <g className="floor-box">
    <defs><filter id={`${id}-soft`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="30" /></filter></defs>
    {base === 0 && <g transform={at(0)}><rect x={-20} y={-10} width={width + 60} height={depth + 60} className="floor-box__contact" filter={`url(#${id}-soft)`} /></g>}
    {Array.from({ length: steps }, (_, i) => { const t = i / (steps - 1); return <g key={i} transform={at(base + height * t)} fill={shade(t)}>{outline(18)}</g>; })}
    <g transform={at(base + height)}>{children}</g>
  </g>;
}

/**
 * The lid of a flight case, in plan: black ply in an aluminium frame, ball
 * corners, a recessed handle dish at each end, and whatever the crew have
 * stencilled or taped on it.
 */
export function CaseLid({ width, depth, ply = '#1f1f1e', stencil, tape, tapeText }: { width: number; depth: number; ply?: string; stencil?: string; tape?: string; tapeText?: string }) {
  const rim = 26, ball = 42;
  const long = width >= depth;
  return <g>
    <rect width={width} height={depth} fill="#a9adae" />
    <rect x={rim} y={rim} width={width - rim * 2} height={depth - rim * 2} fill={ply} />
    <rect x={rim} y={rim} width={width - rim * 2} height={depth - rim * 2} fill="none" stroke="#000" strokeOpacity=".35" strokeWidth="8" />
    {[[0, 0], [width, 0], [width, depth], [0, depth]].map(([cx, cy], i) => <g key={i}><circle cx={cx} cy={cy} r={ball} fill="#c6c9ca" /><circle cx={cx - 10} cy={cy - 12} r={ball * 0.35} fill="#f1f2f2" opacity=".7" /></g>)}
    {/* Butterfly latches along the lid's long edges. */}
    {(long ? [width * 0.25, width * 0.75] : [depth * 0.25, depth * 0.75]).map(at => long
      ? [8, depth - 58].map(yy => <rect key={`${at}${yy}`} x={at - 45} y={yy} width={90} height={50} rx={10} fill="#d0d3d4" stroke="#6e7274" strokeWidth="5" />)
      : [8, width - 58].map(xx => <rect key={`${at}${xx}`} x={xx} y={at - 45} width={50} height={90} rx={10} fill="#d0d3d4" stroke="#6e7274" strokeWidth="5" />))}
    {stencil && <text x={width / 2} y={depth / 2} textAnchor="middle" dominantBaseline="middle" fontFamily="'Stardos Stencil', 'Courier New', monospace" fontWeight="700" fontSize={Math.min(depth, width) * 0.17} letterSpacing="6" fill="#f2efe6" opacity=".82" transform={long ? undefined : `rotate(-90 ${width / 2} ${depth / 2})`}>{stencil}</text>}
    {tape && <g transform={`rotate(${long ? -4 : 86} ${width * 0.72} ${depth * 0.28})`}>
      <rect x={width * 0.72 - 130} y={depth * 0.28 - 32} width={260} height={64} fill={tape} />
      {tapeText && <text x={width * 0.72} y={depth * 0.28 + 4} textAnchor="middle" dominantBaseline="middle" fontFamily="'Permanent Marker', 'Marker Felt', cursive" fontSize="40" fill="#1b1b1b">{tapeText}</text>}
    </g>}
  </g>;
}

/** A coil of cable on the floor: low enough that its height is nothing, so it is simply drawn where it lies. */
export function CableCoil({ x, y, radius = 230, color = '#1c1c1c', rotation = 0 }: { x: number; y: number; radius?: number; color?: string; rotation?: number }) {
  return <g transform={`translate(${x} ${y}) rotate(${rotation})`}>
    <ellipse cx={20} cy={30} rx={radius + 20} ry={radius + 10} fill="#000" opacity=".22" />
    {Array.from({ length: 7 }, (_, i) => <ellipse key={i} cx={(i % 3) * 8 - 8} cy={(i % 2) * 10 - 5} rx={radius - i * 9} ry={radius - i * 12} fill="none" stroke={color} strokeWidth="22" />)}
    {Array.from({ length: 7 }, (_, i) => <ellipse key={i} cx={(i % 3) * 8 - 10} cy={(i % 2) * 10 - 8} rx={radius - i * 9} ry={radius - i * 12} fill="none" stroke="#fff" strokeOpacity=".12" strokeWidth="5" />)}
    <path d={`M${radius - 20} 0 C${radius + 120} 40 ${radius + 160} 160 ${radius + 320} 190`} fill="none" stroke={color} strokeWidth="22" strokeLinecap="round" />
    <rect x={radius + 300} y={170} width={70} height={46} rx={8} fill="#3d3d3d" transform={`rotate(15 ${radius + 335} 193)`} />
  </g>;
}

/** A roll of gaffer, lying on its side is a thing a roll never does: it lies flat, a ring in plan. */
export function TapeRoll({ x, y, color = '#262626', radius = 55 }: { x: number; y: number; color?: string; radius?: number }) {
  return <g><circle cx={x + 6} cy={y + 8} r={radius + 4} fill="#000" opacity=".25" /><circle cx={x} cy={y} r={radius} fill={color} /><circle cx={x} cy={y} r={radius * 0.62} fill="#b89d74" /><circle cx={x} cy={y} r={radius * 0.5} fill="#2a2520" opacity=".6" /></g>;
}
