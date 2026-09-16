import type React from 'react';
import './Mug.css';

export type CoffeeRingProps = {
  /** How dark the stain is, 0 to 1. */
  strength?: number;
  rotation?: number;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * The ring a wet mug leaves: two uneven circles of dried coffee, heavier where
 * it pooled, a drip or two beside them. Multiplied onto whatever it is laid on.
 * Sized by its parent.
 */
export function CoffeeRing({ strength = 0.45, rotation = 0, className = '', style }: CoffeeRingProps) {
  return (
    <div className={`coffee-ring ${className}`} style={{ '--coffee-ring-strength': strength, '--coffee-ring-rotation': `${rotation}deg`, ...style } as React.CSSProperties}>
      <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
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
      </svg>
    </div>
  );
}
