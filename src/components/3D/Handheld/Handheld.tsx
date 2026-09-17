import type React from 'react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import '../../../styles/fonts.css';
import { youTubeId } from '../../2D/Polaroid/embed';
import { YOUTUBE_ORIGIN, clock, command, discTitle, listening, modeOf, parseMessage, stepVolume, youTubeDisc, type HandheldMode } from './player';
import './Handheld.css';

export { clock, discTitle, modeOf, stepVolume, youTubeDisc, type HandheldMode } from './player';

export const HANDHELD_FINISHES = ['black', 'silver', 'white'] as const;
export type HandheldFinish = (typeof HANDHELD_FINISHES)[number];

/** How far the directional pad steps through the video, in seconds. */
export const HANDHELD_SEEK_SECONDS = 10;
/** How far a shoulder button skips, in seconds. */
export const HANDHELD_SKIP_SECONDS = 30;
/** The screen's brightness levels, full first, stepped down and round by the display button. */
export const HANDHELD_BRIGHTNESS = [1.12, 0.85, 0.6] as const;

export type HandheldProps = {
  /** The disc: a YouTube link, or a video file. Without one the screen idles. */
  video?: string;
  /** The name on the screen. Defaults to what YouTube reports, or the file's name. */
  title?: string;
  /** The shell's finish. */
  finish?: HandheldFinish;
  /** Tilt of the console in degrees. Negative tilts counter-clockwise. */
  rotation?: number;
  /** Starting volume, 0 to 1. */
  volume?: number;
  /** Whether the sound starts off. It must, for the picture to start on its own. */
  muted?: boolean;
  /** Whether the video starts over when it ends. */
  loop?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  className?: string;
  style?: React.CSSProperties;
};

const MODE_LABELS: Record<HandheldMode, string> = { off: 'No disc', loading: 'Loading', play: 'Playing', pause: 'Paused', end: 'Finished' };

const Arrow = () => (
  <svg viewBox="0 0 10 6" aria-hidden="true">
    <path d="M5 0l5 6H0z" />
  </svg>
);
const Triangle = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 2.5l6 11H2z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);
const Circle = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);
const Cross = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3 3l10 10M13 3L3 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const Square = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <rect x="3" y="3" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);
const House = () => (
  <svg viewBox="0 0 12 12" aria-hidden="true">
    <path d="M6 1.5L1 6h1.5v4.5h7V6H11z" />
  </svg>
);

/** The idle screen: a slow wave over deep blue, the way a console rests on its menu. */
const Wave = () => (
  <svg className="handheld__wave" viewBox="0 0 403 227" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id="handheld-wave-stroke" x1="0" x2="1">
        <stop offset="0" stopColor="#9275b2" stopOpacity="0" />
        <stop offset="0.3" stopColor="#9275b2" stopOpacity="0.9" />
        <stop offset="0.7" stopColor="#639ec8" stopOpacity="0.9" />
        <stop offset="1" stopColor="#639ec8" stopOpacity="0" />
      </linearGradient>
    </defs>
    <g className="handheld__wave-band">
      <path d="M-403 150c70-40 130-60 200-30s130 60 200 30 130-60 200-30 130 60 200 30 130-60 200-30 130 60 200 30" />
      <path d="M-403 130c70-30 130-70 200-40s130 70 200 40 130-70 200-40 130 70 200 40 130-70 200-40 130 70 200 40" />
      <path d="M-403 170c70-20 130-50 200-30s130 50 200 30 130-50 200-30 130 50 200 30 130-50 200-30 130 50 200 30" />
    </g>
  </svg>
);

/**
 * A pocket games console in the proportions of the classic widescreen handheld,
 * 170 by 74 millimetres: a glossy black plate carries the 4.3 inch screen and the
 * row of small keys beneath it, the directional pad and analog nub sit to the
 * left, the four face buttons to the right, and the shoulder buttons show over
 * the top edge. The screen plays the disc: a YouTube link through the embedded
 * player, worked over messages, or a video file. Cross and Start play and pause,
 * Circle stops, the pad steps through the video and works the volume, the
 * shoulders skip, and the small keys mute, dim the screen and show the readout.
 */
export function Handheld({
  video,
  title,
  finish = 'black',
  rotation = 0,
  volume: initialVolume = 0.8,
  muted: initialMuted = true,
  loop = true,
  onPlay,
  onPause,
  onEnded,
  className = '',
  style,
}: HandheldProps) {
  const id = useId().replace(/:/g, '');
  const frame = useRef<HTMLIFrameElement>(null);
  const clip = useRef<HTMLVideoElement>(null);
  const youTube = video ? youTubeId(video) : undefined;
  const file = video && !youTube ? video : undefined;

  const [mode, setMode] = useState<HandheldMode>(video ? 'loading' : 'off');
  const [bad, setBad] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState<number>();
  const [volume, setVolume] = useState(initialVolume);
  const [muted, setMuted] = useState(initialMuted);
  const [repeat, setRepeat] = useState(loop);
  const [info, setInfo] = useState(false);
  const [brightness, setBrightness] = useState(0);
  const [home, setHome] = useState(false);
  const [heard, setHeard] = useState<string>();

  const disc = video ? (bad ? 'bad' : 'ok') : 'none';
  const name = title ?? heard ?? (file ? discTitle(file) : '');
  const wanted = useRef({ volume, muted });
  wanted.current = { volume, muted };

  const post = useCallback(
    (func: string, args: unknown[] = []) => {
      frame.current?.contentWindow?.postMessage(JSON.stringify(command(func, args, id)), YOUTUBE_ORIGIN);
    },
    [id],
  );

  // The frame is the source of truth for a YouTube disc: the keys ask it, and the
  // screen follows what it reports, so a click on the picture shows correctly too.
  useEffect(() => {
    if (!youTube) return;
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== YOUTUBE_ORIGIN || !frame.current || event.source !== frame.current.contentWindow) return;
      const message = parseMessage(event.data);
      if (!message) return;
      if (message.event === 'onReady') {
        setMode((current) => (current === 'loading' ? 'pause' : current));
        post('setVolume', [Math.round(wanted.current.volume * 100)]);
        if (!wanted.current.muted) post('unMute');
        return;
      }
      if (message.event === 'onError') {
        setBad(true);
        return;
      }
      if (typeof message.info === 'number') {
        setMode(modeOf(message.info));
        return;
      }
      const report = message.info;
      if (!report) return;
      if (report.playerState !== undefined) setMode(modeOf(report.playerState));
      if (report.currentTime !== undefined) setTime(report.currentTime);
      if (report.duration) setDuration(report.duration);
      if (report.volume !== undefined) setVolume(report.volume / 100);
      if (report.muted !== undefined) setMuted(report.muted);
      if (report.videoData?.title) setHeard(report.videoData.title);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [youTube, post]);

  const onFrameLoad = () => frame.current?.contentWindow?.postMessage(JSON.stringify(listening(id)), YOUTUBE_ORIGIN);

  // A video file: the element reports, and starts muted on its own like a preview.
  useEffect(() => {
    const element = clip.current;
    if (!element || !file) return;
    element.muted = wanted.current.muted;
    element.defaultMuted = wanted.current.muted;
    element.volume = wanted.current.volume;
    const onPlaying = () => setMode('play');
    const onPause = () => setMode((current) => (current === 'end' ? current : 'pause'));
    const onEnd = () => setMode('end');
    const onTime = () => setTime(element.currentTime);
    const onDuration = () => setDuration(Number.isFinite(element.duration) ? element.duration : undefined);
    const onError = () => setBad(true);
    const onReady = () => setMode((current) => (current === 'loading' ? 'pause' : current));
    element.addEventListener('play', onPlaying);
    element.addEventListener('pause', onPause);
    element.addEventListener('ended', onEnd);
    element.addEventListener('timeupdate', onTime);
    element.addEventListener('seeking', onTime);
    element.addEventListener('loadedmetadata', onDuration);
    element.addEventListener('durationchange', onDuration);
    element.addEventListener('canplay', onReady);
    element.addEventListener('error', onError);
    if (wanted.current.muted) element.play().catch(() => {});
    return () => {
      element.removeEventListener('play', onPlaying);
      element.removeEventListener('pause', onPause);
      element.removeEventListener('ended', onEnd);
      element.removeEventListener('timeupdate', onTime);
      element.removeEventListener('seeking', onTime);
      element.removeEventListener('loadedmetadata', onDuration);
      element.removeEventListener('durationchange', onDuration);
      element.removeEventListener('canplay', onReady);
      element.removeEventListener('error', onError);
    };
  }, [file]);

  // A new disc goes in: clock to zero, screen on, name from the disc.
  useEffect(() => {
    setBad(false);
    setTime(0);
    setDuration(undefined);
    setHeard(undefined);
    setHome(false);
    setMode(video ? 'loading' : 'off');
  }, [video]);

  // Callbacks report a change of transport, not the resting state at mount.
  const previousMode = useRef(mode);
  useEffect(() => {
    if (previousMode.current === mode) return;
    previousMode.current = mode;
    if (mode === 'play') onPlay?.();
    if (mode === 'pause') onPause?.();
    if (mode === 'end') onEnded?.();
    // Callbacks are notifications of a change, not reasons to re-run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const ready = disc === 'ok' && mode !== 'loading';

  const play = () => {
    if (!ready) return;
    setHome(false);
    if (youTube) post('playVideo');
    else clip.current?.play().catch(() => {});
  };
  const pause = () => {
    if (youTube) post('pauseVideo');
    else clip.current?.pause();
  };
  const toggle = () => (mode === 'play' ? pause() : play());
  const seekTo = (target: number) => {
    const end = duration ?? Number.POSITIVE_INFINITY;
    const next = Math.min(end, Math.max(0, target));
    if (youTube) post('seekTo', [next, true]);
    else if (clip.current) clip.current.currentTime = next;
    setTime(next);
  };
  const seek = (delta: number) => {
    if (ready) seekTo(time + delta);
  };
  const stop = () => {
    if (!ready) return;
    pause();
    seekTo(0);
  };
  const goHome = () => {
    if (!ready) return;
    pause();
    setHome(true);
  };
  const level = (direction: 1 | -1) => {
    const next = stepVolume(volume, direction);
    setVolume(next);
    setMuted(false);
    if (youTube) {
      post('setVolume', [Math.round(next * 100)]);
      post('unMute');
    } else if (clip.current) {
      clip.current.volume = next;
      clip.current.muted = false;
    }
  };
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (youTube) post(next ? 'mute' : 'unMute');
    else if (clip.current) clip.current.muted = next;
  };
  const toggleRepeat = () => {
    const next = !repeat;
    setRepeat(next);
    if (youTube) post('setLoop', [next]);
    else if (clip.current) clip.current.loop = next;
  };
  const dim = () => setBrightness((step) => (step + 1) % HANDHELD_BRIGHTNESS.length);

  const idle = disc !== 'ok' || home;
  const status = disc === 'bad' ? 'The disc would not play' : home ? 'Home' : MODE_LABELS[mode];
  const cssVars = {
    '--handheld-rotation': `${rotation}deg`,
    '--handheld-brightness': HANDHELD_BRIGHTNESS[brightness],
  } as React.CSSProperties;

  return (
    <div
      className={`handheld ${className}`}
      data-finish={finish}
      data-mode={mode}
      data-disc={disc}
      data-idle={idle ? '' : undefined}
      style={{ ...cssVars, ...style }}
      role="group"
      aria-label={name ? `Handheld player: ${name}` : 'Handheld player'}
    >
      <button type="button" className="handheld__shoulder handheld__shoulder--l" aria-label={`Skip back ${HANDHELD_SKIP_SECONDS} seconds`} disabled={!ready} onClick={() => seek(-HANDHELD_SKIP_SECONDS)}>
        L
      </button>
      <button type="button" className="handheld__shoulder handheld__shoulder--r" aria-label={`Skip forward ${HANDHELD_SKIP_SECONDS} seconds`} disabled={!ready} onClick={() => seek(HANDHELD_SKIP_SECONDS)}>
        R
      </button>

      <div className="handheld__body">
        <div className="handheld__plate">
          <div className="handheld__screen" onClick={file ? toggle : undefined}>
            <Wave />
            {youTube ? (
              <div className="handheld__embed" hidden={home}>
                <iframe
                  ref={frame}
                  className="handheld__player"
                  src={youTubeDisc(youTube, typeof location === 'undefined' ? '' : location.origin, { muted: initialMuted, loop })}
                  title={name || 'Video'}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  onLoad={onFrameLoad}
                />
              </div>
            ) : file ? (
              <video ref={clip} className="handheld__player" src={file} hidden={home} loop={repeat} playsInline preload="metadata" aria-label={name || undefined} />
            ) : null}
            <div className="handheld__osd" data-shown={disc === 'ok' && !home && (info || mode !== 'play') ? '' : undefined} aria-hidden="true">
              <span className="handheld__osd-mode">{mode === 'play' ? '▶' : mode === 'end' ? '■' : mode === 'loading' ? '…' : '❚❚'}</span>
              <span className="handheld__osd-title">{name}</span>
              {repeat ? <span className="handheld__osd-flag">repeat</span> : null}
              {muted ? <span className="handheld__osd-flag">mute</span> : null}
              <span className="handheld__osd-clock">
                {clock(time)} / {clock(duration)}
              </span>
            </div>
          </div>

          <div className="handheld__strip handheld__strip--left">
            <span className="handheld__cell">
              <button type="button" className="handheld__key handheld__key--home" aria-label="Home" disabled={!ready} onClick={goHome}>
                <House />
              </button>
              <span className="handheld__legend">home</span>
            </span>
            <span className="handheld__cell">
              <button type="button" className="handheld__key handheld__key--pill" aria-label="Volume down" disabled={!ready} onClick={() => level(-1)} />
              <span className="handheld__legend">vol −</span>
            </span>
            <span className="handheld__cell">
              <button type="button" className="handheld__key handheld__key--pill" aria-label="Volume up" disabled={!ready} onClick={() => level(1)} />
              <span className="handheld__legend">vol +</span>
            </span>
            <span className="handheld__cell">
              <button type="button" className="handheld__key handheld__key--pill" aria-label="Display brightness" onClick={dim} />
              <span className="handheld__legend">display</span>
            </span>
            <span className="handheld__cell">
              <button type="button" className="handheld__key handheld__key--pill" aria-label="Sound" aria-pressed={!muted} disabled={!ready} onClick={toggleMute} />
              <span className="handheld__legend">sound</span>
            </span>
          </div>
          <div className="handheld__strip handheld__strip--right">
            <span className="handheld__cell">
              <button type="button" className="handheld__key handheld__key--pill handheld__key--long" aria-label="Select: show readout" aria-pressed={info} onClick={() => setInfo((shown) => !shown)} />
              <span className="handheld__legend">select</span>
            </span>
            <span className="handheld__cell">
              <button type="button" className="handheld__key handheld__key--pill handheld__key--long" aria-label={mode === 'play' ? 'Start: pause' : 'Start: play'} disabled={!ready} onClick={toggle} />
              <span className="handheld__legend">start</span>
            </span>
          </div>
          <span className="handheld__print">
            portable entertainment
            <em>wide screen · 30:17</em>
          </span>
        </div>

        <div className="handheld__pad">
          <button type="button" className="handheld__key handheld__key--arm handheld__key--up" aria-label="Volume up" disabled={!ready} onClick={() => level(1)}>
            <Arrow />
          </button>
          <button type="button" className="handheld__key handheld__key--arm handheld__key--left" aria-label={`Back ${HANDHELD_SEEK_SECONDS} seconds`} disabled={!ready} onClick={() => seek(-HANDHELD_SEEK_SECONDS)}>
            <Arrow />
          </button>
          <span className="handheld__key handheld__key--arm handheld__key--centre" aria-hidden="true" />
          <button type="button" className="handheld__key handheld__key--arm handheld__key--right" aria-label={`Forward ${HANDHELD_SEEK_SECONDS} seconds`} disabled={!ready} onClick={() => seek(HANDHELD_SEEK_SECONDS)}>
            <Arrow />
          </button>
          <button type="button" className="handheld__key handheld__key--arm handheld__key--down" aria-label="Volume down" disabled={!ready} onClick={() => level(-1)}>
            <Arrow />
          </button>
        </div>
        <span className="handheld__nub" aria-hidden="true" />

        <div className="handheld__buttons">
          <button type="button" className="handheld__key handheld__key--face handheld__key--triangle" aria-label="Triangle: show readout" aria-pressed={info} onClick={() => setInfo((shown) => !shown)}>
            <Triangle />
          </button>
          <button type="button" className="handheld__key handheld__key--face handheld__key--circle" aria-label="Circle: stop" disabled={!ready} onClick={stop}>
            <Circle />
          </button>
          <button type="button" className="handheld__key handheld__key--face handheld__key--cross" aria-label={mode === 'play' ? 'Cross: pause' : 'Cross: play'} disabled={!ready} onClick={toggle}>
            <Cross />
          </button>
          <button type="button" className="handheld__key handheld__key--face handheld__key--square" aria-label="Square: repeat" aria-pressed={repeat} disabled={!ready} onClick={toggleRepeat}>
            <Square />
          </button>
        </div>

        <span className="handheld__speaker handheld__speaker--l" aria-hidden="true" />
        <span className="handheld__speaker handheld__speaker--r" aria-hidden="true" />
        <span className="handheld__led" data-lit={disc === 'ok' ? '' : undefined} aria-hidden="true">
          <i />
          <b>power</b>
        </span>
      </div>

      <span className="handheld__status" role="status" aria-live="polite">
        {status}
      </span>
    </div>
  );
}
