import { Children, useLayoutEffect, useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { PACKET_RATIO } from '../../components/2D/Packet/Packet';
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
  /** How far the packets lean sideways, on its own. Follows `spread` unless given. */
  spreadX?: number;
  /** Length of one sift, in milliseconds. */
  duration?: number;
  /** Which way the hand swings a packet out: 1 is to the right. */
  side?: 1 | -1;
  /** Makes the pile clickable: a peeking packet is brought to the front, the top one is sent under. */
  onSelect?: (item: number) => void;
  /** Accessible name for each packet's button, given its position in the pile. */
  itemLabel?: (item: number, depth: number) => string;
  className?: string;
  style?: CSSProperties;
};

/**
 * A pile of packets being sifted through. Each child rests in a slot by depth,
 * staggered upward so every name shows; when `index` changes, the top packet is
 * lifted and dropped under the pile, or the wanted one is pulled out from under
 * and landed on top. With `onSelect`, the pile itself is the control. The pile
 * reserves headroom above the front card for the staggered ones.
 */
export function Stack({ index, children, ratio = PACKET_RATIO, spread = 1, spreadX = spread, duration = DEFAULT_SIFT_MS, side = 1, onSelect, itemLabel, className = '', style }: StackProps) {
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
      const slot = slotFor(item, depthOf(item, index, count), count, spread, spreadX);
      const move = moves.find((candidate) => candidate.item === item);
      if (move) {
        cancels.push(sift(node, move.kind, slotFor(item, depthOf(item, from, count), count, spread, spreadX), slot, { duration, side }));
        return;
      }
      const settling = from !== index && !reduced;
      node.style.transition = settling ? `transform ${duration * 0.55}ms cubic-bezier(0.2, 0.7, 0.2, 1) ${duration * 0.2}ms` : 'none';
      node.style.transform = slot.transform;
      node.style.zIndex = String(slot.zIndex);
    });
    return () => cancels.forEach((cancel) => cancel());
  }, [index, count, spread, spreadX, duration, side]);

  // Headroom for the deepest card's stagger, as a share of the width (percent margins resolve against width).
  const [ratioWidth, ratioHeight] = ratio.split('/').map((part) => Number(part.trim()));
  const headroom = count > 1 ? (-slotFor(0, count - 1, count, spread).dy * (ratioHeight / ratioWidth || 0.667)) : 0;
  const select = (item: number) => onSelect?.(item);
  const onKey = (item: number) => (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      select(item);
    }
  };

  return (
    <div ref={host} className={`stack ${className}`} data-selectable={onSelect ? '' : undefined} style={{ aspectRatio: ratio, marginTop: `${headroom.toFixed(2)}%`, ...style }}>
      {items.map((child, item) => {
        const depth = depthOf(item, index, count);
        const side = Math.sign(slotFor(item, depth, count, spread, spreadX).dx) || 1;
        return (
          <div
            key={(child as { key?: string | null }).key ?? item}
            className="stack__item"
            data-depth={depth}
            style={{ '--stack-depth': depth, '--stack-side': side } as CSSProperties}
            role={onSelect ? 'button' : undefined}
            tabIndex={onSelect ? 0 : undefined}
            aria-label={onSelect ? itemLabel?.(item, depth) : undefined}
            onClick={onSelect ? () => select(item) : undefined}
            onKeyDown={onSelect ? onKey(item) : undefined}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}
