import type React from 'react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import '../../../styles/fonts.css';
import { Dial } from './Dial';
import { click as clickTone } from './sound';
import './DeskPhone.css';

export { DIAL_DIGITS, DIAL_OFFSET, DIAL_PITCH, DIAL_SPEED, DIAL_STOP, DIAL_TRAVEL, PULSE_RATE, digitFor, pulsesFor, returnMs, travelFor } from './pulses';
export { Dial } from './Dial';

/** Independent rotary desk phone. Measurements are millimetres; the artwork
 * includes room beside the housing for the handset cord. */
/** How wide the whole arrangement is, in millimetres. */
export const DESK_PHONE_WIDTH = 320;
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
/** Where the set's footprint begins in the plan: 72 from the left edge, 36 from the back. */
export const SET_AT = { x: 72, y: 36 };
/** Height relative to this phone-only drawing. */
export const DESK_PHONE_HEIGHT = SET_HEIGHT / DESK_PHONE_WIDTH;
export const DESK_PHONE_FOOT = {
  x: (SET_AT.x + SET_WIDTH / 2) / DESK_PHONE_WIDTH,
  y: (SET_AT.y + SET_DEPTH / 2) / DESK_PHONE_WIDTH,
};

export const DESK_PHONE_FINISHES = ['black', 'ivory', 'red', 'aqua', 'moss'] as const;
export type DeskPhoneFinish = (typeof DESK_PHONE_FINISHES)[number];

/* The slack of the handset cord: a helix walked along a lazy S, projected the
   way you would see it looking down at the desk. The turns are 26 millimetres
   across and the coil is squashed almost flat in the view, which is what a
   coiled cord on a desk actually looks like from up here. */
function coil(): string {
  // A relaxed lead from the base, followed by evenly spaced coils to the handset.
  // Keeping a straight coil axis prevents loops bunching at a tight curve.
  const points: string[] = [];
  for (let step = 0; step <= 192; step++) {
    const t = step / 192;
    const phase = t * Math.PI * 2 * 8;
    const taper = Math.min(1, t * 12, (1 - t) * 12);
    const x = 26 + 12 * t + 5 * taper * Math.sin(phase);
    const y = 166 - 68 * t + 1.2 * taper * Math.cos(phase);
    points.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return `M72 144 C58 144 57 181 39 181 C29 181 26 174 26 166 L ${points.join(' L ')} `;
}

const CORD = coil();

export type DeskPhoneProps = {
  /** What is written on the number card under the dial: this set's own number. */
  number?: string;
  /** The moulding's colour. Black is the 1949 set; the rest came with the colour range in 1954.  */
  finish?: DeskPhoneFinish;
  /** How the set lies on the desk, in degrees. Negative turns it counter-clockwise. */
  rotation?: number;
  /** Whether the handset starts off the cradle. */
  offHook?: boolean;
  /** How loud the dial clicks play, 0 to 1. */
  volume?: number;
  /** Whether the set makes its own noise: the dial's clicks. */
  sound?: boolean;
  /** Every break of the line as the wheel comes back, ten a second. */
  onPulse?: (pulse: number, of: number) => void;
  /** A digit, once the wheel is home. The second argument is everything dialled since the handset came up. */
  onDigit?: (digit: number, dialled: string) => void;
  /** The handset going up or down. */
  onHook?: (offHook: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
};

/** Rotary phone with a liftable handset and working pulse dial. */
export function DeskPhone({
  number = '',
  finish = 'black',
  rotation = 0,
  offHook: lifted = false,
  volume = 0.8,
  sound = true,
  onPulse,
  onDigit,
  onHook,
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
        </g>
      </svg>

      {/* The flanks: nothing at all from straight above, and the only part of
          either object that grows as the plane comes down. */}
      <div className="desk-phone__sides" aria-hidden="true">
        <span className="desk-phone__set-foot" />
        <span className="desk-phone__set-wall" />
      </div>

      {/* The housing's top face. */}
      <div className="desk-phone__set">
        <svg className="desk-phone__cord-connector" viewBox="0 0 221 229" aria-hidden="true">
          <path className="desk-phone__cord-line" d={offHook ? 'M-34 62 C-40 32 -34 0 -16 8' : 'M-34 62 C-34 32 -12 34 6 48'} />
        </svg>
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
          <svg viewBox="0 -8 216 72" aria-hidden="true" focusable="false">
            {/* The outline goes down first in the edge colour and the moulding
                comes back up over it, so the two caps and the bar read as one
                piece with no seams where they meet. */}
            <g className="desk-phone__handset-edge">
              <circle cx="28" cy="28" r="35" />
              <circle cx="188" cy="28" r="35" />
              <path d="M36 11 C 64 6 84 15 108 15 C 132 15 152 6 180 11 L 180 45 C 152 50 132 41 108 41 C 84 41 64 50 36 45 Z" />
            </g>
            <g className="desk-phone__handset-body">
              <circle cx="28" cy="28" r="35" />
              <circle cx="188" cy="28" r="35" />
              <path d="M36 11 C 64 6 84 15 108 15 C 132 15 152 6 180 11 L 180 45 C 152 50 132 41 108 41 C 84 41 64 50 36 45 Z" />
            </g>
            <circle className="desk-phone__handset-seam" cx="28" cy="28" r="27" />
            <circle className="desk-phone__handset-seam" cx="188" cy="28" r="27" />
          </svg>
        </button>
      </div>

      <p className="desk-phone__status" role="status" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
