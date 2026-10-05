import { useCallback, useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { attachFrameMeter, frameNote, frameState, BUDGET_MS, type FrameReadout } from './meter';
import './FrameRate.css';

export { BUDGET_MS } from './meter';
export type { FrameReadout, FrameStats } from './meter';

export type FrameRateProps = {
  /** Whether to measure at all. False renders nothing and starts no clock, so it can be left in place behind a switch. */
  on?: boolean;
  /** Which corner it sits in. */
  corner?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Just the number, or the frame times and the two piles under it. */
  detail?: boolean;
  /** A frame at or under this is the budget met, in milliseconds. */
  budgetMs?: number;
  /** How many frames each pile remembers. */
  sample?: number;
  /** How often the readout is written, in milliseconds. */
  cadence?: number;
  /** A name for what is being watched, shown above the figure. */
  label?: string;
  /** Called with every reading, for a caller that wants to log or assert on them. */
  onRead?: (readout: FrameReadout) => void;
  className?: string;
  style?: CSSProperties;
};

/**
 * A live frame counter pinned to a corner, for watching the cost of something
 * while working it by hand.
 *
 * Drop it anywhere inside the thing being watched — it measures the window, not
 * its own subtree, so where it goes makes no difference to the figures. The
 * large number is the recent past; under it are the frames while a pointer was
 * down, which is the only figure that means anything, kept apart from the
 * frames at rest, which always read the refresh whether the desk is fast or
 * simply not being drawn. The line at the bottom says which of those it thinks
 * is happening.
 *
 * It takes no pointer events, so it can sit over a desk being dragged, and it
 * carries no filter or shadow of its own: a readout that cost a rasterised
 * layer per frame would be reporting its own weight.
 */
export function FrameRate({
  on = true,
  corner = 'bottom-right',
  detail = true,
  budgetMs = BUDGET_MS,
  sample = 120,
  cadence = 250,
  label,
  onRead,
  className = '',
  style,
}: FrameRateProps) {
  const root = useRef<HTMLDivElement>(null);
  const fps = useRef<HTMLSpanElement>(null);
  const median = useRef<HTMLElement>(null);
  const worst = useRef<HTMLElement>(null);
  const dragged = useRef<HTMLElement>(null);
  const resting = useRef<HTMLElement>(null);
  const note = useRef<HTMLParagraphElement>(null);
  /* Held in a ref and read inside the callback so a caller passing a fresh
     function each render does not restart the clock and throw away the piles. */
  const told = useRef(onRead);
  told.current = onRead;

  /*
    Written straight into the nodes rather than through state. The readout is
    inside the thing it is measuring, so setting state here would re-render the
    desk four times a second and the meter would be reporting a cost it had
    itself created.
  */
  const paint = useCallback((readout: FrameReadout) => {
    const { live, load, rest } = readout;
    const shown = load.frames ? load : live;
    if (root.current) {
      root.current.dataset.state = frameState(shown, budgetMs);
      root.current.dataset.busy = readout.busy ? 'true' : 'false';
    }
    if (fps.current) fps.current.textContent = shown.frames ? String(shown.fps) : '—';
    if (median.current) median.current.textContent = shown.frames ? `${shown.medianMs.toFixed(1)} ms` : '—';
    if (worst.current) worst.current.textContent = shown.frames ? `${shown.worstMs.toFixed(1)} ms` : '—';
    if (dragged.current) dragged.current.textContent = load.frames ? `${load.fps} fps · ${load.medianMs.toFixed(1)} ms` : 'not yet';
    if (resting.current) resting.current.textContent = rest.frames ? `${rest.fps} fps · ${rest.medianMs.toFixed(1)} ms` : 'not yet';
    if (note.current) note.current.textContent = frameNote(readout);
    told.current?.(readout);
  }, [budgetMs]);

  useEffect(() => {
    if (!on) return;
    const win = root.current?.ownerDocument.defaultView;
    if (!win) return;
    const meter = attachFrameMeter(win, { sample, cadence, budgetMs, onRead: paint });
    return meter.stop;
  }, [on, sample, cadence, budgetMs, paint]);

  if (!on) return null;
  return (
    <div
      ref={root}
      className={`frame-rate ${className}`}
      data-corner={corner}
      data-detail={detail ? 'true' : 'false'}
      data-state="waiting"
      role="status"
      aria-live="off"
      aria-label={label ? `Frame rate: ${label}` : 'Frame rate'}
      style={style}
    >
      {label ? <p className="frame-rate__label">{label}</p> : null}
      <p className="frame-rate__now">
        <span ref={fps} className="frame-rate__fps">—</span>
        <small>fps</small>
      </p>
      {detail ? (
        <>
          <dl className="frame-rate__detail">
            <div><dt>frame</dt><dd ref={median}>—</dd></div>
            <div><dt>worst</dt><dd ref={worst}>—</dd></div>
            <div><dt>dragging</dt><dd ref={dragged}>not yet</dd></div>
            <div><dt>at rest</dt><dd ref={resting}>not yet</dd></div>
          </dl>
          <p ref={note} className="frame-rate__note" />
        </>
      ) : null}
    </div>
  );
}

/**
 * The easy way in: wrap anything and it gets the counter.
 *
 * Written to suit a Storybook decorator, which is the usual reason to want
 * one — `decorators: [withFrameRate()]` on a meta puts the readout over every
 * story in the file without any of them knowing.
 */
export function withFrameRate(props: FrameRateProps = {}) {
  return function frameRated(story: () => ReactNode) {
    return (
      <>
        {story()}
        <FrameRate {...props} />
      </>
    );
  };
}
