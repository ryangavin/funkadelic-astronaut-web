import { type ReactNode } from 'react';
import { mmToUnits } from '../../geometry/physicalScale';
import { type Place } from '../Movable/Movable';
import { elevatedLayer, type StudyCamera } from './elevation';
import './Relief.css';

/**
 * A plan drawing given its height: the artwork lifted to the top of the thing,
 * with a stack of copies of its outline below to stand in for the side.
 *
 * Where each layer lands is worked out from the thing's place and the camera,
 * so this re-renders every step of a drag. That is the last of the React cost
 * on the desk; the shadow beside it was taken off renders and this has not been
 * yet.
 */
export function Relief({ children, place, camera, width, depth, heightMm, path, sideColors }: { sideColors?: readonly [string, string, string]; children: ReactNode; place: Place; camera: StudyCamera; width: number; depth: number; heightMm: number; path: string }) {
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
    const at = elevatedLayer(mmToUnits(heightMm) * fraction, { ...place, width, drawingWidth: 100, drawingHeight: depth / width * 100 }, camera);
    return `translate(${at.x} ${at.y / (depth / width)}) translate(50 50) scale(${at.scale}) translate(-50 -50)`;
  };
  const top = elevatedLayer(mmToUnits(heightMm), { ...place, width, drawingWidth: 100, drawingHeight: depth / width * 100 }, camera);
  return <div className="desk-study__relief" style={{ aspectRatio: `${width} / ${depth}` }}>
    <svg className="desk-study__sides" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {Array.from({ length: steps }, (_, i) => <path key={i} d={path} transform={layer(i / (steps - 1))} fill={sideFill(i / (steps - 1))} />)}
    </svg>
    <div className="desk-study__face" style={{ transform: `translate(${top.x}%, ${top.y / (depth / width)}%) scale(${top.scale})` }}>{children}</div>
  </div>;
}
