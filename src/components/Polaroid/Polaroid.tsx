import type React from 'react';
import '../../styles/fonts.css';
import './Polaroid.css';

export const POLAROID_FORMATS = ['square', 'wide'] as const;
export type PolaroidFormat = (typeof POLAROID_FORMATS)[number];

export type PolaroidProps = {
  /** The photograph. */
  src: string;
  /** What the photo shows. Leave empty for a purely decorative print. */
  alt?: string;
  /** Where the photo is anchored when the window crops it, as a CSS object-position. */
  focus?: string;
  /** The classic square integral print, or the wide landscape pack. */
  format?: PolaroidFormat;
  /** Marker handwriting on the bottom border, left. */
  caption?: React.ReactNode;
  /** Smaller handwriting on the bottom border, right. */
  note?: React.ReactNode;
  /** A strip of masking tape across the top edge. */
  tape?: boolean;
  /** Tilt of the whole print in degrees. Negative tilts counter-clockwise. */
  rotation?: number;
  /** How far the chemistry has faded: 0 is a fresh print, 1 is decades old. */
  fade?: number;
  className?: string;
  style?: React.CSSProperties;
};

export const DEFAULT_POLAROID_FADE = 0.55;

const present = (node: React.ReactNode) => node != null && node !== '' && node !== false;

/**
 * An instant print: a smooth coated card with a recessed photo window and the
 * thick bottom border you write on. The photo gets the lifted blacks, vignette
 * and gloss of real dye film, and the whole print scales as one object.
 */
export function Polaroid({
  src,
  alt = '',
  focus = '50% 50%',
  format = 'square',
  caption,
  note,
  tape = false,
  rotation = 0,
  fade = DEFAULT_POLAROID_FADE,
  className = '',
  style,
}: PolaroidProps) {
  const hasCaption = present(caption) || present(note);
  return (
    <div
      className={`polaroid ${className}`}
      data-format={format}
      style={
        {
          '--polaroid-rotation': `${rotation}deg`,
          '--polaroid-focus': focus,
          '--polaroid-fade': Math.min(1, Math.max(0, fade)),
          ...style,
        } as React.CSSProperties
      }
    >
      <figure className="polaroid__card">
        {tape ? <span className="polaroid__tape" aria-hidden="true" /> : null}
        <div className="polaroid__window">
          <img className="polaroid__photo" src={src} alt={alt} />
          <span className="polaroid__fade" aria-hidden="true" />
          <span className="polaroid__gloss" aria-hidden="true" />
          <span className="polaroid__wear" aria-hidden="true" />
        </div>
        {hasCaption ? (
          <figcaption className="polaroid__caption">
            <span className="polaroid__line">
              {present(caption) ? <span className="polaroid__title">{caption}</span> : null}
              {present(note) ? <span className="polaroid__note">{note}</span> : null}
            </span>
          </figcaption>
        ) : null}
      </figure>
    </div>
  );
}
