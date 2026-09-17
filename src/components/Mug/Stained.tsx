import type React from 'react';
import { Pin } from '../Pin/Pin';
import { CoffeeRing } from './CoffeeRing';
import type { CoffeeStain } from './trail';
import './Mug.css';

export type CoffeeRingsProps = {
  /** The rings one thing is carrying, in its own units, newest first. */
  rings: readonly CoffeeStain[];
};

/** The rings left on one thing, each where it was left on it. */
export function CoffeeRings({ rings }: CoffeeRingsProps) {
  return (
    <>
      {rings.map((ring) => (
        <Pin key={ring.id} x={ring.x} y={ring.y} width={ring.width}>
          <CoffeeRing strength={ring.strength} rotation={ring.rotation} masks={ring.masks} />
        </Pin>
      ))}
    </>
  );
}

export type StainedProps = CoffeeRingsProps & {
  children?: React.ReactNode;
  className?: string;
};

/**
 * Something a mug has been stood on: whatever it wraps, with the rings left on
 * it lying over its face and clipped to its edges, so they go where it goes
 * and no further. The wood needs none of this — it is the thing everything
 * else lies on — so its own rings are laid on it with CoffeeRings.
 */
export function Stained({ rings, children, className = '' }: StainedProps) {
  return (
    <div className={`stained ${className}`}>
      {children}
      <div className="stained__rings" aria-hidden="true">
        <CoffeeRings rings={rings} />
      </div>
    </div>
  );
}
