import type React from 'react';
import { useEffect, useRef } from 'react';
import '../../styles/fonts.css';
import { youTubeId, youTubePreview } from './embed';
import './Polaroid.css';

export const POLAROID_FORMATS = ['square', 'wide'] as const;
export type PolaroidFormat = (typeof POLAROID_FORMATS)[number];

export type PolaroidProps = {
  /** The photograph, or the poster frame of a video file. A YouTube print needs none. */
  src?: string;
  /** A clip in the window instead of a still: a video file, muted and looping as a preview, or a YouTube link,
      which brings the player with its title bar and logo cropped away, starting muted: click the picture to play or pause. */
  video?: string;
  /** Show the picture exactly as supplied, with none of the dye-film fade, gloss or grain. */
  plain?: boolean;
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
  video,
  plain = false,
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
  const clip = useRef<HTMLVideoElement>(null);
  const youTube = video ? youTubeId(video) : undefined;

  // A video file: React does not reflect `muted` as an attribute, and autoplay is only
  // allowed muted. A page that loads hidden, or a tab sent to the background, starts the
  // preview once it is looked at. YouTube's player minds its own autoplay.
  useEffect(() => {
    const element = clip.current;
    if (!element || !video) return;
    const doc = element.ownerDocument;
    element.muted = true;
    element.defaultMuted = true;
    const play = () => element.play().catch(() => {});
    const resume = () => {
      if (!doc.hidden) play();
    };
    play();
    doc.addEventListener('visibilitychange', resume);
    return () => doc.removeEventListener('visibilitychange', resume);
  }, [video]);

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
      <figure className="polaroid__card" data-plain={plain ? '' : undefined}>
        {tape ? <span className="polaroid__tape" aria-hidden="true" /> : null}
        <div className="polaroid__window">
          {youTube ? (
            <div className="polaroid__embed">
              <iframe
                className="polaroid__player"
                src={youTubePreview(youTube)}
                title={alt || 'Video'}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          ) : video ? (
            <video ref={clip} className="polaroid__photo" src={video} poster={src} muted autoPlay loop playsInline preload="metadata" aria-label={alt || undefined} />
          ) : (
            <img className="polaroid__photo" src={src} alt={alt} />
          )}
          {plain ? null : (
            <>
              <span className="polaroid__fade" aria-hidden="true" />
              <span className="polaroid__gloss" aria-hidden="true" />
              <span className="polaroid__wear" aria-hidden="true" />
            </>
          )}
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
