import type React from 'react';
import { useId } from 'react';
import './Pen.css';

export const PEN_KINDS = ['ballpoint', 'marker', 'pencil'] as const;
export type PenKind = (typeof PEN_KINDS)[number];

export type PenProps = {
  kind?: PenKind;
  /** The ink: the cap and tube of a ballpoint, the cap and plug of a marker. A pencil ignores it. */
  ink?: string;
  /** Tilt in degrees. 0 lies left to right with the point on the right. */
  rotation?: number;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * A pen lying on the desk, seen from above, drawn 720 units long: a clear
 * ballpoint with its cap on and the ink tube showing through the barrel, a
 * fat permanent marker, or a sharpened pencil with the eraser worn down.
 * Sized by its parent's width.
 */
export function Pen({ kind = 'ballpoint', ink = '#2c4fa3', rotation = 0, className = '', style }: PenProps) {
  const id = `pen-${useId().replace(/:/g, '')}`;
  return (
    <div className={`pen ${className}`} data-kind={kind} style={{ '--pen-rotation': `${rotation}deg`, '--pen-ink': ink, ...style } as React.CSSProperties}>
      <svg viewBox="0 0 720 60" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={`${id}-round`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
            <stop offset="0.35" stopColor="#fff" stopOpacity="0.05" />
            <stop offset="0.7" stopColor="#000" stopOpacity="0.12" />
            <stop offset="1" stopColor="#000" stopOpacity="0.42" />
          </linearGradient>
          <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fdf6dc" />
            <stop offset="0.5" stopColor="#c9a24d" />
            <stop offset="1" stopColor="#7d5f21" />
          </linearGradient>
          <linearGradient id={`${id}-steel`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f4f5f7" />
            <stop offset="0.5" stopColor="#b4b8c0" />
            <stop offset="1" stopColor="#6d7079" />
          </linearGradient>
        </defs>

        {kind === 'ballpoint' && (
          <g>
            {/* A clear hexagonal barrel with the ink tube inside it. */}
            <rect className="pen__barrel" x="128" y="20" width="566" height="20" rx="3" />
            <rect className="pen__tube" x="140" y="26.5" width="520" height="7" rx="3.5" />
            <rect x="128" y="20" width="566" height="20" rx="3" fill={`url(#${id}-round)`} />
            <path className="pen__facet" d="M132 26 H 690 M132 34 H 690" />
            {/* The brass cone and the ball. */}
            <path d="M694 20 L 716 27 L 716 33 L 694 40 Z" fill={`url(#${id}-metal)`} />
            <circle cx="717" cy="30" r="2.2" fill="#8a8f97" />
            {/* The cap, with its clip along the top. */}
            <rect className="pen__cap" x="2" y="17" width="140" height="26" rx="6" />
            <rect x="2" y="17" width="140" height="26" rx="6" fill={`url(#${id}-round)`} />
            <rect className="pen__cap" x="24" y="11" width="100" height="7" rx="3" />
            <rect x="24" y="11" width="100" height="7" rx="3" fill={`url(#${id}-round)`} />
            <rect className="pen__cap-end" x="2" y="17" width="10" height="26" rx="5" />
          </g>
        )}

        {kind === 'marker' && (
          <g>
            <rect className="pen__body" x="150" y="14" width="546" height="32" rx="8" />
            <rect x="150" y="14" width="546" height="32" rx="8" fill={`url(#${id}-round)`} />
            <rect className="pen__plug" x="672" y="18" width="40" height="24" rx="5" />
            <rect x="672" y="18" width="40" height="24" rx="5" fill={`url(#${id}-round)`} />
            <rect className="pen__print" x="330" y="26" width="200" height="8" rx="2" />
            {/* The cap: a shade wider, ridged where it meets the body, clip along the top. */}
            <rect className="pen__cap" x="2" y="11" width="164" height="38" rx="9" />
            <rect x="2" y="11" width="164" height="38" rx="9" fill={`url(#${id}-round)`} />
            <rect className="pen__ridge" x="150" y="11" width="6" height="38" />
            <rect className="pen__cap" x="30" y="5" width="110" height="7" rx="3" />
            <rect x="30" y="5" width="110" height="7" rx="3" fill={`url(#${id}-round)`} />
          </g>
        )}

        {kind === 'pencil' && (
          <g>
            <rect className="pen__eraser" x="2" y="18" width="44" height="24" rx="8" />
            <rect x="2" y="18" width="44" height="24" rx="8" fill={`url(#${id}-round)`} />
            <rect x="40" y="16" width="46" height="28" rx="2" fill={`url(#${id}-steel)`} />
            <path className="pen__ferrule" d="M50 16 V 44 M56 16 V 44 M72 16 V 44 M78 16 V 44" />
            <rect className="pen__wood" x="84" y="17" width="540" height="26" />
            <path className="pen__facet pen__facet--pencil" d="M84 25.5 H 624 M84 34.5 H 624" />
            <rect x="84" y="17" width="540" height="26" fill={`url(#${id}-round)`} />
            <path className="pen__point" d="M624 17 L 694 27.5 L 694 32.5 L 624 43 Z" />
            <path className="pen__lead" d="M694 27.5 L 716 30 L 694 32.5 Z" />
          </g>
        )}
      </svg>
    </div>
  );
}
