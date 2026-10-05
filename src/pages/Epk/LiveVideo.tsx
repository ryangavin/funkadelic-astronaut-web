import { useState } from 'react';
import { youTubeId } from '../../components/2D/Polaroid/embed';
import type { LiveSet } from '../../sections/BandDossier/bandMembers';

export type LiveVideoProps = {
  set: LiveSet;
  /** The still shown until someone presses play. */
  poster: string;
  title: string;
  className?: string;
};

/** The ordinary YouTube player, with sound and controls, starting as soon as it loads because a click asked for it. */
const youTubePlayer = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?${new URLSearchParams({ autoplay: '1', playsinline: '1', rel: '0' })}`;

/**
 * A live video that costs nothing until it is wanted: a still with a play
 * button, swapped for YouTube's player on click. An agent reading the page
 * watches it with sound, so unlike the Polaroid's preview it is not muted.
 */
export function LiveVideo({ set, poster, title, className = '' }: LiveVideoProps) {
  const [playing, setPlaying] = useState(false);
  const id = youTubeId(set.video);
  return (
    <div className={`live-video ${className}`} data-playing={playing ? '' : undefined}>
      {!id ? (
        <video src={set.video} poster={poster} controls playsInline preload="none" aria-label={title} />
      ) : playing ? (
        <iframe
          src={youTubePlayer(id)}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <button type="button" className="live-video__start" onClick={() => setPlaying(true)} aria-label={`Play ${title}`}>
          <img src={poster} alt="" loading="lazy" />
          <span className="live-video__play" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
