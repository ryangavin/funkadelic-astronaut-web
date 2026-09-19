import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { useRegisterDeskLight } from '../../../behaviors/DeskLighting/DeskLighting';
import { projectElevation, type StudyCamera } from '../../../behaviors/Perspective/elevation';
import type { LightTuning } from '../../../geometry/lightingSetup';
import { mmToUnits } from '../../../geometry/physicalScale';
import { ARM_LIMITS, SINGLE_ARM_MM, clampArm, singleArmGeometry, wrapShade, type LampPoint3 } from './geometry';
import './SingleArmLamp.css';

export type SingleArmLampProps = {
  /** Prop changes reset the local hinge; interactions report the resulting angle. */
  armAngle?: number;
  onArmAngleChange?: (angle: number) => void;
  shadeAngle?: number;
  onShadeAngleChange?: (angle: number) => void;
  on?: boolean;
  onToggle?: (on: boolean) => void;
  /** Artwork corner in desk units; render at width 720 units for physical scale. */
  place?: { x: number; y: number };
  camera?: StudyCamera;
  intensity?: number;
  tuning?: LightTuning;
};

/** One 350 mm arm with a base hinge and a swivelling shade. No hidden elbow. */
export function SingleArmLamp({ armAngle = 60, shadeAngle = 0, on = true, onArmAngleChange, onShadeAngleChange, onToggle, place, camera, intensity = 1, tuning }: SingleArmLampProps) {
  const id = `single-lamp-${useId().replace(/:/g, '')}`;
  const [arm, setArm] = useState(() => clampArm(armAngle));
  const [swivel, setSwivel] = useState(() => wrapShade(shadeAngle));
  const [lit, setLit] = useState(on);
  useEffect(() => setArm(clampArm(armAngle)), [armAngle]);
  useEffect(() => setSwivel(wrapShade(shadeAngle)), [shadeAngle]);
  useEffect(() => setLit(on), [on]);
  const geometry = singleArmGeometry(arm, swivel);
  const point = (p: LampPoint3) => {
    if (!camera || !place) return { ...p, scale: 1 };
    const projected = projectElevation(place.x + p.x, place.y + p.y, p.height, camera);
    return { x: projected.x - place.x, y: projected.y - place.y, scale: projected.scale };
  };
  const base = point(geometry.base), neck = point(geometry.neck), rim = point(geometry.bulb), shade = point({ ...geometry.bulb, height: geometry.bulb.height + mmToUnits(50) });
  const rig = useMemo(() => place ? {
    base: { x: place.x + geometry.base.x, y: place.y + geometry.base.y, height: geometry.base.height, radius: mmToUnits(SINGLE_ARM_MM.baseRadius) },
    elbow: { x: place.x + geometry.base.x, y: place.y + geometry.base.y, height: geometry.base.height, radius: 8 },
    neck: { x: place.x + geometry.neck.x, y: place.y + geometry.neck.y, height: geometry.neck.height, radius: 8 },
  } : undefined, [place?.x, place?.y, arm]);
  useRegisterDeskLight(place ? { lamp: rig, x: place.x + geometry.bulb.x, y: place.y + geometry.bulb.y, height: geometry.bulb.height, on: lit && intensity > 0, intensity, tuning } : null);
  const change = (part: 'arm' | 'shade', value: number) => {
    if (part === 'arm') { const next = clampArm(value); setArm(next); onArmAngleChange?.(next); }
    else { const next = wrapShade(value); setSwivel(next); onShadeAngleChange?.(next); }
  };
  const drag = useRef<{ id: number; part: 'arm' | 'shade'; x: number; y: number; value: number } | null>(null);
  const begin = (part: 'arm' | 'shade', event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.stopPropagation(); event.preventDefault(); event.currentTarget.focus();
    drag.current = { id: event.pointerId, part, x: event.clientX, y: event.clientY, value: part === 'arm' ? arm : swivel };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    const start = drag.current;
    if (!start || event.pointerId !== start.id) return;
    change(start.part, start.value + (start.part === 'arm' ? start.y - event.clientY : event.clientX - start.x) / 2);
  };
  const end = () => { drag.current = null; };
  const key = (part: 'arm' | 'shade', event: KeyboardEvent<HTMLButtonElement>) => {
    const steps: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 };
    if (event.key === 'Home') { event.preventDefault(); change(part, part === 'arm' ? 60 : 0); }
    else if (event.key in steps) { event.preventDefault(); event.stopPropagation(); change(part, (part === 'arm' ? arm : swivel) + steps[event.key] * (event.shiftKey ? 10 : 2)); }
  };
  const controlStyle = (p: typeof base): CSSProperties => ({ left: `${p.x / 720 * 100}%`, top: `${p.y / 600 * 100}%`, visibility: p.scale ? 'visible' : 'hidden' });
  const visibleArm = base.scale > 0 && neck.scale > 0;
  return <div className="single-arm-lamp" data-arm-angle={arm} data-shade-angle={swivel} data-on={lit || undefined}>
    <svg viewBox="0 0 720 600" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-base`} cx=".38" cy=".3"><stop stopColor="#777d80" /><stop offset=".5" stopColor="#3c4144" /><stop offset="1" stopColor="#181b1f" /></radialGradient>
        <linearGradient id={`${id}-metal`}><stop stopColor="#42494f" /><stop offset=".35" stopColor="#ebeeeb" /><stop offset=".6" stopColor="#999fa4" /><stop offset="1" stopColor="#41494f" /></linearGradient>
        <radialGradient id={`${id}-enamel`} cx=".35" cy=".25"><stop stopColor="#669579" /><stop offset=".5" stopColor="#37654d" /><stop offset="1" stopColor="#183e2b" /></radialGradient>
      </defs>
      <ellipse cx={450} cy={400} rx={112} ry={110} fill="#121315" opacity=".18" />
      <g transform={`translate(${base.x} ${base.y}) scale(${base.scale})`}>
        <circle r={mmToUnits(SINGLE_ARM_MM.baseRadius)} fill={`url(#${id}-base)`} stroke="#24272c" strokeWidth="4" />
        <circle r="43" fill="#252c30" stroke="#939b9d" strokeWidth="5" />
      </g>
      {visibleArm && <g className="single-arm-lamp__arm">
        <line x1={base.x} y1={base.y} x2={neck.x} y2={neck.y} stroke="#242b30" strokeWidth="22" strokeLinecap="round" />
        <line x1={base.x} y1={base.y} x2={neck.x} y2={neck.y} stroke={`url(#${id}-metal)`} strokeWidth="14" strokeLinecap="round" />
      </g>}
      {neck.scale > 0 && shade.scale > 0 && <line x1={neck.x} y1={neck.y} x2={shade.x} y2={shade.y} stroke="#abb3b6" strokeWidth="12" strokeLinecap="round" />}
      {rim.scale > 0 && shade.scale > 0 && <path className="single-arm-lamp__shade-wall" d={`M${rim.x - 78 * rim.scale} ${rim.y} L${shade.x - 78 * shade.scale} ${shade.y} A${78 * shade.scale} ${72 * shade.scale} 0 0 1 ${shade.x + 78 * shade.scale} ${shade.y} L${rim.x + 78 * rim.scale} ${rim.y} A${78 * rim.scale} ${72 * rim.scale} 0 0 1 ${rim.x - 78 * rim.scale} ${rim.y}Z`} fill="#244d36" stroke="#183d2a" strokeWidth="3" />}
      <g transform={`translate(${shade.x} ${shade.y}) scale(${shade.scale}) rotate(${swivel - 135})`}>
        <ellipse cx="8" cy="0" rx="82" ry="72" fill={lit ? '#d3b96e' : '#22292a'} stroke="#b3b7ac" strokeWidth="5" />
        <path d="M-62-55Q-105 0-62 55Q-12 86 62 56L70-56Q-12-86-62-55Z" fill={`url(#${id}-enamel)`} stroke="#1b392b" strokeWidth="4" />
        <ellipse cx="-25" cy="-20" rx="24" ry="11" fill="#d4e1d5" opacity=".2" />
        <circle cx="-48" cy="0" r="11" fill="#c7cfce" />
      </g>
    </svg>
    <button role="slider" aria-label="Arm elevation" aria-valuemin={ARM_LIMITS.min} aria-valuemax={ARM_LIMITS.max} aria-valuenow={arm} aria-valuetext={`${Math.round(arm)} degrees; drag up or down`} className="single-arm-lamp__control" style={controlStyle(base)} onPointerDown={e => begin('arm', e)} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end} onKeyDown={e => key('arm', e)}>↕</button>
    <button role="slider" aria-label="Shade swivel" aria-valuemin={0} aria-valuemax={360} aria-valuenow={swivel} aria-valuetext={`${Math.round(swivel)} degrees; drag left or right`} className="single-arm-lamp__control" style={controlStyle(shade)} onPointerDown={e => begin('shade', e)} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end} onKeyDown={e => key('shade', e)}>↔</button>
    <button className="single-arm-lamp__switch" style={{ ...controlStyle(base), marginTop: 30 }} aria-label={`Turn one-arm lamp ${lit ? 'off' : 'on'}`} onClick={() => { setLit(!lit); onToggle?.(!lit); }}>{lit ? '●' : '○'}</button>
  </div>;
}
