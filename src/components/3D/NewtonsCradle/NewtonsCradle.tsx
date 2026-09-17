import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import './NewtonsCradle.css';

/** One full swing, out and back on one side, then the other: in milliseconds. */
export const CRADLE_PERIOD_MS = 1300;
/** How many periods a push lasts before the balls settle. */
export const CRADLE_SWINGS = 8;
/** The balls' centres, in 720ths of the frame's width, and their radius. */
export const CRADLE_BALLS = [140, 250, 360, 470, 580] as const;
export const CRADLE_RADIUS = 52;
/** Where the rails run, and where the balls hang at rest, in the same units. */
export const CRADLE_RAILS = [90, 510] as const;
export const CRADLE_REST = 300;
/** How far an end ball swings out, in the same units. */
export const CRADLE_SWING = 95;
/** The string's turn and stretch at the end of a swing: from the rail down to the ball at rest, then out to where it has gone. */
export const CRADLE_STRING = {
  angle: (Math.atan(CRADLE_SWING / (CRADLE_REST - CRADLE_RAILS[0])) * 180) / Math.PI,
  stretch: Math.hypot(CRADLE_SWING, CRADLE_REST - CRADLE_RAILS[0]) / (CRADLE_REST - CRADLE_RAILS[0]),
};

export type NewtonsCradleProps = {
  /** Tilt on the desk, in degrees. */
  rotation?: number;
  /** Whether the balls click when they meet. */
  sound?: boolean;
  /** Start it already swinging. */
  swinging?: boolean;
  onSwing?: (swinging: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
};

/** A short, hard click: a burst of filtered noise with a bright ring, the sound of two steel balls meeting. */
function clack(context: AudioContext) {
  const at = context.currentTime;
  const noise = context.createBuffer(1, Math.floor(context.sampleRate * 0.04), context.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3;
  const burst = context.createBufferSource();
  burst.buffer = noise;
  const band = context.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 3200;
  band.Q.value = 1.2;
  const ring = context.createOscillator();
  ring.type = 'sine';
  ring.frequency.value = 4100;
  const ringGain = context.createGain();
  ringGain.gain.setValueAtTime(0.12, at);
  ringGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.06);
  const gain = context.createGain();
  gain.gain.value = 0.5;
  burst.connect(band).connect(gain).connect(context.destination);
  ring.connect(ringGain).connect(context.destination);
  burst.start(at);
  ring.start(at);
  ring.stop(at + 0.07);
}

/**
 * A Newton's cradle seen from above: five steel balls in a row, each hung
 * from the two rails on a polished base. Click it and the end ball is lifted
 * and let go; from above it slides out along the row, rising toward you,
 * its strings staying tied to the rails and leaning after it, and drops back
 * to meet the others with a click, and the ball at the far end pops out in
 * its turn, back and forth until it settles. Measured in 720ths of its
 * width, 120 by 100 millimetres.
 */
export function NewtonsCradle({ rotation = 0, sound = true, swinging: initiallySwinging = false, onSwing, className = '', style }: NewtonsCradleProps) {
  const [swinging, setSwinging] = useState(initiallySwinging);
  const audio = useRef<AudioContext | null>(null);
  const clicks = useRef<number>(0);

  /* The balls click each time a swing ends: twice a period, from half a period in. */
  useEffect(() => {
    if (!swinging || !sound) return;
    const context = audio.current;
    if (!context) return;
    const half = CRADLE_PERIOD_MS / 2;
    const timer = window.setInterval(() => {
      clicks.current += 1;
      if (clicks.current <= CRADLE_SWINGS * 2) clack(context);
    }, half);
    return () => window.clearInterval(timer);
  }, [swinging, sound]);

  const push = () => {
    if (swinging) {
      setSwinging(false);
      onSwing?.(false);
      return;
    }
    if (sound && typeof AudioContext !== 'undefined') {
      try {
        audio.current ??= new AudioContext();
        void audio.current.resume();
      } catch {
        audio.current = null;
      }
    }
    clicks.current = 0;
    setSwinging(true);
    onSwing?.(true);
  };

  const settle = (event: React.AnimationEvent) => {
    if (event.animationName !== 'cradle-swing-left') return;
    setSwinging(false);
    onSwing?.(false);
  };

  return (
    <div
      className={`newtons-cradle ${className}`}
      data-swinging={swinging ? '' : undefined}
      style={{ '--cradle-rotation': `${rotation}deg`, '--cradle-period': `${CRADLE_PERIOD_MS}ms`, '--cradle-swings': CRADLE_SWINGS, '--cradle-swing': `${CRADLE_SWING}px`, '--cradle-string-angle': `${CRADLE_STRING.angle.toFixed(2)}deg`, '--cradle-string-stretch': CRADLE_STRING.stretch.toFixed(4), ...style } as React.CSSProperties}
    >
      <button type="button" className="newtons-cradle__push" aria-label={swinging ? 'Stop the cradle' : 'Set the cradle going'} aria-pressed={swinging} onClick={push} onAnimationEnd={settle}>
        <svg viewBox="0 0 720 600" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="cradle-base" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#3a2a22" />
              <stop offset="0.5" stopColor="#1d1512" />
              <stop offset="1" stopColor="#0f0b09" />
            </linearGradient>
            <linearGradient id="cradle-rail" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f5f6f8" />
              <stop offset="0.45" stopColor="#b9bdc5" />
              <stop offset="1" stopColor="#5b5f66" />
            </linearGradient>
            <radialGradient id="cradle-ball" cx="0.34" cy="0.3" r="0.75">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.18" stopColor="#dfe3e8" />
              <stop offset="0.55" stopColor="#7d838c" />
              <stop offset="0.85" stopColor="#2f3338" />
              <stop offset="1" stopColor="#15171a" />
            </radialGradient>
            <filter id="cradle-soft" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>

          {/* The base and its shadow on the desk. */}
          <rect x="32" y="44" width="670" height="530" rx="36" fill="rgb(10 5 2 / 0.5)" filter="url(#cradle-soft)" />
          <rect x="20" y="30" width="680" height="540" rx="34" fill="url(#cradle-base)" />
          <rect x="20" y="30" width="680" height="540" rx="34" fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth="2" />

          {/* The frame: two rails on four posts. */}
          {CRADLE_RAILS.map((y) => (
            <g key={y}>
              <rect x="70" y={y - 7} width="580" height="14" rx="7" fill="url(#cradle-rail)" />
              <circle cx="70" cy={y} r="16" fill="url(#cradle-rail)" />
              <circle cx="650" cy={y} r="16" fill="url(#cradle-rail)" />
            </g>
          ))}

          {/* Each ball hangs on two strings, one to each rail. The end balls swing: the ball itself
              slides out and rises, and its strings stay tied to the rails, pivoting and stretching after it. */}
          {CRADLE_BALLS.map((cx, index) => (
            <g key={cx} className="newtons-cradle__hanger" data-end={index === 0 ? 'left' : index === CRADLE_BALLS.length - 1 ? 'right' : undefined}>
              <line className="newtons-cradle__string newtons-cradle__string--top" x1={cx} y1={CRADLE_RAILS[0]} x2={cx} y2={CRADLE_REST} style={{ transformOrigin: `${cx}px ${CRADLE_RAILS[0]}px` }} />
              <line className="newtons-cradle__string newtons-cradle__string--bottom" x1={cx} y1={CRADLE_RAILS[1]} x2={cx} y2={CRADLE_REST} style={{ transformOrigin: `${cx}px ${CRADLE_RAILS[1]}px` }} />
              <g className="newtons-cradle__ball">
                <ellipse className="newtons-cradle__shadow" cx={cx + 10} cy={CRADLE_REST + 18} rx={CRADLE_RADIUS + 2} ry={CRADLE_RADIUS * 0.7} />
                <g className="newtons-cradle__steel">
                  <circle cx={cx} cy={CRADLE_REST} r={CRADLE_RADIUS} fill="url(#cradle-ball)" />
                  <circle cx={cx - 14} cy={CRADLE_REST - 18} r="9" fill="#fff" opacity="0.7" />
                </g>
              </g>
            </g>
          ))}
        </svg>
      </button>
    </div>
  );
}
