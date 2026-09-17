import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { beep as beepTone } from './sound';

/*
  A microcassette answering machine in the Panasonic Easa-Phone mould: a wedge
  of beige plastic 230 millimetres across and 200 deep, 65 high at the back and
  35 at the front, so the whole top face tips toward whoever is sitting at the
  desk. The lift-up door at the back left holds a microcassette — 50 by 33 by 8
  millimetres, a third the size of a compact cassette — behind a smoked window.
  Beside it a two-digit red LED counts the messages, with the lamps under it.
  The four transport keys run in a row along the front: back, play, skip, stop,
  44 millimetres each on a 52-millimetre pitch.

  Underneath all of it is a plain audio element. Play walks the messages one at
  a time and the counter steps with it, with a beep laid between one and the
  next the way the machine lays one on the tape.
*/

/** How wide the machine is, in millimetres. */
export const MACHINE_WIDTH = 230;
/** How deep, in millimetres. */
export const MACHINE_DEPTH = 200;

export type DeskPhoneMessage = {
  /** Who left it, as it would go on the message pad. */
  caller?: string;
  /** When it came in: a date, a time, however the desk writes them down. */
  time?: string;
  /** The recording: an audio file URL. */
  src?: string;
  /** Anything else the desk wants to keep against a message; the machine ignores it. */
  [more: string]: unknown;
};

export type AnsweringMachineProps = {
  /** What is on the tape, oldest first. An empty tape is a fair state: the counter reads nought. */
  messages?: DeskPhoneMessage[];
  /** How loud the recordings play, 0 to 1. */
  volume?: number;
  /** Whether the machine beeps between messages. The recordings play either way. */
  sound?: boolean;
  /** A message starts playing. */
  onPlay?: (message: DeskPhoneMessage, index: number) => void;
  /** A message has run out. */
  onMessageEnded?: (message: DeskPhoneMessage, index: number) => void;
  /** Stop was pressed, or a message would not play. */
  onStop?: () => void;
  /** The last message has run out and the tape has come back to the top. */
  onEnded?: () => void;
  className?: string;
};

/* A seven-segment digit, drawn the way a red LED lamp is: every bar is there,
   the dark ones just are not lit. Twenty millimetres by thirty-four. */
const X0 = 3;
const X1 = 17;
const Y0 = 3;
const YM = 17;
const Y1 = 31;
const T = 3.2;

const across = (y: number) =>
  `${X0},${y} ${X0 + T / 2},${y - T / 2} ${X1 - T / 2},${y - T / 2} ${X1},${y} ${X1 - T / 2},${y + T / 2} ${X0 + T / 2},${y + T / 2}`;
const down = (x: number, a: number, b: number) =>
  `${x},${a} ${x + T / 2},${a + T / 2} ${x + T / 2},${b - T / 2} ${x},${b} ${x - T / 2},${b - T / 2} ${x - T / 2},${a + T / 2}`;

const BARS: Record<string, string> = {
  a: across(Y0),
  b: down(X1, Y0, YM),
  c: down(X1, YM, Y1),
  d: across(Y1),
  e: down(X0, YM, Y1),
  f: down(X0, Y0, YM),
  g: across(YM),
};

const LIT: Record<string, string> = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abged',
  '3': 'abgcd',
  '4': 'fgbc',
  '5': 'afgcd',
  '6': 'afgedc',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abfgcd',
  E: 'adefg',
  '-': 'g',
  ' ': '',
};

/** The red LED readout: two digits, right aligned, blank rather than a leading nought. */
function Counter({ text }: { text: string }) {
  const cells = [...text.padStart(2, ' ')].slice(-2);
  return (
    <svg className="desk-phone__led" viewBox="0 0 44 34" aria-hidden="true" focusable="false">
      {cells.map((char, cell) => (
        <g key={cell} transform={`translate(${cell * 22} 0)`}>
          {Object.entries(BARS).map(([bar, points]) => (
            <polygon key={bar} className="desk-phone__led-bar" data-lit={(LIT[char] ?? '').includes(bar) ? '' : undefined} points={points} />
          ))}
        </g>
      ))}
    </svg>
  );
}

const Back = () => (
  <svg viewBox="0 0 24 12" aria-hidden="true">
    <path d="M12 0 1 6l11 6zM23 0 12 6l11 6z" />
  </svg>
);
const Skip = () => (
  <svg viewBox="0 0 24 12" aria-hidden="true">
    <path d="M1 0l11 6-11 6zM12 0l11 6-11 6z" />
  </svg>
);
const Play = () => (
  <svg viewBox="0 0 12 12" aria-hidden="true">
    <path d="M1 0l11 6-11 6z" />
  </svg>
);
const Halt = () => (
  <svg viewBox="0 0 12 12" aria-hidden="true">
    <rect width="12" height="12" />
  </svg>
);

/**
 * The answering machine beside the phone: the counter, the four keys, the
 * microcassette behind its door and the lamps. It plays the messages through
 * a plain audio element, one after another, beeping between them.
 */
export function AnsweringMachine({
  messages = [],
  volume = 0.8,
  sound = true,
  onPlay,
  onMessageEnded,
  onStop,
  onEnded,
  className = '',
}: AnsweringMachineProps) {
  const audio = useRef<HTMLAudioElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [fault, setFault] = useState(false);
  /* Whether the tape has been cued off the top. Until a key is touched the LED
     counts how many there are; once it has, it counts which one is up. */
  const [cued, setCued] = useState(false);

  const count = messages.length;
  const at = Math.min(index, Math.max(0, count - 1));
  const current: DeskPhoneMessage | undefined = messages[at];
  const tally = !playing && !cued && !fault;

  /* A new tape — a different run of recordings, not merely the same array built
     again — winds everything back to the top. */
  const tape = messages.map((message) => message?.src ?? '').join(' | ');
  useEffect(() => {
    setIndex(0);
    setPlaying(false);
    setFault(false);
    setCued(false);
  }, [tape]);

  useEffect(() => {
    if (audio.current) audio.current.volume = Math.min(1, Math.max(0, volume));
  }, [volume]);

  /* The element is told what to do whenever the transport or the message changes:
     a new message always starts at its own beginning. */
  useEffect(() => {
    const element = audio.current;
    if (!element) return;
    if (!playing) {
      element.pause();
      return;
    }
    try {
      element.currentTime = 0;
    } catch {
      // Nothing loaded yet; it will start from the top anyway.
    }
    element.play().catch(() => {
      setFault(true);
      setPlaying(false);
    });
  }, [playing, at]);

  const play = () => {
    if (!count) return;
    setFault(false);
    setCued(true);
    if (playing) {
      setPlaying(false);
      onStop?.();
      return;
    }
    setPlaying(true);
    if (current) onPlay?.(current, at);
  };

  const step = (direction: 1 | -1) => () => {
    if (!count) return;
    const next = at + direction;
    setFault(false);
    if (next < 0 || next >= count) {
      setPlaying(false);
      setIndex(0);
      setCued(false);
      onStop?.();
      return;
    }
    setCued(true);
    setIndex(next);
    if (playing) onPlay?.(messages[next], next);
  };

  /* Stop halts the tape. Pressed again, with the tape already still, it winds
     back to the top and the counter goes back to showing how many there are. */
  const halt = () => {
    if (playing) {
      setPlaying(false);
      onStop?.();
      return;
    }
    setFault(false);
    setCued(false);
    setIndex(0);
  };

  const ended = () => {
    if (current) onMessageEnded?.(current, at);
    if (at + 1 < count) {
      if (sound) beepTone(volume);
      setIndex(at + 1);
      onPlay?.(messages[at + 1], at + 1);
      return;
    }
    setPlaying(false);
    setIndex(0);
    setCued(false);
    onEnded?.();
  };

  const failed = () => {
    setFault(true);
    setPlaying(false);
    onStop?.();
  };

  const reading = fault ? `E${at + 1 > 9 ? '' : at + 1}` : tally ? String(Math.min(99, count)) : String(at + 1);
  const status = !count
    ? 'No messages'
    : fault
      ? `Message ${at + 1} would not play`
      : playing
        ? `Playing message ${at + 1} of ${count}${current?.caller ? `, from ${current.caller}` : ''}${current?.time ? `, ${current.time}` : ''}`
        : tally
          ? `${count} ${count === 1 ? 'message' : 'messages'} waiting`
          : `Stopped at message ${at + 1} of ${count}`;

  return (
    <div
      className={`desk-phone__machine ${className}`}
      data-playing={playing ? '' : undefined}
      data-waiting={!playing && count > 0 ? '' : undefined}
      role="group"
      aria-label="Answering machine"
    >
      {/* The door: a smoked lid over the microcassette well. */}
      <div className="desk-phone__door">
        <div className="desk-phone__well">
          <svg className="desk-phone__microcassette" viewBox="0 0 100 66" aria-hidden="true" focusable="false">
            <rect className="desk-phone__tape-shell" x="1" y="1" width="98" height="64" rx="4" />
            <rect className="desk-phone__tape-label" x="7" y="5" width="86" height="27" rx="2" />
            <line className="desk-phone__tape-rule" x1="12" y1="16" x2="88" y2="16" />
            <line className="desk-phone__tape-rule" x1="12" y1="25" x2="88" y2="25" />
            {/* The packs of tape, and the hubs turning in them. */}
            <circle className="desk-phone__tape-pack" cx="33" cy="47" r="13" />
            <circle className="desk-phone__tape-pack" cx="67" cy="47" r="13" />
            <g transform="translate(33 47)">
              <g className="desk-phone__tape-hub">
                <circle className="desk-phone__tape-ring" r="8" />
                <circle className="desk-phone__tape-eye" r="3.4" />
                <rect className="desk-phone__tape-tooth" x="-1.2" y="-8" width="2.4" height="3.4" />
                <rect className="desk-phone__tape-tooth" x="-1.2" y="4.6" width="2.4" height="3.4" />
              </g>
            </g>
            <g transform="translate(67 47)">
              <g className="desk-phone__tape-hub">
                <circle className="desk-phone__tape-ring" r="8" />
                <circle className="desk-phone__tape-eye" r="3.4" />
                <rect className="desk-phone__tape-tooth" x="-1.2" y="-8" width="2.4" height="3.4" />
                <rect className="desk-phone__tape-tooth" x="-1.2" y="4.6" width="2.4" height="3.4" />
              </g>
            </g>
            <rect className="desk-phone__tape-window" x="45" y="40" width="10" height="16" rx="1.5" />
          </svg>
        </div>
        <span className="desk-phone__door-lip" aria-hidden="true" />
      </div>

      {/* The readout and the lamps. */}
      <div className="desk-phone__readout" data-reading={reading}>
        <Counter text={reading} />
        <span className="desk-phone__readout-print">messages</span>
      </div>
      <div className="desk-phone__lamps">
        <span className="desk-phone__lamp" data-lamp="power" data-lit="" />
        <span className="desk-phone__lamp" data-lamp="message" data-lit={count ? '' : undefined} />
      </div>

      {/* The transport. */}
      <div className="desk-phone__keys">
        <button type="button" className="desk-phone__key" aria-label="Back one message" disabled={!count} onClick={step(-1)}>
          <Back />
          <span>back</span>
        </button>
        <button type="button" className="desk-phone__key" aria-label="Play messages" aria-pressed={playing} disabled={!count} onClick={play}>
          <Play />
          <span>play</span>
        </button>
        <button type="button" className="desk-phone__key" aria-label="Skip to next message" disabled={!count} onClick={step(1)}>
          <Skip />
          <span>skip</span>
        </button>
        <button type="button" className="desk-phone__key" aria-label="Stop" disabled={!count} onClick={halt}>
          <Halt />
          <span>stop</span>
        </button>
      </div>

      <span className="desk-phone__machine-print" aria-hidden="true">
        telephone answering system
        <em>microcassette · remote</em>
      </span>

      <audio ref={audio} src={current?.src} preload="metadata" onEnded={ended} onError={failed} />
      <p className="desk-phone__status" role="status" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
