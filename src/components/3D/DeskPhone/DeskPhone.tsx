import type React from 'react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import '../../../styles/fonts.css';
import { AnsweringMachine, MACHINE_DEPTH, MACHINE_WIDTH, type DeskPhoneMessage } from './AnsweringMachine';
import { Dial } from './Dial';
import { click as clickTone } from './sound';
import './DeskPhone.css';

export { DIAL_DIGITS, DIAL_OFFSET, DIAL_PITCH, DIAL_SPEED, DIAL_STOP, DIAL_TRAVEL, PULSE_RATE, digitFor, pulsesFor, returnMs, travelFor } from './pulses';
export type { DeskPhoneMessage } from './AnsweringMachine';
export { Dial } from './Dial';
export { AnsweringMachine } from './AnsweringMachine';

/*
  A Western Electric 500 desk set — Henry Dreyfuss, 1949 — with a microcassette
  answering machine pushed up beside it, traced looking straight down at the
  desk. Everything is measured in millimetres of the real objects and drawn as
  one plan: 560 millimetres across by 300 deep.

  It is a plan and nothing else. Neither object draws its own volume — the
  machine's wedge has no sloping face here, the housing has no shaded flanks,
  the handset has no roundness, because none of that is visible from directly
  overhead. Height is declared instead: the set stands 137 millimetres high
  with the handset on it and the machine 65 at its tall end, and those numbers
  are worth nothing at all until the plane is tilted, at which point a Solid of
  DESK_PHONE_HEIGHT hands the drawing --solid-rise and --solid-splay and the
  sides grow out from under the top faces. See DeskPhone.css.

  The 500's moulded housing is 221 wide and 229 deep and weighs four and a half
  pounds, most of it the ringer and the network coil in the base, which is why
  the thing never slid about. The G-type handset is 216 long with 56-millimetre
  caps at each end; resting in the cradle it lies face down across two
  hook-switch plungers 100 apart, covering them. Lift it and they show. The
  handset cord leaves the left-hand side of the base and lies on the desk in
  loose coils about 26 millimetres across. The dial is the No. 9: a
  105-millimetre clear finger wheel over a printed plate, with a 46-millimetre
  number card under a clear disc in the middle, and the chrome finger stop at
  four o'clock. See pulses.ts for how it counts.

  One honest cheat: the front of the 500 slopes, so from directly above the
  dial would read as a shallow ellipse. It is drawn as a true circle instead,
  because a dial that is going to turn under your finger has to be round. The
  dial plate is a circle in fact, so in a plan drawing that is a small licence.
*/

/** How wide the whole arrangement is, in millimetres. */
export const DESK_PHONE_WIDTH = 560;
/** How deep, in millimetres. */
export const DESK_PHONE_DEPTH = 300;
/** The 500's housing: 221 millimetres across the front. */
export const SET_WIDTH = 221;
/** And 229 from front to back. */
export const SET_DEPTH = 229;
/** The G-type handset, cap to cap. */
export const HANDSET_LENGTH = 216;
/** How high the 500 stands with the handset on it, in millimetres. */
export const SET_HEIGHT = 137;
/** The machine at its tall end, in millimetres; it slopes to 35 at the front. */
export const MACHINE_HEIGHT = 65;

export { MACHINE_DEPTH, MACHINE_WIDTH };

/** Where the set's footprint begins in the plan: 72 from the left edge, 36 from the back. */
export const SET_AT = { x: 72, y: 36 };
/** And where the machine's does. */
export const MACHINE_AT = { x: 319, y: 44 };

/**
 * How tall the set is as a multiple of the width of this drawing: 137
 * millimetres against 560. Stand the whole thing in a `Solid` of this, at
 * {@link DESK_PHONE_FOOT}, and the two top faces lift, their flanks slide out
 * beneath them, and the feet stay where the things are standing. The machine,
 * at 65, takes its own share of that lift rather than the set's.
 */
export const DESK_PHONE_HEIGHT = SET_HEIGHT / DESK_PHONE_WIDTH;

/** The machine's own height, for a page that wants to stand it by itself. */
export const ANSWERING_MACHINE_HEIGHT = MACHINE_HEIGHT / DESK_PHONE_WIDTH;

/**
 * Where the set stands within this drawing: the middle of the 500's
 * footprint, in fractions of the drawing's width, written the way MUG_FOOT and
 * LABEL_MAKER_FOOT are. This is the one a `Solid` round the whole thing wants,
 * because the set is the tall half of it.
 */
export const DESK_PHONE_FOOT = {
  x: (SET_AT.x + SET_WIDTH / 2) / DESK_PHONE_WIDTH,
  y: (SET_AT.y + SET_DEPTH / 2) / DESK_PHONE_WIDTH,
};

/** And where the machine stands, since it is its own object at its own place on the desk. */
export const ANSWERING_MACHINE_FOOT = {
  x: (MACHINE_AT.x + MACHINE_WIDTH / 2) / DESK_PHONE_WIDTH,
  y: (MACHINE_AT.y + MACHINE_DEPTH / 2) / DESK_PHONE_WIDTH,
};

export const DESK_PHONE_FINISHES = ['black', 'ivory', 'red', 'aqua', 'moss'] as const;
export type DeskPhoneFinish = (typeof DESK_PHONE_FINISHES)[number];

/* The slack of the handset cord: a helix walked along a lazy S, projected the
   way you would see it looking down at the desk. The turns are 26 millimetres
   across and the coil is squashed almost flat in the view, which is what a
   coiled cord on a desk actually looks like from up here. */
const COIL_RADIUS = 13;
const COIL_TURNS = 13;
const COIL_SQUASH = 0.34;

function coil(): string {
  const p0 = [70, 144];
  const p1 = [14, 168];
  const p2 = [76, 234];
  const p3 = [18, 264];
  const bezier = (t: number, a: number, b: number, c: number, d: number) => {
    const u = 1 - t;
    return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
  };
  const steps = 260;
  const points: string[] = [];
  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    const x = bezier(t, p0[0], p1[0], p2[0], p3[0]);
    const y = bezier(t, p0[1], p1[1], p2[1], p3[1]);
    const ahead = Math.min(1, t + 0.004);
    const tx = bezier(ahead, p0[0], p1[0], p2[0], p3[0]) - x;
    const ty = bezier(ahead, p0[1], p1[1], p2[1], p3[1]) - y;
    const length = Math.hypot(tx, ty) || 1;
    const ux = tx / length;
    const uy = ty / length;
    const phase = 2 * Math.PI * COIL_TURNS * t;
    /* Across the coil's axis the turn shows its full width; along it, almost none. */
    const across = COIL_RADIUS * Math.cos(phase);
    const along = COIL_RADIUS * COIL_SQUASH * Math.sin(phase);
    points.push(`${(x - uy * across + ux * along).toFixed(2)} ${(y + ux * across + uy * along).toFixed(2)}`);
  }
  return `M ${points.join(' L ')}`;
}

const CORD = coil();

export type DeskPhoneProps = {
  /** What is on the tape, oldest first. Each one wants a caller, a time and an audio src; anything else you hang on it is kept and ignored. */
  messages?: DeskPhoneMessage[];
  /** What is written on the number card under the dial: this set's own number. */
  number?: string;
  /** The moulding's colour. Black is the 1949 set; the rest came with the colour range in 1954. The machine stays beige, being thirty years younger. */
  finish?: DeskPhoneFinish;
  /** How the set lies on the desk, in degrees. Negative turns it counter-clockwise. */
  rotation?: number;
  /** Whether the handset starts off the cradle. */
  offHook?: boolean;
  /** How loud the messages play, 0 to 1. */
  volume?: number;
  /** Whether the set makes its own noise: the dial's clicks and the beep between messages. The recordings play either way. */
  sound?: boolean;
  /** Every break of the line as the wheel comes back, ten a second. */
  onPulse?: (pulse: number, of: number) => void;
  /** A digit, once the wheel is home. The second argument is everything dialled since the handset came up. */
  onDigit?: (digit: number, dialled: string) => void;
  /** The handset going up or down. */
  onHook?: (offHook: boolean) => void;
  /** A message starts playing. */
  onPlay?: (message: DeskPhoneMessage, index: number) => void;
  /** A message has run out. */
  onMessageEnded?: (message: DeskPhoneMessage, index: number) => void;
  /** The tape stopped, by the key or because a recording would not play. */
  onStop?: () => void;
  /** The last message has run out. */
  onEnded?: () => void;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * The booking line: a black 500 desk set with the answering machine beside it.
 * The handset lifts off the cradle and the plungers come up under it; the
 * rotary dial really turns, winds to the finger stop and comes back at
 * governor speed clicking out one pulse a digit; and the machine plays what
 * is on the tape, one message after another, through a plain audio element.
 */
export function DeskPhone({
  messages = [],
  number = '',
  finish = 'black',
  rotation = 0,
  offHook: lifted = false,
  volume = 0.8,
  sound = true,
  onPulse,
  onDigit,
  onHook,
  onPlay,
  onMessageEnded,
  onStop,
  onEnded,
  className = '',
  style,
}: DeskPhoneProps) {
  const id = useId().replace(/:/g, '');
  const [offHook, setOffHook] = useState(lifted);
  const [dialled, setDialled] = useState('');
  const [pulses, setPulses] = useState(0);
  const digits = useRef('');

  /* The handset is worked by hand, but an owner who says where it should be is
     obeyed: put it down and the dial goes dead again. */
  useEffect(() => {
    setOffHook(lifted);
    if (!lifted) {
      digits.current = '';
      setDialled('');
      setPulses(0);
    }
  }, [lifted]);

  /* Putting the handset back drops the call, and with it whatever was dialled. */
  const hook = () => {
    const next = !offHook;
    setOffHook(next);
    if (!next) {
      digits.current = '';
      setDialled('');
      setPulses(0);
    }
    onHook?.(next);
  };

  const pulse = useCallback(
    (n: number, of: number) => {
      if (sound) clickTone(volume);
      setPulses((count) => count + 1);
      onPulse?.(n, of);
    },
    [onPulse, sound, volume],
  );

  const digit = useCallback(
    (value: number) => {
      const next = digits.current + String(value);
      digits.current = next;
      setDialled(next);
      onDigit?.(value, next);
    },
    [onDigit],
  );

  const status = !offHook
    ? 'Handset on the cradle'
    : dialled
      ? `Dialled ${[...dialled].join(' ')}`
      : 'Dial tone';

  const cssVars = { '--desk-phone-rotation': `${rotation}deg` } as React.CSSProperties;

  return (
    <div
      className={`desk-phone ${className}`}
      data-finish={finish}
      data-hook={offHook ? 'off' : 'on'}
      data-dialled={dialled || undefined}
      data-pulses={pulses || undefined}
      style={{ ...cssVars, ...style }}
      role="group"
      aria-label={number ? `Desk phone: ${number}` : 'Desk phone'}
    >
      {/* On the wood: the cord's slack and the shadows the two things throw.
          None of it lifts, because none of it is off the desk. */}
      <svg className="desk-phone__ground" viewBox={`0 0 ${DESK_PHONE_WIDTH} ${DESK_PHONE_DEPTH}`} aria-hidden="true" focusable="false">
        <defs>
          <filter id={`${id}-cast`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4.5" />
          </filter>
        </defs>
        <path className="desk-phone__cord-shadow" d={CORD} transform="translate(2 4)" />
        <path className="desk-phone__cord-line" d={CORD} />
        <g className="desk-phone__cast" filter={`url(#${id}-cast)`}>
          <rect x={78} y={45} width={SET_WIDTH} height={SET_DEPTH} rx={40} />
          <rect x={324} y={52} width={MACHINE_WIDTH} height={MACHINE_DEPTH} rx={12} />
        </g>
      </svg>

      {/* The flanks: nothing at all from straight above, and the only part of
          either object that grows as the plane comes down. */}
      <div className="desk-phone__sides" aria-hidden="true">
        <span className="desk-phone__set-foot" />
        <span className="desk-phone__set-wall" />
        <span className="desk-phone__machine-foot" />
        <span className="desk-phone__machine-wall" />
      </div>

      {/* The housing's top face. */}
      <div className="desk-phone__set">
        <span className="desk-phone__saddle" aria-hidden="true" />
        <span className="desk-phone__plunger" data-at="left" aria-hidden="true" />
        <span className="desk-phone__plunger" data-at="right" aria-hidden="true" />

        <Dial number={number} live={offHook} onPulse={pulse} onDigit={digit} />

        <button
          type="button"
          className="desk-phone__handset"
          aria-label={offHook ? 'Hang up' : 'Lift the handset'}
          aria-pressed={offHook}
          onClick={hook}
        >
          <svg viewBox="0 0 216 56" aria-hidden="true" focusable="false">
            {/* The outline goes down first in the edge colour and the moulding
                comes back up over it, so the two caps and the bar read as one
                piece with no seams where they meet. */}
            <g className="desk-phone__handset-edge">
              <circle cx="28" cy="28" r="27" />
              <circle cx="188" cy="28" r="27" />
              <path d="M36 11 C 64 6 84 15 108 15 C 132 15 152 6 180 11 L 180 45 C 152 50 132 41 108 41 C 84 41 64 50 36 45 Z" />
            </g>
            <g className="desk-phone__handset-body">
              <circle cx="28" cy="28" r="27" />
              <circle cx="188" cy="28" r="27" />
              <path d="M36 11 C 64 6 84 15 108 15 C 132 15 152 6 180 11 L 180 45 C 152 50 132 41 108 41 C 84 41 64 50 36 45 Z" />
            </g>
            <circle className="desk-phone__handset-seam" cx="28" cy="28" r="21" />
            <circle className="desk-phone__handset-seam" cx="188" cy="28" r="21" />
          </svg>
        </button>
      </div>

      <AnsweringMachine
        messages={messages}
        volume={volume}
        sound={sound}
        onPlay={onPlay}
        onMessageEnded={onMessageEnded}
        onStop={onStop}
        onEnded={onEnded}
      />

      <p className="desk-phone__status" role="status" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
