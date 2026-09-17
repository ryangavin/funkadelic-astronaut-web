import { useId } from 'react';
import { DEFAULT_SHADOW_STRENGTH, useDeskLight, type DeskLight, type LightOccluderPoint } from '../../../behaviors/DeskLighting/DeskLighting';

/** Project an occluder away from the bulb onto the desk. Above-bulb parts cannot block its downward light. */
export function lampShadowPoint(point: LightOccluderPoint, light: DeskLight) {
  const ratio = point.height / Math.max(1, light.height - point.height);
  const dx = point.x - light.x, dy = point.y - light.y;
  const distance = Math.hypot(dx, dy);
  const reach = Math.min(1440, Math.max(0, distance * ratio));
  return { x: point.x + (distance ? dx / distance * reach : 0), y: point.y + (distance ? dy / distance * reach : 0), radius: point.radius * (1 + Math.min(3, Math.max(0, ratio))) };
}

/** Lamp geometry is registered with its light; these shadows stay on the desk beneath every object. */
export function LampShadows({ surfaceHeight = 800 }: { surfaceHeight?: number }) {
  const light = useDeskLight();
  const id = `lamp-cast-${useId().replace(/:/g, '')}`;
  if (!light?.lamp) return null;
  const { base, elbow, neck } = light.lamp;
  const projectedBase = lampShadowPoint(base, light);
  const armPath = (from: LightOccluderPoint, to: LightOccluderPoint) => {
    // Clip the upper link below the source plane; its remaining length fades outside the light pool.
    const t = Math.min(1, Math.max(0, (light.height * 0.94 - from.height) / (to.height - from.height)));
    const end = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t, height: from.height + (to.height - from.height) * t, radius: to.radius };
    const a = lampShadowPoint(from, light), b = lampShadowPoint(end, light);
    const angle = Math.atan2(b.y - a.y, b.x - a.x), nx = -Math.sin(angle), ny = Math.cos(angle);
    return `M${a.x + nx * a.radius} ${a.y + ny * a.radius} L${b.x + nx * b.radius} ${b.y + ny * b.radius} L${b.x - nx * b.radius} ${b.y - ny * b.radius} L${a.x - nx * a.radius} ${a.y - ny * a.radius}Z`;
  };
  return <svg className="lamp-cast-shadow" viewBox={`0 0 1440 ${surfaceHeight}`} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
    <defs>
      <filter id={`${id}-soft`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" /></filter>
      <radialGradient id={`${id}-falloff`} gradientUnits="userSpaceOnUse" cx={light.x} cy={light.y} r={light.height * 1.6}>
        <stop offset="0" stopColor="white" /><stop offset="0.6" stopColor="white" stopOpacity="0.7" /><stop offset="1" stopColor="white" stopOpacity="0" />
      </radialGradient>
      <mask id={`${id}-pool`}><rect width="1440" height={surfaceHeight} fill={`url(#${id}-falloff)`} /></mask>
    </defs>
    {/* Only a close contact cue remains when the light is off. */}
    <circle className="lamp-contact-shadow" cx={base.x} cy={base.y} r={base.radius * 1.01} fill="#140c06" opacity="0.2" filter={`url(#${id}-soft)`} />
    <g className="lamp-cast-shadow__light" opacity={light.on ? light.shadowStrength ?? DEFAULT_SHADOW_STRENGTH : 0} mask={`url(#${id}-pool)`}>
      <g fill="#140c06" filter={`url(#${id}-soft)`}>
        <circle cx={projectedBase.x} cy={projectedBase.y} r={projectedBase.radius} />
        <path className="lamp-cast-shadow__lower-arm" d={armPath({ ...base, radius: elbow.radius }, elbow)} />
        <path className="lamp-cast-shadow__upper-arm" d={armPath(elbow, neck)} />
      </g>
    </g>
  </svg>;
}
