import { type ReactNode, useEffect, useRef, useState } from 'react';
import { youTubeId, youTubePreview } from '../../components/2D/Polaroid/embed';
import type { LiveSet } from '../../sections/BandDossier/bandMembers';

export type LiveVideoProps = {
  set: LiveSet;
  /** The still shown when the preview can't run (reduced motion), until someone presses play. */
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
 * The live video as the page's hero: it plays muted and looping as soon as
 * the page opens, and one press swaps in YouTube's own player with sound and
 * controls from the start. Anyone who asks for reduced motion gets a still
 * with a play button instead of the moving preview.
 */
export function LiveVideo({ set, poster, title, label, className = '' }: LiveVideoProps) {
  const [mode, setMode] = useState<'preview' | 'still' | 'playing'>(() => (prefersStill() ? 'still' : 'preview'));
  const player = useRef<HTMLIFrameElement>(null);
  const id = youTubeId(set.video);
  // The button vanishes on press; keep keyboard focus in place on the player.
  useEffect(() => {
    if (mode === 'playing') player.current?.focus();
  }, [mode]);

  if (!id) {
    return (
      <div className={`live-video ${className}`}>
        <video src={set.video} poster={poster} controls playsInline preload="metadata" aria-label={title} />
      </div>
    );
  }

  return (
    <div className={`live-video ${className}`} data-mode={mode}>
      {mode === 'playing' ? (
        <iframe
          ref={player}
          src={youTubePlayer(id)}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : mode === 'preview' ? (
        // Muted preview only: no controls, and the sound button below is the way in.
        <iframe
          src={`${youTubePreview(id)}&enablejsapi=1`}
          title={`${title}, muted preview`}
          allow="autoplay; encrypted-media"
          tabIndex={-1}
          aria-hidden="true"
          onLoad={event => {
            // Some browsers ignore the autoplay parameter on a fresh embed; ask the player directly, muted.
            const player = event.currentTarget.contentWindow;
            for (const func of ['mute', 'playVideo']) player?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');
          }}
        />
      ) : (
        <img className="live-video__still" src={poster} alt="" />
      )}
      {mode !== 'playing' ? (
        <>
          {label ? <p className="live-video__label">{label}</p> : null}
          <button type="button" className="live-video__start" onClick={() => setMode('playing')}>
            <span className="live-video__play" aria-hidden="true" />
            <span className="live-video__cta">{mode === 'preview' ? 'Watch with sound' : 'Play'}</span>
            <span className="visually-hidden"> {title}</span>
          </button>
        </>
      ) : null}
    </div>
  );
}
