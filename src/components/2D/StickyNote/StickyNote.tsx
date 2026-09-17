import type React from 'react';
import '../../../styles/fonts.css';
import './StickyNote.css';

export const STICKY_NOTE_COLORS = ['canary', 'pink', 'blue', 'green', 'orange'] as const;
export type StickyNoteColor = (typeof STICKY_NOTE_COLORS)[number];

export type StickyNoteProps = {
  color?: StickyNoteColor;
  /** The pen it was written with. */
  ink?: string;
  /** Size of the handwriting, in 720ths of the note's width. */
  size?: number;
  /** Tilt in degrees. */
  rotation?: number;
  /** Which corner has come unstuck and curled: none, or the lower left or right. */
  curl?: 'none' | 'left' | 'right';
  /** What is written on it. */
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * A square sticky note, three inches to a side: stuck along the top edge by
 * its strip of adhesive, so the bottom lifts a little and one corner has
 * curled over showing its underside. Written in the handwritten face. Sized by
 * its parent's width.
 */
export function StickyNote({ color = 'canary', ink = '#1d2a5e', size = 72, rotation = 0, curl = 'right', children, className = '', style }: StickyNoteProps) {
  return (
    <div
      className={`sticky-note ${className}`}
      data-color={color}
      data-curl={curl}
      style={{ '--sticky-note-rotation': `${rotation}deg`, '--sticky-note-ink': ink, '--sticky-note-size': size, ...style } as React.CSSProperties}
    >
      <div className="sticky-note__paper" />
      <div className="sticky-note__curl" aria-hidden="true" />
      <div className="sticky-note__ink">{children}</div>
    </div>
  );
}
