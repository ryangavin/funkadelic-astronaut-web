/*
  The Western Electric No. 9 dial, in numbers.

  Ten finger holes sit on a 30-degree pitch, so the wheel carries them round
  three quarters of a turn and leaves the last quarter blank for the finger
  stop. The stop stands at four o'clock, 120 degrees clockwise from twelve.
  The hole for 1 rests 40 degrees short of it — that 40 degrees is lost
  motion, the slack the shaft takes up before the pulse cam engages — and
  every further digit is another 30 degrees round, so 0 is wound 310 degrees,
  very nearly a full turn.

  Let go and the wheel comes back at governor speed, not at the speed your
  finger left it: a centrifugal governor holds it to 300 degrees a second so
  the cam breaks the line ten times a second, which is the ten pulses per
  second the step-by-step switches at the exchange are built to count. A
  pulse is 61 milliseconds of break and 39 of make. Dialling 0 therefore
  takes 310/300 of a second, a hair over one second, and dialling 1 takes a
  seventh of that.

  The pulses are counted out of the arc, not out of the digit you meant: wind
  the wheel only halfway to the stop and the cam passes fewer teeth and the
  exchange hears fewer pulses. That is why a slipped finger dials a wrong
  number, and the arithmetic below keeps that honest.
*/

/** Degrees between one finger hole and the next. */
export const DIAL_PITCH = 30;
/** Degrees of lost motion: the hole for 1 at rest to the finger stop, silent on the way back. */
export const DIAL_OFFSET = 40;
/** Where the finger stop stands, in degrees clockwise from twelve. */
export const DIAL_STOP = 120;
/** Pulses a second, the rate the exchange counts at. */
export const PULSE_RATE = 10;
/** The governor's speed on the return, in degrees a second. */
export const DIAL_SPEED = DIAL_PITCH * PULSE_RATE;
/** How long a pulse holds the line broken, in milliseconds. */
export const PULSE_BREAK = 61;
/** How long it closes again before the next, in milliseconds. */
export const PULSE_MAKE = 39;
/** Roughly how fast a finger winds the wheel round, in degrees a second. */
export const WIND_SPEED = 560;

/** A digit on the plate and the letters printed outside it, as Bell set them: no Q and no Z. */
export const DIAL_DIGITS = [
  { digit: 1, letters: '' },
  { digit: 2, letters: 'ABC' },
  { digit: 3, letters: 'DEF' },
  { digit: 4, letters: 'GHI' },
  { digit: 5, letters: 'JKL' },
  { digit: 6, letters: 'MNO' },
  { digit: 7, letters: 'PRS' },
  { digit: 8, letters: 'TUV' },
  { digit: 9, letters: 'WXY' },
  { digit: 0, letters: 'OPERATOR' },
] as const;

/** Where a hole rests, in degrees clockwise from twelve. Hole 0 is 1, hole 9 is the zero. */
export const holeAngle = (index: number): number => DIAL_STOP - DIAL_OFFSET - DIAL_PITCH * index;

/** Which hole a digit is in: 1 first, 0 last. */
export const holeOf = (digit: number): number => (digit === 0 ? 9 : digit - 1);

/** How far the wheel must be wound to bring a digit's hole to the finger stop. */
export const travelFor = (digit: number): number => DIAL_OFFSET + DIAL_PITCH * holeOf(digit);

/** The furthest the wheel goes: the arc for 0. */
export const DIAL_TRAVEL = travelFor(0);

/** How many pulses the cam counts out of a wound arc, whatever digit was meant. */
export function pulsesFor(angle: number): number {
  if (!Number.isFinite(angle) || angle < DIAL_OFFSET) return 0;
  return Math.min(10, Math.floor((angle - DIAL_OFFSET) / DIAL_PITCH) + 1);
}

/** The digit an exchange hears in a count of pulses; ten of them is the zero, none is nothing at all. */
export const digitFor = (pulses: number): number | undefined => (pulses <= 0 ? undefined : pulses >= 10 ? 0 : pulses);

/** The angle still to run when pulse `n` of `of` breaks the line; the last one lands as the wheel hits home. */
export const pulseAt = (n: number, of: number): number => DIAL_PITCH * (of - n);

/** How long the governor takes to bring an arc home, in milliseconds. */
export const returnMs = (angle: number): number => (Math.max(0, angle) / DIAL_SPEED) * 1000;

/** A bearing in degrees clockwise from twelve, for a point measured from the dial's centre. */
export const bearing = (dx: number, dy: number): number => ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;

/** The shorter way round from one bearing to another: positive is clockwise. */
export function turn(from: number, to: number): number {
  let delta = (to - from) % 360;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
}
