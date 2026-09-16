/*
  A pile of packets, and the hand that sifts through it. The maths here is pure:
  where each packet rests by depth, which packet flies when the top changes,
  and the keyframes of that flight. The DOM work at the bottom applies them.
*/

export const DEFAULT_SIFT_MS = 900;

/** Resting tilt per packet, in degrees, so the pile never looks squared up. */
export const STACK_TILTS = [-2.4, 1.9, -1.1, 2.8, -3.2, 1.4];

export type StackSlot = {
  depth: number;
  /** Offsets as percentages of the packet's own size. */
  dx: number;
  dy: number;
  rotate: number;
  scale: number;
  zIndex: number;
  transform: string;
};

export type StackMoveKind = 'toBack' | 'toFront';
export type StackMove = { item: number; kind: StackMoveKind };

const transform = (dx: number, dy: number, rotate: number, scale: number) =>
  `translate(${dx.toFixed(2)}%, ${dy.toFixed(2)}%) rotate(${rotate.toFixed(2)}deg) scale(${scale.toFixed(3)})`;

/** How far down the pile an item sits when `index` is on top. 0 is the top. */
export function depthOf(item: number, index: number, count: number) {
  if (count <= 0) return 0;
  return (((item - index) % count) + count) % count;
}

/** Where an item rests at a given depth. Deeper packets peek out alternately left and right. */
export function slotFor(item: number, depth: number, count: number, spread = 1): StackSlot {
  const side = item % 2 ? -1 : 1;
  const dx = side * depth * 1.6 * spread;
  const dy = -depth * 1.4 * spread;
  const rotate = STACK_TILTS[item % STACK_TILTS.length] * (depth === 0 ? 0.5 : 1);
  const scale = 1 - depth * 0.012;
  return { depth, dx, dy, rotate, scale, zIndex: count - depth, transform: transform(dx, dy, rotate, scale) };
}

/** Which way round the pile the hand goes to get from one top to another. */
export function directionBetween(from: number, to: number, count: number): 'next' | 'prev' {
  const steps = depthOf(to, from, count);
  return steps <= count / 2 ? 'next' : 'prev';
}

/** The packet that leaves the pile and flies when the top changes. */
export function movesBetween(from: number, to: number, count: number): StackMove[] {
  if (from === to || count < 2) return [];
  return directionBetween(from, to, count) === 'next' ? [{ item: from, kind: 'toBack' }] : [{ item: to, kind: 'toFront' }];
}

/**
 * The flight. To the back: lift off the top, swing out to the side, drop under
 * the pile and settle. To the front: pull out from under, lift, land on top.
 */
export function siftKeyframes(kind: StackMoveKind, from: StackSlot, to: StackSlot, side: 1 | -1 = 1): Keyframe[] {
  if (kind === 'toBack') {
    return [
      { transform: from.transform, offset: 0, easing: 'cubic-bezier(0.3, 0.6, 0.3, 1)' },
      { transform: transform(from.dx + 5 * side, from.dy - 9, from.rotate + 7 * side, 1.05), offset: 0.32, easing: 'cubic-bezier(0.4, 0, 0.6, 1)' },
      { transform: transform(to.dx + 60 * side, to.dy + 3, to.rotate + 11 * side, 1.02), offset: 0.64, easing: 'cubic-bezier(0.2, 0.8, 0.25, 1.25)' },
      { transform: to.transform, offset: 1 },
    ];
  }
  return [
    { transform: from.transform, offset: 0, easing: 'cubic-bezier(0.4, 0, 0.6, 1)' },
    { transform: transform(from.dx - 58 * side, from.dy + 6, from.rotate - 10 * side, 1.02), offset: 0.36, easing: 'cubic-bezier(0.3, 0.6, 0.3, 1)' },
    { transform: transform(to.dx - 12 * side, to.dy - 10, to.rotate - 5 * side, 1.05), offset: 0.7, easing: 'cubic-bezier(0.2, 0.8, 0.25, 1.25)' },
    { transform: to.transform, offset: 1 },
  ];
}

/** The shadow deepens as the packet is lifted and tightens as it lands. */
export function shadowKeyframes(size: number): Keyframe[] {
  const lifted = `drop-shadow(0 ${(size * 0.035).toFixed(1)}px ${(size * 0.05).toFixed(1)}px rgb(18 20 32 / 0.42))`;
  const flat = 'drop-shadow(0 0 0 rgb(18 20 32 / 0))';
  return [{ filter: flat }, { filter: lifted, offset: 0.4 }, { filter: lifted, offset: 0.7 }, { filter: flat }];
}

/** The clipped print lags the card by a beat, then shivers into place. */
export function lagKeyframes(side: 1 | -1 = 1): Keyframe[] {
  return [
    { rotate: '0deg' },
    { rotate: `${-4 * side}deg`, offset: 0.3 },
    { rotate: `${3 * side}deg`, offset: 0.68 },
    { rotate: `${-1.2 * side}deg`, offset: 0.86 },
    { rotate: '0deg' },
  ];
}

/** The point in the flight when the packet passes the pile and changes layer. */
export function layerSwitchAt(kind: StackMoveKind) {
  return kind === 'toBack' ? 0.5 : 0.42;
}

export type SiftOptions = { duration?: number; side?: 1 | -1 };

/** Fly one packet element from one slot to another. Returns a cancel that snaps it into place. */
export function sift(node: HTMLElement, kind: StackMoveKind, from: StackSlot, to: StackSlot, options: SiftOptions = {}) {
  const { duration = DEFAULT_SIFT_MS, side = 1 } = options;
  const win = node.ownerDocument.defaultView;
  node.style.transition = 'none';
  node.style.zIndex = String(kind === 'toBack' ? from.zIndex + 1 : from.zIndex);
  const flight = node.animate(siftKeyframes(kind, from, to, side), { duration, fill: 'forwards' });
  node.animate(shadowKeyframes(node.clientWidth), { duration, easing: 'ease-in-out' });
  node.querySelector<HTMLElement>('[data-stack-lag]')?.animate(lagKeyframes(side), { duration, delay: 60, easing: 'ease-in-out' });
  const layerTimer = win?.setTimeout(() => {
    node.style.zIndex = String(to.zIndex);
  }, duration * layerSwitchAt(kind));
  const settle = () => {
    node.style.transform = to.transform;
    node.style.zIndex = String(to.zIndex);
    flight.cancel();
  };
  flight.onfinish = settle;
  return () => {
    win?.clearTimeout(layerTimer);
    settle();
  };
}
