import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { youTubeId } from '../../components/2D/Polaroid/embed';
import { t } from '../../i18n/copy';
import '../styles/newsprint.css';
import './LiveVideo.css';

export type LiveVideoProps = {
  /** The whole set: a video file, or a YouTube link. */
  video: string;
  /** A short silent cut from the set, played muted and looping as the hero. */
  loop: string;
  /** The same cut, smaller, for narrow screens (below the site's 680px breakpoint). Without it they get `loop`. */
  narrowLoop?: string;
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

/** The site's narrow breakpoint (tokens.css). */
const NARROW = '(max-width: 679px)';

/** The longest the loop waits for the page's load event after hydration before it starts anyway. */
const LOOP_WAIT_MS = 2500;

/**
 * The live set as the page's hero: a silent cut of it loops, muted, once
 * the page has loaded, served from the site so it starts at once with no
 * player chrome over it. One press swaps in the whole set, with sound and
 * controls. Anyone who asks for reduced motion gets the still and a play
 * button instead of the loop, and never downloads it.
 */
export function LiveVideo({ video, loop, narrowLoop, poster, title, label, className = '' }: LiveVideoProps) {
  // The page is pre-rendered, where there is no visitor to ask, so it starts as the loop (a video showing its poster,
  // with no `src` and no `autoplay`) and turns to the still before the browser next paints if they want less motion.
  const [mode, setMode] = useState<'loop' | 'still' | 'playing'>('loop');
  // The loop's file, chosen for the screen once the page has loaded; until then the video downloads nothing.
  const [loopSrc, setLoopSrc] = useState<string>();
  const clip = useRef<HTMLVideoElement>(null);
  const player = useRef<HTMLIFrameElement & HTMLVideoElement>(null);
  const id = youTubeId(video);

  useLayoutEffect(() => {
    if (prefersStill()) setMode(current => (current === 'loop' ? 'still' : current));
  }, []);

  // The loop waits for the page's load event, so it doesn't compete with the first screen for the network, but no
  // longer than LOOP_WAIT_MS: a slow third party (Bandcamp's player) holding up `load` must not hold up the loop.
  // Either way it starts in a task after the next frame has painted.
  useEffect(() => {
    if (mode !== 'loop' || loopSrc || prefersStill()) return;
    const choose = () => setLoopSrc(narrowLoop && matchMedia(NARROW).matches ? narrowLoop : loop);
    let frame: number | undefined;
    let afterFrame: number | undefined;
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      window.removeEventListener('load', start);
      window.clearTimeout(fallback);
      frame = requestAnimationFrame(() => {
        afterFrame = window.setTimeout(choose);
      });
    };
    const fallback = window.setTimeout(start, LOOP_WAIT_MS);
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => {
      window.removeEventListener('load', start);
      window.clearTimeout(fallback);
      if (frame !== undefined) cancelAnimationFrame(frame);
      if (afterFrame !== undefined) window.clearTimeout(afterFrame);
    };
  }, [mode, loopSrc, loop, narrowLoop]);

  // React does not reflect `muted` as an attribute, and browsers only autoplay a muted video. The loop is started
  // here, not by `autoplay`, so nothing moves before reduced motion has been asked about.
  useEffect(() => {
    const element = clip.current;
    if (mode !== 'loop' || !loopSrc || !element || prefersStill()) return;
    element.muted = true;
    // Only a refusal to autoplay means the still; a hidden tab pausing it to save power plays again when shown.
    element.play().catch((error: DOMException) => {
      if (error.name === 'NotAllowedError') setMode('still');
    });
  }, [mode, loopSrc]);

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
        <video ref={clip} className="live-video__loop" src={loopSrc} poster={poster} muted loop playsInline preload="auto" aria-hidden="true" />
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
