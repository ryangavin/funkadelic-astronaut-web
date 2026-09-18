/*
  The rings a mug leaves as it is carried about the desk. Coffee runs down the
  outside of a mug and gathers under its base, so the ring goes down as the mug
  is set down and is under it the whole time it stands there: lift the mug and
  it shows, or pull the paper out from under it and the paper takes its share
  of the ring away with it.

  A ring goes onto whatever the base was standing on, and that is rarely one
  thing. A mug set half on a sheet of paper leaves half a ring on the sheet,
  which goes with the sheet wherever it is put, and the other half on the wood
  — the sheet masked the rest — so sliding the sheet away shows exactly the
  half it did not cover. Every ring on the desk dries a shade further each time
  the mug comes off one, and goes on drying until there is nothing of it left
  in the wood. However many the desk has collected, it keeps.

  The maths here is pure: where the ring lies under a mug placed by its corner
  and turned, which way the coffee pooled, what each surface caught of it, and
  how the trail ages. CoffeeRing draws one; whoever owns the desk keeps them.
*/

import { useEffect, useRef, useState } from 'react';
import { MUG_FOOT } from './Mug';
import type { RingMask } from './CoffeeRing';

/** The ring's box against the mug's: a mug 140 mm across the handle stands on a base that leaves an 83 mm ring, drips and all. */
export const MUG_RING = 83 / 140;

/** How dark a ring is the moment the mug comes off it, 0 to 1. */
export const COFFEE_WET = 0.7;

/** What is left of a ring after the mug is lifted once more: it dries toward the wood. */
export const COFFEE_DRIES = 0.8;

/** Fainter than this and a ring has dried into the wood: it fades out and the desk is rid of it. A dozen or so stay. */
export const COFFEE_GONE = 0.04;

/** The wood itself, which everything else lies on. */
export const DESK = 'desk';

/** Mug placement in surface units. Width is the unscaled artwork box; scale is its current placement scale. */
export type MugPlace = { x: number; y: number; rotation?: number; width: number; scale?: number };

/** Something lying on the desk that a mug can be stood on, in the desk's units: a sheet of paper, a folder, a magazine. */
export type Surface = { id: string; x: number; y: number; width: number; height: number; rotation?: number };

/** A ring's share of one surface: where it lies in that surface's own frame, which way the coffee pooled, how dark it still is, and the outlines of whatever was lying over it. */
export type CoffeeStain = { id: number; x: number; y: number; width: number; rotation: number; strength: number; masks?: RingMask[] };

/** The rings each thing on the desk is carrying, newest first, the wood under `DESK`. */
export type CoffeeTrail = Record<string, CoffeeStain[]>;

type Point = { x: number; y: number };

const RADIANS = Math.PI / 180;

/** The ring under a mug. The base is off the centre of the mug's box, so turning the mug swings the ring round with it. */
export function ringUnder({ x, y, rotation = 0, width: baseWidth, scale = 1 }: MugPlace): { x: number; y: number; width: number } {
  const width = baseWidth * scale;
  const turn = rotation * RADIANS;
  const offsetX = (MUG_FOOT.x - 0.5) * width;
  const offsetY = (MUG_FOOT.y - 0.5) * width;
  const centreX = x + width / 2 + offsetX * Math.cos(turn) - offsetY * Math.sin(turn);
  const centreY = y + width / 2 + offsetX * Math.sin(turn) + offsetY * Math.cos(turn);
  const ring = width * MUG_RING;
  return { x: centreX - ring / 2, y: centreY - ring / 2, width: ring };
}

/** Which way the coffee pooled. It never pools the same way twice, but the ring left in one place is always that ring, so the turn is taken from where the mug stood. */
export function ringTurn(x: number, y: number) {
  const scatter = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return Math.round((scatter - Math.floor(scatter)) * 360);
}

/** A point of the desk as the surface itself has it: measured from its own corner, before it was turned. */
export function intoSurface({ x, y }: Point, surface: Surface): Point {
  const turn = -(surface.rotation ?? 0) * RADIANS;
  const dx = x - (surface.x + surface.width / 2);
  const dy = y - (surface.y + surface.height / 2);
  return {
    x: surface.width / 2 + dx * Math.cos(turn) - dy * Math.sin(turn),
    y: surface.height / 2 + dx * Math.sin(turn) + dy * Math.cos(turn),
  };
}

/** The four corners of a surface, in the desk's units, turned the way it lies. */
export function cornersOf(surface: Surface): Point[] {
  const turn = (surface.rotation ?? 0) * RADIANS;
  const midX = surface.x + surface.width / 2;
  const midY = surface.y + surface.height / 2;
  return [
    [0, 0],
    [surface.width, 0],
    [surface.width, surface.height],
    [0, surface.height],
  ].map(([cx, cy]) => {
    const dx = cx - surface.width / 2;
    const dy = cy - surface.height / 2;
    return { x: midX + dx * Math.cos(turn) - dy * Math.sin(turn), y: midY + dx * Math.sin(turn) + dy * Math.cos(turn) };
  });
}

/** Which side of the line a→b the point falls. */
const side = (a: [number, number], b: [number, number], point: [number, number]) => (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]);

/** Whether a cover lies over the whole of the ring's box, so no coffee reached the surface beneath it at all. */
const covers = (mask: RingMask) =>
  ([[0, 0], [1, 0], [1, 1], [0, 1]] as [number, number][]).every((corner) => {
    const sides = mask.map((from, at) => side(from, mask[(at + 1) % mask.length], corner));
    return sides.every((turn) => turn >= 0) || sides.every((turn) => turn <= 0);
  });

const spread = (mask: RingMask) => ({
  left: Math.min(...mask.map(([x]) => x)),
  right: Math.max(...mask.map(([x]) => x)),
  top: Math.min(...mask.map(([, y]) => y)),
  bottom: Math.max(...mask.map(([, y]) => y)),
});

/**
 * What each thing under the mug catches of the ring it has been standing on:
 * the wood always, and every surface the base overlapped, each with the
 * outlines of whatever lay over it cut out. `over` is what is on the desk,
 * underneath first. Returns one stain per surface that caught anything, by id.
 */
export function stampRings(place: MugPlace, over: readonly Surface[], id: number): Record<string, CoffeeStain> {
  const ring = ringUnder(place);
  const rotation = (place.rotation ?? 0) + ringTurn(place.x, place.y);
  const middle = { x: ring.x + ring.width / 2, y: ring.y + ring.width / 2 };
  const caught: Record<string, CoffeeStain> = {};

  /* The ring is a disc, so whichever way a surface is turned it is still a disc on it: only where its corner falls changes. */
  const stamp = (surface: Surface | null, above: readonly Surface[]) => {
    const here = surface ? intoSurface(middle, surface) : middle;
    const corner = { x: here.x - ring.width / 2, y: here.y - ring.width / 2 };
    if (surface && (corner.x > surface.width || corner.y > surface.height || corner.x + ring.width < 0 || corner.y + ring.width < 0)) return;
    const masks: RingMask[] = [];
    for (const cover of above) {
      const mask = cornersOf(cover)
        .map((point) => (surface ? intoSurface(point, surface) : point))
        .map(({ x, y }) => [(x - corner.x) / ring.width, (y - corner.y) / ring.width] as [number, number]);
      const edges = spread(mask);
      // Nothing of this cover is over the ring.
      if (edges.right < 0 || edges.left > 1 || edges.bottom < 0 || edges.top > 1) continue;
      // The cover is over all of it, so no coffee reached this surface at all.
      if (covers(mask)) return;
      masks.push(mask);
    }
    caught[surface?.id ?? DESK] = { id, ...corner, width: ring.width, rotation, strength: COFFEE_WET, ...(masks.length ? { masks } : {}) };
  };

  for (let layer = over.length - 1; layer >= 0; layer -= 1) stamp(over[layer], over.slice(layer + 1));
  stamp(null, over);
  return caught;
}

const dry = (ring: CoffeeStain): CoffeeStain => {
  const left = ring.strength * COFFEE_DRIES;
  return { ...ring, strength: left < COFFEE_GONE ? 0 : left };
};

/**
 * The trail once the mug has been set down at `place`: the coffee under its
 * base wets everything it is standing on, and every ring already down dries a
 * shade further. Nothing is thrown away for being old — a ring leaves only by
 * drying out, which takes a moment, so one that has reached the wood is held
 * at nothing until the mug is set down once more. Newest first, per surface.
 */
export function setDown(trail: CoffeeTrail, place: MugPlace, over: readonly Surface[] = []): CoffeeTrail {
  const last = Math.max(0, ...Object.values(trail).flatMap((rings) => rings.map((ring) => ring.id)));
  const fresh = stampRings(place, over, last + 1);
  const next: CoffeeTrail = {};
  for (const [where, rings] of Object.entries(trail)) {
    const drying = rings.filter((ring) => ring.strength > 0).map(dry);
    if (fresh[where]) drying.unshift(fresh[where]);
    if (drying.length) next[where] = drying;
  }
  for (const [where, ring] of Object.entries(fresh)) if (!next[where]) next[where] = [ring];
  return next;
}

const NONE: CoffeeStain[] = [];
const BARE: Surface[] = [];

/**
 * The desk's side of it: the rings each thing is carrying, and a watch on the
 * mug. The mug has been standing somewhere since before anyone looked at the
 * desk, so there is a ring under it from the start, hidden by the mug itself.
 * `lift` is called as the mug first moves, and only takes it off its ring —
 * what it leaves is already on the desk. `settle` sets it down again, when it
 * is dropped or when the keyboard leaves it, and that is when the coffee goes
 * down. `over` is what lies on the desk at that moment, underneath first.
 */
export function useCoffeeTrail(mug: () => MugPlace, over: () => readonly Surface[] = () => BARE) {
  const [trail, setTrail] = useState<CoffeeTrail>({});
  const standing = useRef(true);
  const stood = useRef(false);

  /* Where the mug was standing when the desk was first laid out. */
  useEffect(() => {
    if (stood.current) return;
    stood.current = true;
    setTrail((down) => setDown(down, mug(), over()));
    // Once, on the desk as it is found.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lift = () => {
    standing.current = false;
  };
  const settleAt = (place?: MugPlace) => {
    if (standing.current) return;
    standing.current = true;
    setTrail((down) => setDown(down, place ?? mug(), over()));
  };

  /** The rings left on one thing, newest first. */
  const on = (where: string) => trail[where] ?? NONE;

  return { trail, on, lift, settle: () => settleAt(), settleAt };
}
