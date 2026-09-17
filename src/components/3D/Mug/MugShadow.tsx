import { useId } from 'react';
import { MUG_HEIGHT } from './Mug';

import { DEFAULT_SHADOW_STRENGTH, type DeskLight } from '../../../behaviors/DeskLighting/DeskLighting';

/** A point-light projection in desk units (2/mm); grazing rays are bounded to one desk width. The base stays grounded. */
export function mugShadowProjection(x: number, y: number, height: number, light: DeskLight) {
  const dx = x - light.x;
  const dy = y - light.y;
  const distance = Math.hypot(dx, dy);
  const ratio = Math.max(0, height) / Math.max(1, light.height - height);
  const length = Math.min(1440, distance * ratio);
  return {
    x: distance ? dx / distance * length : 0,
    y: distance ? dy / distance * length : 0,
    scale: 1 + Math.min(2, ratio),
    opacity: light.on ? (light.shadowStrength ?? DEFAULT_SHADOW_STRENGTH) / (1 + (distance / 1000) ** 2) : 0,
  };
}

/** A mug-only shadow layer, placed on the desk beneath objects and above the light pool. */
export function MugShadow({ x, y, width, rotation = 0, light, deskHeight = 800 }: {
  x: number; y: number; width: number; rotation?: number; light: DeskLight; deskHeight?: number;
}) {
  const id = `mug-cast-${useId().replace(/:/g, '')}`;
  const shadow = mugShadowProjection(x, y, width * MUG_HEIGHT, light);
  const radius = width * 70 / 240;
  const endRadius = radius * shadow.scale;
  const angle = Math.atan2(shadow.y, shadow.x);
  const nx = -Math.sin(angle);
  const ny = Math.cos(angle);
  return (
    <svg className="mug-cast-shadow" viewBox={`0 0 1440 ${deskHeight}`} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
      <defs>
        <filter id={id} x="-60%" y="-60%" width="220%" height="220%" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation="9" /></filter>
      </defs>
      {/* Blur one opaque silhouette, then apply opacity once: overlapping pieces cannot create seams. */}
      <g opacity={shadow.opacity} data-shadow-x={shadow.x} data-shadow-y={shadow.y}>
        <g transform={`translate(${x} ${y})`} fill="#140c06" stroke="none" filter={`url(#${id})`}>
          <path d={`M ${nx * radius} ${ny * radius} L ${shadow.x + nx * endRadius} ${shadow.y + ny * endRadius} L ${shadow.x - nx * endRadius} ${shadow.y - ny * endRadius} L ${-nx * radius} ${-ny * radius} Z`} />
          <circle r={radius} />
          <circle cx={shadow.x} cy={shadow.y} r={endRadius} />
          <g transform={`translate(${shadow.x} ${shadow.y}) scale(${width / 240 * shadow.scale}) rotate(${rotation}) translate(-104 -120)`}>
            <path d="M160 84 C214 74 214 166 160 156" fill="none" stroke="#140c06" strokeWidth="21" strokeLinecap="round" />
          </g>
        </g>
      </g>
    </svg>
  );
}
