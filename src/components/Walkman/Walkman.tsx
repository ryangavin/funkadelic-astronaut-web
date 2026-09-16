import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import '../../styles/fonts.css';
import { Cassette } from './Cassette';
import { SegmentDisplay } from './SegmentDisplay';
import { counter, scrollLength, titleFrom, window as displayWindow } from './segments';
import './Walkman.css';

export const WALKMAN_FINISHES = ['silver', 'blue', 'black'] as const;
export type WalkmanFinish = (typeof WALKMAN_FINISHES)[number];
export const WALKMAN_SIDES = ['A', 'B'] as const;
export type WalkmanSide = (typeof WALKMAN_SIDES)[number];
export type WalkmanMode = 'stop' | 'play' | 'ff' | 'rew';

/** Characters across the title display. */
export const WALKMAN_TITLE_CELLS = 10;
/** How often a long title steps along while playing, in milliseconds. */
export const WALKMAN_SCROLL_MS = 320;
/** How fast the tape winds while a key is held, as a multiple of real time. */
export const WALKMAN_WIND_RATE = 8;
/** How far a tap on a wind key jumps, in seconds, for those who cannot hold it. */
export const WALKMAN_SKIP_SECONDS = 10;

export type WalkmanProps = {
  /** The tape: an audio file URL. Without one the display reads NO TAPE. */
  src?: string;
  /** What the display spells out. Defaults to the file's name. */
  title?: string;
  /** Handwriting on the cassette label. Defaults to the title. */
  label?: string;
  /** Which side of the tape is up. */
  side?: WalkmanSide;
  /** The body's finish. */
  finish?: WalkmanFinish;
  /** Tilt of the player in degrees. Negative tilts counter-clockwise. */
  rotation?: number;
  /** Starting volume, 0 to 1. */
  volume?: number;
  /** Whether the tape starts over when it runs out. */
  loop?: boolean;
  onPlay?: () => void;
  onStop?: () => void;
  onEnded?: () => void;
  className?: string;
  style?: React.CSSProperties;
};

const MODE_LABELS: Record<WalkmanMode, string> = { stop: 'Stopped', play: 'Playing', ff: 'Fast forward', rew: 'Rewinding' };

const Rewind = () => (
  <svg viewBox="0 0 24 12" aria-hidden="true">
    <path d="M12 0 1 6l11 6zM23 0 12 6l11 6z" />
  </svg>
);
const Forward = () => (
  <svg viewBox="0 0 24 12" aria-hidden="true">
    <path d="M1 0l11 6-11 6zM12 0l11 6-11 6z" />
  </svg>
);
const Play = () => (
  <svg viewBox="0 0 12 12" aria-hidden="true">
    <path d="M1 0l11 6-11 6z" />
  </svg>
);
const Stop = () => (
  <svg viewBox="0 0 12 12" aria-hidden="true">
    <rect width="12" height="12" />
  </svg>
);

/**
 * A pocket cassette player: a segmented display spells out the track and
 * counts it along, the cassette turns behind the door, and piano keys work
 * the transport. Underneath it is a plain audio element playing `src`.
 */
export function Walkman({
  src,
  title,
  label,
  side = 'A',
  finish = 'silver',
  rotation = 0,
  volume: initialVolume = 0.8,
  loop = false,
  onPlay,
  onStop,
  onEnded,
  className = '',
  style,
}: WalkmanProps) {
  const audio = useRef<HTMLAudioElement>(null);
  const [mode, setMode] = useState<WalkmanMode>('stop');
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState<number>();
  const [bad, setBad] = useState(false);
  const [offset, setOffset] = useState(0);
  const [volume, setVolume] = useState(initialVolume);

  const winding = useRef<{ direction: 1 | -1; resume: boolean; timer: number; last: number } | null>(null);
  const held = useRef(false);

  const tape = src ? (bad ? 'bad' : 'ok') : 'none';
  const name = title ?? (src ? titleFrom(src) : '');
  const shown = tape === 'ok' ? name : tape === 'bad' ? 'BAD TAPE' : 'NO TAPE';
  const cells = displayWindow(shown, WALKMAN_TITLE_CELLS, offset).join('');
  const readout = counter(tape === 'ok' ? time : undefined);
  const progress = duration ? time / duration : 0;

  // The audio element is the source of truth: keys ask it to play or pause, and
  // the display follows what it reports, so an external pause (a media key, another
  // player) shows correctly too. A pause while winding is our own and is ignored.
  useEffect(() => {
    const element = audio.current;
    if (!element) return;
    const onPlaying = () => setMode('play');
    const onPause = () => {
      if (!winding.current) setMode('stop');
    };
    const onTime = () => setTime(element.currentTime);
    const onDuration = () => setDuration(Number.isFinite(element.duration) ? element.duration : undefined);
    const onError = () => setBad(true);
    element.addEventListener('play', onPlaying);
    element.addEventListener('pause', onPause);
    element.addEventListener('timeupdate', onTime);
    element.addEventListener('seeking', onTime);
    element.addEventListener('loadedmetadata', onDuration);
    element.addEventListener('durationchange', onDuration);
    element.addEventListener('error', onError);
    return () => {
      element.removeEventListener('play', onPlaying);
      element.removeEventListener('pause', onPause);
      element.removeEventListener('timeupdate', onTime);
      element.removeEventListener('seeking', onTime);
      element.removeEventListener('loadedmetadata', onDuration);
      element.removeEventListener('durationchange', onDuration);
      element.removeEventListener('error', onError);
    };
  }, []);

  // A new tape goes in: counter to zero, title from the start.
  useEffect(() => {
    setBad(false);
    setTime(0);
    setDuration(undefined);
    setOffset(0);
    setMode('stop');
  }, [src]);

  useEffect(() => {
    if (audio.current) audio.current.volume = volume;
  }, [volume]);

  // Callbacks report a change of transport, not the resting state at mount.
  const previousMode = useRef(mode);
  useEffect(() => {
    if (previousMode.current === mode) return;
    previousMode.current = mode;
    if (mode === 'play') onPlay?.();
    if (mode === 'stop') onStop?.();
    // Callbacks are notifications of a change, not reasons to re-run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // A title wider than the display crawls while the tape plays and holds still otherwise.
  const length = scrollLength(shown, WALKMAN_TITLE_CELLS);
  useEffect(() => {
    if (mode !== 'play' || length === 0) return;
    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setOffset((step) => (step + 1) % length), WALKMAN_SCROLL_MS);
    return () => clearInterval(timer);
  }, [mode, length]);

  const stopWinding = useCallback(() => {
    const wind = winding.current;
    const element = audio.current;
    if (!wind || !element) return;
    clearInterval(wind.timer);
    winding.current = null;
    if (wind.resume) element.play().catch(() => setMode('stop'));
    else setMode('stop');
  }, []);

  const startWinding = useCallback(
    (direction: 1 | -1) => {
      const element = audio.current;
      if (!element || tape !== 'ok' || winding.current) return;
      held.current = true;
      const resume = !element.paused;
      winding.current = { direction, resume, timer: 0, last: performance.now() };
      element.pause();
      setMode(direction > 0 ? 'ff' : 'rew');
      winding.current.timer = window.setInterval(() => {
        const wind = winding.current;
        if (!wind) return;
        const now = performance.now();
        const step = ((now - wind.last) / 1000) * WALKMAN_WIND_RATE * wind.direction;
        wind.last = now;
        const end = Number.isFinite(element.duration) ? element.duration : Infinity;
        const next = Math.min(end, Math.max(0, element.currentTime + step));
        element.currentTime = next;
        setTime(next);
        if (next <= 0 || next >= end) {
          wind.resume = false;
          stopWinding();
        }
      }, 100);
    },
    [tape, stopWinding],
  );

  const skip = (direction: 1 | -1) => {
    const element = audio.current;
    if (!element || tape !== 'ok') return;
    const end = Number.isFinite(element.duration) ? element.duration : Infinity;
    element.currentTime = Math.min(end, Math.max(0, element.currentTime + direction * WALKMAN_SKIP_SECONDS));
    setTime(element.currentTime);
  };

  useEffect(() => stopWinding, [stopWinding]);

  const play = () => {
    if (tape !== 'ok') return;
    audio.current?.play().catch(() => setMode('stop'));
  };
  const stop = () => {
    if (winding.current) {
      winding.current.resume = false;
      stopWinding();
    }
    audio.current?.pause();
  };

  /* A wind key seeks while held, by pointer or by keyboard; a bare click, as from
     assistive technology, jumps instead. */
  const windKey = (direction: 1 | -1) => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) return;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // A pointer the browser does not know (a synthetic event); the key still winds.
      }
      startWinding(direction);
    },
    onPointerUp: stopWinding,
    onPointerCancel: stopWinding,
    onLostPointerCapture: stopWinding,
    onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) startWinding(direction);
    },
    onKeyUp: (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === ' ' || event.key === 'Enter') stopWinding();
    },
    onBlur: stopWinding,
    onClick: () => {
      if (winding.current || held.current) {
        held.current = false;
        return;
      }
      skip(direction);
    },
  });

  const disabled = tape !== 'ok';
  const cssVars = { '--walkman-rotation': `${rotation}deg`, '--walkman-volume': volume } as React.CSSProperties;

  return (
    <div
      className={`walkman ${className}`}
      data-finish={finish}
      data-mode={mode}
      data-tape={tape}
      style={{ ...cssVars, ...style }}
      role="group"
      aria-label={name ? `Cassette player: ${name}` : 'Cassette player'}
    >
      <div className="walkman__body">
        <div className="walkman__door">
          <div className="walkman__window">
            <Cassette label={label ?? name} side={side} progress={progress} />
          </div>
          <div className="walkman__lcd" data-blink={mode === 'play' ? '' : undefined}>
            <SegmentDisplay className="walkman__title" text={cells} cells={WALKMAN_TITLE_CELLS} />
            <div className="walkman__flags">
              <span className="walkman__flag" data-lit={mode === 'rew' ? '' : undefined}>
                <Rewind />
              </span>
              <span className="walkman__flag" data-lit={mode === 'play' ? '' : undefined}>
                <Play />
              </span>
              <span className="walkman__flag" data-lit={mode === 'ff' ? '' : undefined}>
                <Forward />
              </span>
              <span className="walkman__flag" data-lit={mode === 'stop' && tape === 'ok' ? '' : undefined}>
                <Stop />
              </span>
            </div>
            <SegmentDisplay className="walkman__counter" text={readout} kind="digit" />
            <SegmentDisplay className="walkman__side" text={tape === 'ok' ? side : ' '} cells={1} />
          </div>
          <span className="walkman__print">
            stereo cassette player
            <em>auto stop · dolby nr</em>
          </span>
          <span className="walkman__open">open ▸</span>
        </div>

        <div className="walkman__keys">
          <button type="button" className="walkman__key walkman__key--rew" aria-label="Rewind" disabled={disabled} {...windKey(-1)}>
            <Rewind />
            <span>Rew</span>
          </button>
          <button
            type="button"
            className="walkman__key walkman__key--play"
            aria-label="Play"
            aria-pressed={mode === 'play'}
            disabled={disabled}
            onClick={play}
          >
            <Play />
            <span>Play</span>
          </button>
          <button type="button" className="walkman__key walkman__key--ff" aria-label="Fast forward" disabled={disabled} {...windKey(1)}>
            <Forward />
            <span>FF</span>
          </button>
          <button type="button" className="walkman__key walkman__key--stop" aria-label="Stop" disabled={disabled} onClick={stop}>
            <Stop />
            <span>Stop</span>
          </button>
        </div>

        <span className="walkman__jack" aria-hidden="true">
          <i />
          <b>phones</b>
        </span>
      </div>

      <label className="walkman__wheel">
        <input
          type="range"
          min={0}
          max={1}
          step={0.02}
          value={volume}
          aria-label="Volume"
          onChange={(event) => setVolume(Number(event.currentTarget.value))}
        />
        <span className="walkman__wheel-print">vol</span>
      </label>

      <audio ref={audio} src={src} preload="metadata" loop={loop} onEnded={onEnded} />
      <span className="walkman__status" role="status" aria-live="polite">
        {tape === 'ok' ? MODE_LABELS[mode] : tape === 'bad' ? 'The tape would not play' : 'No tape'}
      </span>
    </div>
  );
}
