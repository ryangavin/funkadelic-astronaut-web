import { type CSSProperties, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FEATURED_RELEASE, type BandcampRelease } from '../../content/releases';

/** The two embeds Bandcamp offers that suit the page: the whole player with its track list, or the cover alone with a play button. */
export type BandcampEmbed = 'tracklist' | 'artwork';

/** Bandcamp's large player, drawn on the newsprint in its ink. */
export const bandcampPlayerSrc = (release: BandcampRelease, embed: BandcampEmbed = 'tracklist') =>
  `https://bandcamp.com/EmbeddedPlayer/album=${release.albumId}/size=large/bgcol=ece1c6/linkcol=5b48b0/${
    embed === 'artwork' ? 'minimal=true' : 'tracklist=true'
  }/transparent=true/`;

/** The large player with its cover is its own width tall, plus the transport, plus a row per track. */
const playerHeight = (tracks: number) => 120 + 33 * tracks + 20;

/** Below the cover, the transport and the first few tracks need this much before the full player is worth showing. */
const TRACKLIST_MIN_EXTRA = 220;

export type BandcampPlayerProps = {
  release?: BandcampRelease;
  /**
   * Fit the player to the box it is given rather than to its own content:
   * the full player, its track list scrolling, when there is room for the
   * cover and a few tracks; otherwise the cover alone, as large a square as
   * fits. The box must take its height from its surroundings.
   */
  fit?: boolean;
  className?: string;
};

/** The featured release in Bandcamp's own player: cover, play button and track list. */
export function BandcampPlayer({ release = FEATURED_RELEASE, fit = false, className = '' }: BandcampPlayerProps) {
  const { t } = useTranslation('pressKit');
  const box = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState<{ width: number; height: number }>();

  useLayoutEffect(() => {
    const element = box.current;
    if (!fit || !element) return;
    // Where the stylesheet stops fitting the box (it goes back to static when stacked), the player keeps its whole track list.
    const measure = () =>
      setRoom(getComputedStyle(element).position === 'static' ? undefined : { width: element.clientWidth, height: element.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [fit]);

  const embed: BandcampEmbed = fit && room && room.height < room.width + TRACKLIST_MIN_EXTRA ? 'artwork' : 'tracklist';
  // The cover alone is square: as large as both the width and the height allow.
  const side = room ? Math.min(room.width, room.height) : undefined;

  return (
    <div
      ref={box}
      className={`bandcamp-player ${className}`}
      data-fit={fit ? '' : undefined}
      data-embed={embed}
      style={{ '--bandcamp-list': `${playerHeight(release.tracks)}px` } as CSSProperties}
    >
      <iframe
        key={embed}
        title={t('bandcamp.title', { title: release.title })}
        src={bandcampPlayerSrc(release, embed)}
        loading="lazy"
        seamless
        style={embed === 'artwork' && side ? { width: side, height: side } : undefined}
      >
        <a href={release.href}>{t('bandcamp.fallback', { title: release.title })}</a>
      </iframe>
    </div>
  );
}
