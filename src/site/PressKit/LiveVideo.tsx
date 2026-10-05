import { type ReactNode, useEffect, useRef, useState } from 'react';
import { youTubeId } from '../../components/2D/Polaroid/embed';
import { t } from '../../i18n/copy';
import '../styles/newsprint.css';
import './LiveVideo.css';

export type LiveVideoProps = {
  /** The whole set: a video file, or a YouTube link. */
  video: string;
  /** A short silent cut from the set, played muted and looping as the hero. */
  loop: string;
  /** A frame from that cut: shown while it loads, and instead of it for anyone who asks for reduced motion. */
  poster: string;
  title: string;
  /** What the set is, printed on the video's corner. */
  label?: ReactNode;
  className?: string;
};

/** The ordinary YouTube player, with sound and controls, starting as soon as it loads because a click asked for it. */
const youTubePlayer = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?${new URLSearchParams({ autoplay: '1', playsinline: '1', rel: '0' })}`;

const prefersStill = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * The live set as the page's hero: a silent cut of it loops, muted, as soon
 * as the page opens, served from the site so it starts at once with no
 * player chrome over it. One press swaps in the whole set on YouTube, with
 * sound and controls. Anyone who asks for reduced motion gets the still and a
 * play button instead of the loop.
 */
export function LiveVideo({ video, loop, poster, title, label, className = '' }: LiveVideoProps) {
  const [mode, setMode] = useState<'loop' | 'still' | 'playing'>(() => (prefersStill() ? 'still' : 'loop'));
  const clip = useRef<HTMLVideoElement>(null);
  const player = useRef<HTMLIFrameElement & HTMLVideoElement>(null);
  const id = youTubeId(video);

  // React does not reflect `muted` as an attribute, and browsers only autoplay a muted video.
  useEffect(() => {
    const element = clip.current;
    if (mode !== 'loop' || !element) return;
    element.muted = true;
    // Only a refusal to autoplay means the still; a hidden tab pausing it to save power plays again when shown.
    element.play().catch((error: DOMException) => {
      if (error.name === 'NotAllowedError') setMode('still');
    });
  }, [mode]);

  // The button vanishes on press; keep keyboard focus in place on the player.
  useEffect(() => {
    if (mode === 'playing') player.current?.focus();
  }, [mode]);

  if (mode === 'playing') {
    return (
      <div className={`live-video ${className}`} data-mode={mode}>
        {id ? (
          <iframe
            ref={player}
            src={youTubePlayer(id)}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <video ref={player} src={video} poster={poster} controls autoPlay playsInline aria-label={title} />
        )}
      </div>
    );
  }

  return (
    <div className={`live-video ${className}`} data-mode={mode}>
      {mode === 'loop' ? (
        <video ref={clip} className="live-video__loop" src={loop} poster={poster} muted loop playsInline autoPlay preload="auto" aria-hidden="true" />
      ) : (
        <img className="live-video__loop" src={poster} alt="" />
      )}
      {label ? <p className="live-video__label epk-label">{label}</p> : null}
      <button type="button" className="live-video__start" onClick={() => setMode('playing')}>
        <span className="live-video__play" aria-hidden="true" />
        <span className="live-video__cta">{mode === 'loop' ? t('pressKit.live.watch') : t('pressKit.live.play')}</span>
        <span className="visually-hidden"> {title}</span>
      </button>
    </div>
  );
}
