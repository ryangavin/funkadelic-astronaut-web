import { useId, useRef } from 'react';
import { DESK_SIZE, mmToUnits } from '../../geometry/physicalScale';
import { type Place } from '../Movable/Movable';
import { DEFAULT_SHADOW_STRENGTH, useDeskLight, useDeskLightEffect, type DeskLight } from '../DeskLighting/DeskLighting';
import { usePlaceEffect } from '../Movable/places';
import { LampLight } from '../../components/3D/DeskLamp/DeskLamp';
import { LampShadows } from '../../components/3D/DeskLamp/LampShadows';
import { type StudyShape } from './elevation';
import './CastShadow.css';

/*
  How many copies of a silhouette make a shadow. They are stacked from the
  thing's footprint up to its physical height, each scaled away from the lamp a
  little further than the last, so the pile reads as a swept solid rather than a
  flat cutout. Sixteen was chosen by eye and costs nothing to keep: cutting it
  to four was measured and saved not one millisecond, because the slices are
  only ever moved, never rebuilt.
*/
const SHADOW_SLICES = 16;

export type ShadowPlacement = {
  surfaceHeight: number;
  /** Where the thing is, for the first drawing of it. With a placeId, where it goes after that is the store's. */
  place: Place;
  /** What the thing is called in the surface's places. Given one, the shadow follows it without re-rendering. */
  placeId?: string;
  pivot?: { x: number; y: number };
  /** The thing's size at a scale of one. Whatever the place says it is scaled to is applied here. */
  width: number;
  depth: number;
  shapes: StudyShape[];
  heightMm: number;
};

/**
 * One thing's cast shadow.
 *
 * The shape of it is drawn once, from this thing's own place and outline. Where
 * the lamp puts it is written straight onto the slices afterwards and never
 * goes through React at all — that is the entire trick, and it is why dragging
 * the lamp no longer rebuilds every shadow on the desk. Each slice is the
 * silhouette scaled about the lamp's position, which is the one thing here that
 * depends on the light.
 */
export function ObjectCastShadow({ place, placeId, pivot = { x: 0.5, y: 0.5 }, width, depth, shapes, heightMm, surfaceHeight }: ShadowPlacement) {
  const id = `study-shadow-${useId().replace(/:/g, '')}`;
  const cast = useRef<SVGGElement>(null);
  const stack = useRef<SVGGElement>(null);

  /*
    Where the thing is and where the light is, both written rather than rendered.

    The light half was always done this way. The place half used to come down as
    a prop, so every step of a drag rebuilt the shadow of the thing being
    dragged — measured on the bench at 20.8ms of the 26.6ms that dragging the mug
    spent in React. Now both are subscriptions and neither is a render: the two
    keep the last thing they were told in a ref, and whichever fires redraws from
    both.
  */
  const lit = useRef<DeskLight | null>(null);
  const at = useRef<Place>(place);
  /* Off a surface that keeps places the place is still a prop, and a prop changes
     by rendering: take it from there instead, so a scene that has no store still
     has a shadow that follows its thing. */
  if (!placeId) at.current = place;
  const redraw = () => {
    const group = cast.current, slices = stack.current, light = lit.current, here = at.current;
    if (!group || !slices) return;
    if (!light) { group.setAttribute('opacity', '0'); return; }
    /* Whatever the composition has scaled the thing to, its shadow is scaled to as well. */
    const grown = here.scale ?? 1;
    const across = width * grown, deep = depth * grown;
    const cx = here.x + across / 2, cy = here.y + deep / 2;
    group.setAttribute('opacity', String(light.on ? (light.shadowStrength ?? DEFAULT_SHADOW_STRENGTH) / (1 + (Math.hypot(cx - light.x, cy - light.y) / 1000) ** 2) : 0));
    /* The silhouette turns about the same point the thing itself does, or the
       shadow walks out from under a thing that only spun on the spot. */
    const ox = here.x + across * pivot.x, oy = here.y + deep * pivot.y;
    const local = `translate(${ox} ${oy}) rotate(${here.rotation ?? 0}) translate(${-across * pivot.x} ${-deep * pivot.y}) scale(${across / 100} ${deep / 100})`;
    const outlines = slices.querySelectorAll('path');
    let n = 0;
    for (const shape of shapes) {
      for (let index = 0; index < SHADOW_SLICES; index += 1) {
        const height = mmToUnits((shape.heightMm ?? heightMm) * grown) * index / (SHADOW_SLICES - 1);
        const scale = Math.min(4, light.height / Math.max(1, light.height - height));
        (slices.children[n] as SVGGElement | undefined)?.setAttribute('transform', `translate(${light.x} ${light.y}) scale(${scale}) translate(${-light.x} ${-light.y})`);
        outlines[n]?.setAttribute('transform', local);
        n += 1;
      }
    }
  };
  useDeskLightEffect(light => { lit.current = light; redraw(); });
  usePlaceEffect(placeId, where => { if (where) at.current = where; redraw(); });

  return <svg className="desk-study__shadow" viewBox={`0 0 ${DESK_SIZE.width} ${surfaceHeight}`} aria-hidden="true">
    <defs><filter id={id} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="5" /></filter></defs>
    {/* Dark until the lamp says otherwise, so an unlit desk never flashes a shadow on its first frame. */}
    <g className="desk-study__cast" ref={cast} opacity="0">
      <g ref={stack} fill="#140c06" filter={`url(#${id})`}>
        {/* Drawn once. Where each of these lands is written on afterwards, by redraw. */}
        {shapes.flatMap((shape, shapeIndex) => Array.from({ length: SHADOW_SLICES }, (_, index) =>
          <g key={`${shapeIndex}-${index}`}><path d={shape.path} /></g>))}
      </g>
    </g>
  </svg>;
}

/** The pool the lamp throws and its own cast arm, for a scene that owns its lamp. */
function LampPoolLayers({ surfaceHeight }: { surfaceHeight: number }) {
  const light = useDeskLight();
  if (!light) return null;
  const pool = light.height * 1.4;
  return <>
    <LampLight on={light.on} style={{ position: 'absolute', width: `${pool / DESK_SIZE.width * 100}%`, aspectRatio: '1', left: `${(light.x - pool / 2) / DESK_SIZE.width * 100}%`, top: `${(light.y - pool / 2) / surfaceHeight * 100}%` }} />
    <LampShadows surfaceHeight={surfaceHeight} />
  </>;
}

/**
 * One scene-owned silhouette, composited once so overlapping layers never
 * darken each other. This itself reads nothing from the light, so it never
 * re-renders when the lamp moves; each piece below subscribes for only what it
 * actually needs.
 */
export function StudyLighting({ place, placeId, pivot = { x: 0.5, y: 0.5 }, width, depth, shapes, heightMm, surfaceHeight, shadowOnly = false }: { shadowOnly?: boolean; surfaceHeight: number; place: Place; placeId?: string; pivot?: { x: number; y: number }; width: number; depth: number; shapes: StudyShape[]; heightMm: number }) {
  return <>
    {!shadowOnly && <LampPoolLayers surfaceHeight={surfaceHeight} />}
    <ObjectCastShadow place={place} placeId={placeId} pivot={pivot} width={width} depth={depth} shapes={shapes} heightMm={heightMm} surfaceHeight={surfaceHeight} />
  </>;
}
