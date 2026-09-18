import { useId, useRef } from 'react';
import { DEFAULT_SHADOW_STRENGTH, useDeskLightEffect, type DeskLight, type LightOccluderPoint } from '../../../behaviors/DeskLighting/DeskLighting';
import { LampLight } from './DeskLamp';

/** Project an occluder away from the bulb onto the desk. Above-bulb parts cannot block its downward light. */
export function lampShadowPoint(point: LightOccluderPoint, light: DeskLight) {
  const ratio = point.height / Math.max(1, light.height - point.height);
  const dx = point.x - light.x, dy = point.y - light.y;
  const distance = Math.hypot(dx, dy);
  const reach = Math.min(1440, Math.max(0, distance * ratio));
  return { x: point.x + (distance ? dx / distance * reach : 0), y: point.y + (distance ? dy / distance * reach : 0), radius: point.radius * (1 + Math.min(3, Math.max(0, ratio))) };
}

/**
 * The lamp's own shadow: its base, and the arm reaching out over the desk.
 *
 * This is the last thing on the desk that the lamp used to re-render. It has
 * more to write than an object's shadow does — an arm that articulates changes
 * the shape of its shadow, not just where it falls — but the shapes are still
 * a fixed set of elements, so they are drawn once here and their geometry is
 * written by `redraw` afterwards. Aiming the shade now costs no React at all.
 */
export function LampShadows({ surfaceHeight = 800 }: { surfaceHeight?: number }) {
  const id = `lamp-cast-${useId().replace(/:/g, '')}`;
  const root = useRef<SVGSVGElement>(null);
  const contact = useRef<SVGCircleElement>(null);
  const pool = useRef<SVGRadialGradientElement>(null);
  const lit = useRef<SVGGElement>(null);
  const foot = useRef<SVGCircleElement>(null);
  const lower = useRef<SVGPathElement>(null);
  const upper = useRef<SVGPathElement>(null);
  /* The falloff's reach follows the bulb's height, which a lamp being carried does
     not change: kept so it is written when it moves rather than every frame. */
  const reach = useRef<number>(NaN);

  const armPath = (from: LightOccluderPoint, to: LightOccluderPoint, light: DeskLight) => {
    // Clip the upper link below the source plane; its remaining length fades outside the light pool.
    const t = Math.min(1, Math.max(0, (light.height * 0.94 - from.height) / (to.height - from.height)));
    const end = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t, height: from.height + (to.height - from.height) * t, radius: to.radius };
    const a = lampShadowPoint(from, light), b = lampShadowPoint(end, light);
    const angle = Math.atan2(b.y - a.y, b.x - a.x), nx = -Math.sin(angle), ny = Math.cos(angle);
    return `M${a.x + nx * a.radius} ${a.y + ny * a.radius} L${b.x + nx * b.radius} ${b.y + ny * b.radius} L${b.x - nx * b.radius} ${b.y - ny * b.radius} L${a.x - nx * a.radius} ${a.y - ny * a.radius}Z`;
  };

  useDeskLightEffect(light => {
    const svg = root.current;
    if (!svg) return;
    /* A light with no lamp registered has no lamp shadow to draw. Hidden rather
       than unmounted, so what is drawn below survives the lamp being re-registered. */
    if (!light?.lamp) { svg.style.display = 'none'; return; }
    svg.style.display = '';
    const { base, elbow, neck } = light.lamp;
    contact.current?.setAttribute('cx', String(base.x));
    contact.current?.setAttribute('cy', String(base.y));
    contact.current?.setAttribute('r', String(base.radius * 1.01));
    pool.current?.setAttribute('cx', String(light.x));
    pool.current?.setAttribute('cy', String(light.y));
    if (light.height !== reach.current) { reach.current = light.height; pool.current?.setAttribute('r', String(light.height * 1.6)); }
    lit.current?.setAttribute('opacity', String(light.on ? light.shadowStrength ?? DEFAULT_SHADOW_STRENGTH : 0));
    const projectedBase = lampShadowPoint(base, light);
    foot.current?.setAttribute('cx', String(projectedBase.x));
    foot.current?.setAttribute('cy', String(projectedBase.y));
    foot.current?.setAttribute('r', String(projectedBase.radius));
    lower.current?.setAttribute('d', armPath({ ...base, radius: elbow.radius }, elbow, light));
    upper.current?.setAttribute('d', armPath(elbow, neck, light));
  });

  return <svg ref={root} className="lamp-cast-shadow" viewBox={`0 0 1440 ${surfaceHeight}`} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', display: 'none' }}>
    <defs>
      <filter id={`${id}-soft`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" /></filter>
      <radialGradient ref={pool} id={`${id}-falloff`} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="0">
        <stop offset="0" stopColor="white" /><stop offset="0.6" stopColor="white" stopOpacity="0.7" /><stop offset="1" stopColor="white" stopOpacity="0" />
      </radialGradient>
      <mask id={`${id}-pool`}><rect width="1440" height={surfaceHeight} fill={`url(#${id}-falloff)`} /></mask>
    </defs>
    {/* Only a close contact cue remains when the light is off. */}
    <circle ref={contact} className="lamp-contact-shadow" cx="0" cy="0" r="0" fill="#140c06" opacity="0.2" filter={`url(#${id}-soft)`} />
    <g ref={lit} className="lamp-cast-shadow__light" opacity="0" mask={`url(#${id}-pool)`}>
      <g fill="#140c06" filter={`url(#${id}-soft)`}>
        <circle ref={foot} cx="0" cy="0" r="0" />
        <path ref={lower} className="lamp-cast-shadow__lower-arm" d="" />
        <path ref={upper} className="lamp-cast-shadow__upper-arm" d="" />
      </g>
    </g>
  </svg>;
}

/**
 * The pool of light the lamp throws on the desk, positioned where the lamp
 * stands. Its size and its placing are written rather than rendered, so the
 * scene round it holds still while the lamp is carried.
 */
export function LampPool({ surfaceWidth, surfaceHeight }: { surfaceWidth: number; surfaceHeight: number }) {
  const glow = useRef<HTMLDivElement>(null);
  useDeskLightEffect(light => {
    const element = glow.current;
    if (!element) return;
    if (!light) { element.style.display = 'none'; return; }
    const size = light.height * 1.4;
    element.style.display = '';
    element.style.width = `${size / surfaceWidth * 100}%`;
    element.style.left = `${(light.x - size / 2) / surfaceWidth * 100}%`;
    element.style.top = `${(light.y - size / 2) / surfaceHeight * 100}%`;
    /* The switch is an attribute rather than a prop for the same reason: turning
       the lamp off should not rebuild the thing that is being turned off. */
    if (light.on) element.setAttribute('data-on', ''); else element.removeAttribute('data-on');
  });
  return <LampLight ref={glow} style={{ position: 'absolute', aspectRatio: '1', display: 'none' }} />;
}
