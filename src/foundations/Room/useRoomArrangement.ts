import { useCallback, useEffect, useRef } from 'react';
import type { Place } from '../../behaviors/Movable/Movable';
import { usePlaces } from '../../behaviors/Movable/places';

export type RoomArrangement = Record<string, Place>;

/** The most of a flight one frame can account for: about six frames at 60 Hz. */
const ARRANGE_MAX_STEP_MS = 100;

/** Scene-owned target layouts, animated through the Room's shared place store.
 * Shadows and elevated drawings see the same intermediate positions as objects.
 * A new arrangement interrupts the old flight from its current position. A user
 * grabbing an object takes that object out of the flight without moving others.
 */
export function useRoomArrangement() {
  const places = usePlaces();
  const frame = useRef(0);
  const release = useRef<() => void>(() => {});
  const stop = useCallback(() => { cancelAnimationFrame(frame.current); release.current(); }, []);
  useEffect(() => stop, [stop]);
  return useCallback((targets: RoomArrangement, duration = 750) => {
    stop();
    if (!places) return;
    const ids = Object.keys(targets);
    release.current = () => { for (const id of ids) places.setArranging(id, false); };
    for (const id of ids) places.setArranging(id, true);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || duration <= 0) {
      for (const [id, target] of Object.entries(targets)) places.set(id, target);
      frame.current = requestAnimationFrame(() => release.current());
      return;
    }
    const flights = Object.entries(targets).map(([id, to]) => ({ id, to, from: places.get(id) ?? to, last: places.get(id) }));
    // A stalled frame (often the one mounting whatever started the flight)
    // advances it by one step at most, so slow frames slow the motion rather than skip it.
    let last = performance.now();
    let elapsed = 0;
    const tick = (now: number) => {
      elapsed += Math.min(Math.max(0, now - last), ARRANGE_MAX_STEP_MS);
      last = now;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - (1 - progress) ** 3;
      for (let index = flights.length - 1; index >= 0; index--) {
        const flight = flights[index];
        if (places.get(flight.id) !== flight.last) {
          places.setArranging(flight.id, false);
          flights.splice(index, 1);
          continue;
        }
        const { from, to } = flight;
        const at = progress === 1 ? to : {
          x: from.x + (to.x - from.x) * ease,
          y: from.y + (to.y - from.y) * ease,
          rotation: (from.rotation ?? 0) + ((to.rotation ?? 0) - (from.rotation ?? 0)) * ease,
          scale: (from.scale ?? 1) + ((to.scale ?? 1) - (from.scale ?? 1)) * ease,
        };
        flight.last = at;
        places.set(flight.id, at);
      }
      if (progress < 1 && flights.length) frame.current = requestAnimationFrame(tick);
      // Paint the exact final target before restoring ordinary CSS transitions.
      else frame.current = requestAnimationFrame(() => release.current());
    };
    frame.current = requestAnimationFrame(tick);
  }, [places, stop]);
}
