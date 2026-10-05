import type { CSSProperties } from 'react';

/** A Bandcamp release as the band has it on its page. The album id comes from Bandcamp's own Share / Embed dialog. */
export type BandcampRelease = {
  title: string;
  /** The numeric album id Bandcamp's player is addressed by. */
  albumId: string;
  /** The release's page on the band's Bandcamp. */
  href: string;
  /** How many tracks, so the player is tall enough to list them all without scrolling. */
  tracks: number;
  year: string;
};

/** The release the EPK features. */
export const FEATURED_RELEASE: BandcampRelease = {
  title: 'Time to Save the Universe',
  albumId: '2034305585',
  href: 'https://funkadelicastronaut.bandcamp.com/album/time-to-save-the-universe',
  tracks: 7,
  year: '2026',
};

/** Bandcamp's large player: the cover above the transport, then the track list, drawn on the poster's paper in its ink. */
export const bandcampPlayerSrc = (release: BandcampRelease) =>
  `https://bandcamp.com/EmbeddedPlayer/album=${release.albumId}/size=large/bgcol=fbf8f1/linkcol=a52837/tracklist=true/transparent=true/`;

/** The large player with its cover is its own width tall, plus the transport, plus a row per track. */
const playerHeight = (tracks: number) => 120 + 33 * tracks + 20;

export type BandcampPlayerProps = { release?: BandcampRelease; className?: string };

/** The featured release in Bandcamp's own player: cover, play button and track list. */
export function BandcampPlayer({ release = FEATURED_RELEASE, className = '' }: BandcampPlayerProps) {
  return (
    <div className={`bandcamp-player ${className}`} style={{ '--bandcamp-list': `${playerHeight(release.tracks)}px` } as CSSProperties}>
      <iframe
        title={`${release.title} by Funkadelic Astronaut on Bandcamp`}
        src={bandcampPlayerSrc(release)}
        loading="lazy"
        seamless
      >
        <a href={release.href}>{release.title} by Funkadelic Astronaut</a>
      </iframe>
    </div>
  );
}
