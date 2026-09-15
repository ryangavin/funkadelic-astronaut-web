import type React from 'react';
import { useId } from 'react';
import { PrintInkFilter } from '../../foundations/Distressed/Distressed';
import { SOCIAL_PLATFORMS, type SocialPlatform } from './platforms';
import '../../styles/cutout-ink.css';
import './SocialIcon.css';

export { SOCIAL_PLATFORMS, SOCIAL_PLATFORM_NAMES, type SocialPlatform } from './platforms';

export type SocialIconProps = {
  platform: SocialPlatform;
  /** Ink the mark is printed in. Any CSS colour. */
  ink?: SocialIconInk | (string & {});
  /** Rendered width and height. Any CSS length. */
  size?: number | string;
  /** Skip the worn-ink texture, for very small marks or when many are on screen. */
  worn?: boolean;
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

export function SocialIcon({ platform, ink = 'red', size = 28, worn = true, label }: SocialIconProps) {
  const uid = useId().replace(/:/g, '');
  const clipId = `social-icon-clip-${uid}`;
  const inkId = `social-icon-ink-${uid}`;
  const { label: platformLabel, silhouette, glyph } = SOCIAL_PLATFORMS[platform];
  const name = label ?? platformLabel;
  const color = ink in SOCIAL_ICON_INKS ? SOCIAL_ICON_INKS[ink as SocialIconInk] : ink;

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
