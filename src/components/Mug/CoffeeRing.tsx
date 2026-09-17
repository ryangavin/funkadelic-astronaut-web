import type React from 'react';
import { useId } from 'react';
import './Mug.css';

/** An outline cut out of a ring, as fractions of the ring's own box: the edge of whatever was lying over the surface when the coffee went down, so the coffee never reached it there. */
export type RingMask = [number, number][];

export type CoffeeRingProps = {
  /** How dark the stain is, 0 to 1. */
  strength?: number;
  rotation?: number;
  /** What was lying over this surface as the ring was left. Each outline is cut out of the ring. */
  masks?: readonly RingMask[];
  className?: string;
  style?: React.CSSProperties;
};

/** The drawing is 200 square, and the ring is turned inside it, so anything cut out of it can be given in the box's own frame. */
const BOX = 200;

const outline = (mask: RingMask) => `M${mask.map(([x, y]) => `${(x * BOX).toFixed(2)} ${(y * BOX).toFixed(2)}`).join('L')}Z`;

/**
 * The ring a wet mug leaves: two uneven circles of dried coffee, heavier where
 * it pooled, a drip or two beside them. Multiplied onto whatever it is laid on.
 * With `masks` it is the part of a ring that reached this surface and no more,
 * the rest having landed on whatever was lying over it. Sized by its parent.
 */
export function CoffeeRing({ strength = 0.45, rotation = 0, masks, className = '', style }: CoffeeRingProps) {
  const id = `coffee-ring-${useId().replace(/:/g, '')}`;
  /* The box, with each cover cut out of it by the even-odd rule. The box is drawn wide so the drips and the blur are kept. */
  const cut = masks?.length ? `M-40 -40H240V240H-40Z ${masks.map(outline).join(' ')}` : null;
  return (
    <div className={`coffee-ring ${className}`} style={{ '--coffee-ring-strength': strength, ...style } as React.CSSProperties}>
      <svg viewBox={`0 0 ${BOX} ${BOX}`} aria-hidden="true" focusable="false">
        {cut ? (
          <defs>
            <clipPath id={`${id}-cut`}>
              <path d={cut} clipRule="evenodd" />
            </clipPath>
          </defs>
        ) : null}
        {/* The cut is the surface's own, so the ring turns inside it rather than the other way about. */}
        <g clipPath={cut ? `url(#${id}-cut)` : undefined}>
          <g transform={`rotate(${rotation} 100 100)`}>
            <g fill="none" strokeLinecap="round">
              <circle cx="100" cy="100" r="78" strokeWidth="5.5" strokeDasharray="46 5 92 11 60 3 130 9" />
              <circle cx="101" cy="99" r="81" strokeWidth="2.5" strokeDasharray="110 14 40 22 160 8" strokeDashoffset="37" />
              <circle cx="99" cy="101" r="75" strokeWidth="1.6" strokeDasharray="30 40 80 26 20 60" strokeDashoffset="90" />
            </g>
            <g className="coffee-ring__drips">
              <ellipse cx="176" cy="132" rx="3.6" ry="2.8" />
              <circle cx="24" cy="70" r="1.8" />
              <circle cx="182" cy="58" r="1.3" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
