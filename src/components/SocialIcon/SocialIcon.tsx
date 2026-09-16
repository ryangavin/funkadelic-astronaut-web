import type React from 'react';
import { useId } from 'react';
import { PrintInkFilter } from '../../foundations/Distressed/Distressed';
import { SOCIAL_PLATFORMS, type SocialPlatform } from './platforms';
import '../../styles/cutout-ink.css';
import './SocialIcon.css';

export { SOCIAL_PLATFORMS, SOCIAL_PLATFORM_NAMES, type SocialPlatform } from './platforms';

export type SocialIconProps = {
  platform: SocialPlatform;
  /** Ink the mark is printed in: one of the site's inks, `brand` for the platform's own colour, or any CSS colour. */
  ink?: SocialIconInk | 'brand' | (string & {});
  /** Rendered width and height. Any CSS length. */
  size?: number | string;
  /** Skip the worn-ink texture, for very small marks or when many are on screen. */
  worn?: boolean;
  /** How it is printed: `cutout` is the poster's finish, black under the ink with a hard shadow and worn edges;
      `flat` is a clean job, the silhouette in ink with its counters showing `paper` through, as on a vinyl sticker. */
  print?: 'cutout' | 'flat';
  /** What shows through the counters of a flat print. */
  paper?: string;
  /** Accessible name. Defaults to the platform's name. Pass an empty string for a purely decorative mark. */
  label?: string;
};

/** The site's fountain-pen inks. */
export const SOCIAL_ICON_INKS = {
  black: '#121420',
  red: '#a52837',
  green: '#228542',
  purple: '#9275b2',
  blue: '#639ec8',
  amber: '#c58930',
} as const;
export type SocialIconInk = keyof typeof SOCIAL_ICON_INKS;
export const SOCIAL_ICON_INK_NAMES = Object.keys(SOCIAL_ICON_INKS) as SocialIconInk[];

export function SocialIcon({ platform, ink = 'red', size = 28, worn = true, print = 'cutout', paper = '#fbf8f1', label }: SocialIconProps) {
  const uid = useId().replace(/:/g, '');
  const clipId = `social-icon-clip-${uid}`;
  const inkId = `social-icon-ink-${uid}`;
  const { label: platformLabel, silhouette, glyph, brand } = SOCIAL_PLATFORMS[platform];
  const gradient = ink === 'brand' && 'gradient' in SOCIAL_PLATFORMS[platform] ? (SOCIAL_PLATFORMS[platform] as { gradient: readonly string[] }).gradient : undefined;
  const name = label ?? platformLabel;
  const color = ink === 'brand' ? brand : ink in SOCIAL_ICON_INKS ? SOCIAL_ICON_INKS[ink as SocialIconInk] : ink;

  if (print === 'flat') {
    return (
      <span
        className="social-icon social-icon--flat"
        data-platform={platform}
        role={name ? 'img' : undefined}
        aria-label={name || undefined}
        aria-hidden={name ? undefined : true}
        style={{ '--social-icon-size': typeof size === 'number' ? `${size}px` : size, '--social-icon-ink': color, '--social-icon-paper': paper } as React.CSSProperties}
      >
        <svg className="social-icon__mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          {gradient && (
            <defs>
              <linearGradient id={`${uid}-brand`} x1="0" y1="1" x2="1" y2="0">
                {gradient.map((stop, index) => (
                  <stop key={stop} offset={index / (gradient.length - 1)} stopColor={stop} />
                ))}
              </linearGradient>
            </defs>
          )}
          {/* Paper beneath, so the counters of the mark read as unprinted; the ink over it, clean-edged. */}
          <path className="social-icon__paper" d={silhouette} />
          <path className="social-icon__ink" d={glyph} fillRule="evenodd" style={gradient ? { fill: `url(#${uid}-brand)` } : undefined} />
        </svg>
      </span>
    );
  }

  return (
    <span
      className="social-icon cutout-ink"
      data-platform={platform}
      role={name ? 'img' : undefined}
      aria-label={name || undefined}
      aria-hidden={name ? undefined : true}
      style={
        {
          '--social-icon-size': typeof size === 'number' ? `${size}px` : size,
          '--social-icon-ink': color,
        } as React.CSSProperties
      }
    >
      <svg className="social-icon__mark cutout-ink--svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={clipId}>
            <path d={glyph} clipRule="evenodd" />
          </clipPath>
          {worn ? <PrintInkFilter id={inkId} /> : null}
        </defs>
        <path className="cutout-ink__base" d={silhouette} />
        {/* Clipped to itself so the stroke only thickens inward, keeping the mark's outer edge crisp. */}
        <g clipPath={`url(#${clipId})`} filter={worn ? `url(#${inkId})` : undefined}>
          <path className="cutout-ink__fill" d={glyph} fillRule="evenodd" />
        </g>
      </svg>
    </span>
  );
}
