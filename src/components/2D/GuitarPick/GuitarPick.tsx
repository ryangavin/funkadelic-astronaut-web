import type React from 'react';
import { useId } from 'react';
import '../../../styles/fonts.css';
import './GuitarPick.css';

export type GuitarPickProps = {
  /** The celluloid: any CSS colour. */
  color?: string;
  /** Printed on the face, in the display face. Two or three letters read well. */
  print?: string;
  /** Ink of the print. */
  ink?: string;
  /** Tilt in degrees. 0 points down. */
  rotation?: number;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * A guitar pick left on the desk: the standard teardrop, a hair over an inch
 * long, in tortoiseshell-ish celluloid that catches the light along its top
 * edge, with a mark printed on the face. Sized by its parent's width.
 */
export function GuitarPick({ color = '#9275b2', print = 'FA', ink = '#121420', rotation = 0, className = '', style }: GuitarPickProps) {
  const id = `pick-${useId().replace(/:/g, '')}`;
  return (
    <div className={`guitar-pick ${className}`} style={{ '--guitar-pick-rotation': `${rotation}deg`, '--guitar-pick-color': color, '--guitar-pick-ink': ink, ...style } as React.CSSProperties}>
      <svg viewBox="0 0 100 116" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id={`${id}-sheen`} cx="0.34" cy="0.22" r="0.9">
            <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
            <stop offset="0.4" stopColor="#fff" stopOpacity="0.08" />
            <stop offset="1" stopColor="#000" stopOpacity="0.28" />
          </radialGradient>
        </defs>
        <path className="guitar-pick__face" d="M50 2 C 80 2 98 20 98 44 C 98 78 66 108 50 114 C 34 108 2 78 2 44 C 2 20 20 2 50 2 Z" />
        <path d="M50 2 C 80 2 98 20 98 44 C 98 78 66 108 50 114 C 34 108 2 78 2 44 C 2 20 20 2 50 2 Z" fill={`url(#${id}-sheen)`} />
        <text className="guitar-pick__print" x="50" y="58" textAnchor="middle">
          {print}
        </text>
      </svg>
    </div>
  );
}
