import type { Place } from '../../behaviors/Movable/Movable';

/** The most of a flight one frame can account for: about six frames at 60 Hz. */
const ARRANGE_MAX_STEP_MS = 100;

/**
 * How far into a flight the frame at `now` is, given how far it had got by
 * the frame at `last`. A stalled frame (often the one mounting whatever started
 * the flight) advances it by one step at most, so slow frames slow the motion
 * rather than skip it, and a clock that runs backwards adds nothing.
 */
export function flightElapsed(elapsed: number, last: number, now: number) {
  return elapsed + Math.min(Math.max(0, now - last), ARRANGE_MAX_STEP_MS);
}

/** How far through a flight of `duration` it is, from 0 to 1. */
export function flightProgress(elapsed: number, duration: number) {
  return Math.min(1, elapsed / duration);
}

/** Where a flight from `from` to `to` has got to, eased out; at the end it is exactly `to`. */
export function flightPlace(from: Place, to: Place, progress: number): Place {
  if (progress === 1) return to;
  const ease = 1 - (1 - progress) ** 3;
  return {
    x: from.x + (to.x - from.x) * ease,
    y: from.y + (to.y - from.y) * ease,
    rotation: (from.rotation ?? 0) + ((to.rotation ?? 0) - (from.rotation ?? 0)) * ease,
    scale: (from.scale ?? 1) + ((to.scale ?? 1) - (from.scale ?? 1)) * ease,
  };
}
