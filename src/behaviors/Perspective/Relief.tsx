import { useRef, type ReactNode } from 'react';
import { mmToUnits } from '../../geometry/physicalScale';
import { type Place } from '../Movable/Movable';
import { usePlaceEffect } from '../Movable/places';
import { elevatedLayer, type StudyCamera } from './elevation';
import './Relief.css';

/**
 * A plan drawing given its height: the artwork lifted to the top of the thing,
 * with a stack of copies of its outline below standing in for the side.
 *
 * What the stack is made of never changes — the same outline, the same shading
 * through the thickness, however the thing is moved. Only where each layer
 * lands does, and that is written onto the layers from a subscription to the
 * thing's place, the way its shadow already works. So a relief is drawn once
 * and moved for free, and carrying one costs no React at all.
 */
export function Relief({ children, place, placeId, camera, width, depth, heightMm, path, sideColors }: { sideColors?: readonly [string, string, string]; children: ReactNode; place: Place; /** What the thing is called in the surface's places. Given one, the relief follows it without re-rendering. */ placeId?: string; camera: StudyCamera; /** The thing's size at a scale of one; whatever its place is scaled to is applied here. */ width: number; depth: number; heightMm: number; path: string }) {
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

  const sides = useRef<SVGSVGElement>(null);
  const face = useRef<HTMLDivElement>(null);
  const at = useRef<Place>(place);
  /* Off a surface that keeps places the place is still a prop, and a prop changes
     by rendering: take it from there instead, so a scene with no store still has
     a relief that stands where its thing does. */
  if (!placeId) at.current = place;

  const redraw = () => {
    const svg = sides.current, top = face.current;
    if (!svg || !top) return;
    const here = at.current;
    const grown = here.scale ?? 1;
    const ratio = depth / width;
    const standing = { ...here, width: width * grown, drawingWidth: 100, drawingHeight: ratio * 100 };
    const rise = mmToUnits(heightMm * grown);
    const layers = svg.children;
    for (let i = 0; i < steps; i += 1) {
      const lift = elevatedLayer(rise * (i / (steps - 1)), standing, camera);
      layers[i]?.setAttribute('transform', `translate(${lift.x} ${lift.y / ratio}) translate(50 50) scale(${lift.scale}) translate(-50 -50)`);
    }
    const crown = elevatedLayer(rise, standing, camera);
    top.style.transform = `translate(${crown.x}%, ${crown.y / ratio}%) scale(${crown.scale})`;
  };
  usePlaceEffect(placeId, where => { if (where) at.current = where; redraw(); });

  return <div className="desk-study__relief" style={{ aspectRatio: `${width} / ${depth}` }}>
    <svg ref={sides} className="desk-study__sides" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {/* Drawn once. Where each of these lands is written on afterwards, by redraw. */}
      {Array.from({ length: steps }, (_, i) => <path key={i} d={path} fill={sideFill(i / (steps - 1))} />)}
    </svg>
    <div ref={face} className="desk-study__face">{children}</div>
  </div>;
}
