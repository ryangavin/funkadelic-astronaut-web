import { Children, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { PACKET_RATIO } from '../../components/Packet/Packet';
import { DEFAULT_SIFT_MS, depthOf, movesBetween, sift, slotFor } from './sift';
import './Stack.css';

export { DEFAULT_SIFT_MS, STACK_TILTS, depthOf, movesBetween, siftKeyframes, slotFor } from './sift';

export type StackProps = {
  /** Which child is on top of the pile. Changing it sifts. */
  index: number;
  /** The packets, in the order they are filed. */
  children: ReactNode;
  /** Aspect ratio of one packet, which sizes the pile. */
  ratio?: string;
  /** How far the deeper packets peek out. 1 is a loosely handled pile. */
  spread?: number;
  /** Length of one sift, in milliseconds. */
  duration?: number;
  /** Which way the hand swings a packet out: 1 is to the right. */
  side?: 1 | -1;
  className?: string;
  style?: CSSProperties;
};

/**
 * A pile of packets being sifted through. Each child rests in a slot by depth;
 * when `index` changes, the top packet is lifted and dropped under the pile,
 * or the wanted one is pulled out from under and landed on top.
 */
export function Stack({ index, children, ratio = PACKET_RATIO, spread = 1, duration = DEFAULT_SIFT_MS, side = 1, className = '', style }: StackProps) {
  const host = useRef<HTMLDivElement>(null);
  const shown = useRef(index);
  const items = Children.toArray(children);
  const count = items.length;

  useLayoutEffect(() => {
    const el = host.current;
    if (!el) return;
    const nodes = [...el.children] as HTMLElement[];
    const from = shown.current;
    shown.current = index;
    const reduced = el.ownerDocument.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches ?? false;
    const moves = reduced ? [] : movesBetween(from, index, count);
    const cancels: (() => void)[] = [];
    nodes.forEach((node, item) => {
      const slot = slotFor(item, depthOf(item, index, count), count, spread);
      const move = moves.find((candidate) => candidate.item === item);
      if (move) {
        cancels.push(sift(node, move.kind, slotFor(item, depthOf(item, from, count), count, spread), slot, { duration, side }));
        return;
      }
      const settling = from !== index && !reduced;
      node.style.transition = settling ? `transform ${duration * 0.55}ms cubic-bezier(0.2, 0.7, 0.2, 1) ${duration * 0.2}ms` : 'none';
      node.style.transform = slot.transform;
      node.style.zIndex = String(slot.zIndex);
    });
    return () => cancels.forEach((cancel) => cancel());
  }, [index, count, spread, duration, side]);

  return (
    <div ref={host} className={`stack ${className}`} style={{ aspectRatio: ratio, ...style }}>
      {items.map((child, item) => (
        <div key={(child as { key?: string | null }).key ?? item} className="stack__item">
          {child}
        </div>
      ))}
    </div>
  );
}
