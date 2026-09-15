import type React from 'react';
import './Pin.css';

export type PinProps = {
  /** Distance from the sheet's left edge, in sheet units. */
  x?: number;
  /** Distance from the sheet's top edge, in sheet units. */
  y?: number;
  /** Width in sheet units. 0 lets the child size itself. */
  width?: number;
  /** Rotation in degrees. */
  rotation?: number;
  children?: React.ReactNode;
};

export function Pin({ x = 0, y = 0, width = 0, rotation = 0, children }: PinProps) {
  const style = {
    '--pin-x': x,
    '--pin-y': y,
    '--pin-width': width > 0 ? `calc(${width} * var(--sheet-unit, 1px))` : 'auto',
    '--pin-rotation': `${rotation}deg`,
  } as React.CSSProperties;

  return (
    <div className="pin" style={style}>
      {children}
    </div>
  );
}
