import type React from 'react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  DIAL_DIGITS,
  DIAL_SPEED,
  DIAL_STOP,
  WIND_SPEED,
  bearing,
  digitFor,
  holeAngle,
  pulseAt,
  pulsesFor,
  travelFor,
  turn,
} from './pulses';

/*
  The dial is drawn at its real size: the box is 118 millimetres square and the
  SVG works in millimetres too, so the clear finger wheel is 105 across, the
  holes are 15 — an adult index finger — and their centres sit on a
  76-millimetre circle, which leaves a five-millimetre web between them. The
  printing is on the fixed plate underneath — the digit inside each hole, the
  letters just outside it — which is the whole reason the wheel went clear in
  1954. The number card and its clear disc cover the middle, and the chrome
  finger stop stands over the wheel's rim at four o'clock.
*/

/** How far out the finger holes sit, in millimetres from the dial's centre. */
export const HOLE_RADIUS = 38;
/** A finger hole, wide enough for an index finger. */
export const HOLE_SIZE = 15;
/** The clear wheel's outside diameter, in millimetres. */
export const WHEEL_SIZE = 105;
/** The square the whole dial is drawn in, in millimetres. */
export const DIAL_BOX = 118;

const radians = (degrees: number) => (degrees * Math.PI) / 180;

export type DialProps = {
  /** What is written on the number card in the middle: this set's own number. */
  number?: string;
  /** Whether the dial is live. On a real set the handset has to be off the cradle first. */
  live?: boolean;
  /** Each break of the line as the wheel comes back, counted out at ten a second. */
  onPulse?: (pulse: number, of: number) => void;
  /** The digit those pulses spelled, once the wheel is home again. */
  onDigit?: (digit: number) => void;
  className?: string;
};

/**
 * The rotary dial, working. Put a finger in a hole and wind it clockwise to
 * the stop, then let go: the governor takes it back at its own speed, ticking
 * out one pulse per digit on the way. A hole activated from the keyboard winds
 * itself and is released the same way.
 */
export function Dial({ number = '', live = true, onPulse, onDigit, className = '' }: DialProps) {
  const id = useId().replace(/:/g, '');
  const wheel = useRef<HTMLDivElement>(null);
  const angle = useRef(0);
  const frame = useRef(0);
  const busy = useRef(false);
  const swallow = useRef(false);
  const grip = useRef<{ digit: number; travel: number; bearing: number; moved: boolean; x: number; y: number } | null>(null);
  const [state, setState] = useState<'rest' | 'wind' | 'return'>('rest');

  /* The wheel's angle is written straight to the element: it changes every frame
     while the governor runs and React has no business re-rendering that often. */
  const setAngle = useCallback((next: number) => {
    angle.current = next;
    wheel.current?.style.setProperty('--desk-phone-dial', String(Math.round(next * 100) / 100));
  }, []);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const release = useCallback(() => {
    const total = pulsesFor(angle.current);
    let fired = 0;
    setState('return');
    let last = performance.now();
    const step = (now: number) => {
      const elapsed = Math.min(0.25, (now - last) / 1000);
      last = now;
      const next = Math.max(0, angle.current - DIAL_SPEED * elapsed);
      setAngle(next);
      while (fired < total && next <= pulseAt(fired + 1, total) + 1e-6) {
        fired += 1;
        onPulse?.(fired, total);
      }
      if (next > 0) {
        frame.current = requestAnimationFrame(step);
        return;
      }
      /* A long frame must not swallow a pulse: the exchange counted them all. */
      while (fired < total) {
        fired += 1;
        onPulse?.(fired, total);
      }
      busy.current = false;
      swallow.current = false;
      setState('rest');
      const digit = digitFor(total);
      if (digit !== undefined) onDigit?.(digit);
    };
    frame.current = requestAnimationFrame(step);
  }, [onDigit, onPulse, setAngle]);

  /* A hole reached by the keyboard, or by anything else that only clicks: the
     finger is imaginary, so we wind it to the stop ourselves and let go. */
  const dial = useCallback(
    (digit: number) => {
      if (!live || busy.current) return;
      busy.current = true;
      const travel = travelFor(digit);
      setState('wind');
      let last = performance.now();
      const step = (now: number) => {
        const elapsed = Math.min(0.25, (now - last) / 1000);
        last = now;
        const next = Math.min(travel, angle.current + WIND_SPEED * elapsed);
        setAngle(next);
        if (next < travel) frame.current = requestAnimationFrame(step);
        else release();
      };
      frame.current = requestAnimationFrame(step);
    },
    [live, release, setAngle],
  );

  const grab = (digit: number) => (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || busy.current || !live) return;
    const box = wheel.current?.getBoundingClientRect();
    if (!box) return;
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    busy.current = true;
    swallow.current = false;
    grip.current = { digit, travel: travelFor(digit), bearing: bearing(event.clientX - x, event.clientY - y), moved: false, x, y };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // A pointer the browser will not hand us; the finger still drags.
    }
    setState('wind');
  };

  const drag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const hold = grip.current;
    if (!hold) return;
    const now = bearing(event.clientX - hold.x, event.clientY - hold.y);
    const delta = turn(hold.bearing, now);
    hold.bearing = now;
    const next = Math.min(hold.travel, Math.max(0, angle.current + delta));
    if (Math.abs(next - angle.current) > 0.5) hold.moved = true;
    setAngle(next);
  };

  const drop = () => {
    const hold = grip.current;
    if (!hold) return;
    grip.current = null;
    if (hold.moved) {
      /* The click that follows this release belongs to the drag, not to a new dial. */
      swallow.current = true;
      release();
      return;
    }
    busy.current = false;
    setState('rest');
  };

  const press = (digit: number) => () => {
    if (swallow.current) {
      swallow.current = false;
      return;
    }
    dial(digit);
  };

  const outer = WHEEL_SIZE / 2;
  const inner = 26;
  const holes = DIAL_DIGITS.map((_, index) => {
    const a = radians(holeAngle(index));
    return { x: HOLE_RADIUS * Math.sin(a), y: -HOLE_RADIUS * Math.cos(a) };
  });
  /* The clear wheel is one path with the holes and the middle punched out of it. */
  const disc = [
    `M ${-outer} 0 a ${outer} ${outer} 0 1 0 ${outer * 2} 0 a ${outer} ${outer} 0 1 0 ${-outer * 2} 0 Z`,
    `M ${-inner} 0 a ${inner} ${inner} 0 1 0 ${inner * 2} 0 a ${inner} ${inner} 0 1 0 ${-inner * 2} 0 Z`,
    ...holes.map(({ x, y }) => {
      const r = HOLE_SIZE / 2;
      return `M ${x - r} ${y} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 Z`;
    }),
  ].join(' ');
  const box = `${-DIAL_BOX / 2} ${-DIAL_BOX / 2} ${DIAL_BOX} ${DIAL_BOX}`;

  return (
    <div className={`desk-phone__dial ${className}`} data-dial={state} data-live={live ? '' : undefined}>
      {/* The fixed plate: the well, the printed ring, the letters outside each hole. */}
      <svg className="desk-phone__plate" viewBox={box} aria-hidden="true" focusable="false">
        {DIAL_DIGITS.map(({ digit, letters }, index) => (
          <g key={digit} transform={`rotate(${holeAngle(index)})`}>
            <text className="desk-phone__plate-digit" y={-HOLE_RADIUS + 3.5}>
              {digit}
            </text>
            <text className="desk-phone__plate-letters" y={-HOLE_RADIUS - 9} textLength={letters.length > 3 ? 24 : undefined}>
              {letters}
            </text>
          </g>
        ))}
      </svg>

      {/* The clear finger wheel. It carries the holes round; the printing stays put. */}
      <div className="desk-phone__wheel" ref={wheel}>
        <svg className="desk-phone__wheel-face" viewBox={box} aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id={`${id}-sheen`} x1="0.1" y1="0" x2="0.8" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
              <stop offset="0.38" stopColor="#fff" stopOpacity="0.06" />
              <stop offset="0.72" stopColor="#fff" stopOpacity="0.16" />
              <stop offset="1" stopColor="#fff" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path className="desk-phone__wheel-plastic" d={disc} fillRule="evenodd" />
          <path d={disc} fillRule="evenodd" fill={`url(#${id}-sheen)`} />
          <circle className="desk-phone__wheel-rim" r={outer - 0.7} />
          {holes.map(({ x, y }, index) => (
            <circle key={index} className="desk-phone__wheel-hole-edge" cx={x} cy={y} r={HOLE_SIZE / 2 - 0.4} />
          ))}
        </svg>
        {DIAL_DIGITS.map(({ digit, letters }, index) => (
          <button
            key={digit}
            type="button"
            className="desk-phone__hole"
            style={{ '--desk-phone-hole': `${holeAngle(index)}deg` } as React.CSSProperties}
            disabled={!live}
            aria-label={letters ? `Dial ${digit} ${[...letters].join(' ')}` : `Dial ${digit}`}
            onPointerDown={grab(digit)}
            onPointerMove={drag}
            onPointerUp={drop}
            onPointerCancel={drop}
            onLostPointerCapture={drop}
            onClick={press(digit)}
          />
        ))}
      </div>

      {/* The number card under its clear disc, and the finger stop over the rim. */}
      <div className="desk-phone__card">
        <span className="desk-phone__card-legend">call</span>
        <span className="desk-phone__card-number">{number}</span>
      </div>
      <svg className="desk-phone__stop" viewBox={box} aria-hidden="true" focusable="false">
        <g transform={`rotate(${DIAL_STOP})`}>
          <path className="desk-phone__stop-arm" d="M -5 -58 L 5 -58 L 3.4 -41 Q 0 -38.6 -3.4 -41 Z" />
          <path className="desk-phone__stop-light" d="M -3.6 -56.4 L -1.6 -56.4 L -2.1 -42.2 Q -2.9 -42.6 -3.4 -43.2 Z" />
        </g>
      </svg>
    </div>
  );
}
