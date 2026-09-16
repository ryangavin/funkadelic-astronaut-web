import type React from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { Weathered } from '../../behaviors/Weathered/Weathered';
import { Distressed } from '../../foundations/Distressed/Distressed';
import '../../styles/fonts.css';
import './Handbill.css';

/** Coloured uncoated card, the stock a print shop keeps for cheap show handbills. */
export const HANDBILL_STOCKS = ['goldenrod', 'orange', 'pink', 'sky', 'white'] as const;
export type HandbillStock = (typeof HANDBILL_STOCKS)[number];
/** The second ink of a two-colour job, from the site's palette. */
export const HANDBILL_SPOTS = ['red', 'blue', 'purple', 'green', 'amber'] as const;
export type HandbillSpot = (typeof HANDBILL_SPOTS)[number];
export const HANDBILL_SIDES = ['front', 'back'] as const;
export type HandbillSide = (typeof HANDBILL_SIDES)[number];

/** How long the card takes to turn over, in milliseconds. */
export const HANDBILL_TURN_MS = 900;

export type HandbillProps = {
  /** What is printed on the front. Use the print furniture: `HandbillTitle`, `HandbillKicker` and the rest. */
  front: React.ReactNode;
  /** What is printed on the back. */
  back: React.ReactNode;
  stock?: HandbillStock;
  /** The spot colour. The dark ink is always the site's night blue. */
  spot?: HandbillSpot;
  /** Which side is up. Changing it turns the card over. */
  side?: HandbillSide;
  /** Tilt of the card on the desk, in degrees. */
  rotation?: number;
  /** Length of one turn, in milliseconds. */
  duration?: number;
  /** Called after the card has been turned and has settled. */
  onTurn?: (side: HandbillSide) => void;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * A quarter-sheet show handbill: 4¼ by 5½ inches of coloured card, printed on
 * both sides in two inks with the registration a hair off, as a print shop turns
 * them out by the thousand. Click it and it is picked up and turned over; the
 * printed hint on each side says there is more on the other. Measured in
 * 720ths of its width.
 */
export function Handbill({
  front,
  back,
  stock = 'goldenrod',
  spot = 'red',
  side: wantedSide = 'front',
  rotation = 0,
  duration = HANDBILL_TURN_MS,
  onTurn,
  className = '',
  style,
}: HandbillProps) {
  const [side, setSide] = useState<HandbillSide>(wantedSide);
  const [turning, setTurning] = useState(false);
  const settle = useRef<number | undefined>(undefined);
  const statusId = useId();

  const turnTo = (next: HandbillSide) => {
    if (turning || next === side) return;
    setSide(next);
    const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still) {
      onTurn?.(next);
      return;
    }
    setTurning(true);
    // The lift and the turn are separate motions on the same clock, so the
    // handbill is put down again when the clock runs out, not on an event
    // either could fire first.
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      setTurning(false);
      onTurn?.(next);
    }, duration);
  };

  // The prop turns the card the way a click does.
  useEffect(() => {
    turnTo(wantedSide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantedSide]);

  useEffect(() => () => window.clearTimeout(settle.current), []);

  const cssVars = { '--handbill-rotation': `${rotation}deg`, '--handbill-turn': `${duration}ms` } as React.CSSProperties;

  return (
    <div
      className={`handbill ${className}`}
      data-stock={stock}
      data-spot={spot}
      data-side={side}
      data-turning={turning ? '' : undefined}
      style={{ ...cssVars, ...style }}
    >
      <div className="handbill__scene">
        <span className="handbill__shadow" aria-hidden="true" />
        <div className="handbill__lift">
          <div className="handbill__card">
            <Weathered className="handbill__face handbill__face--front" wear={0.35} flecks={0.4} aria-hidden={side !== 'front'} inert={side !== 'front'}>
              <span className="handbill__frame" aria-hidden="true" />
              {front}
            </Weathered>
            <Weathered className="handbill__face handbill__face--back" wear={0.35} flecks={0.4} aria-hidden={side !== 'back'} inert={side !== 'back'}>
              <span className="handbill__frame" aria-hidden="true" />
              {back}
            </Weathered>
          </div>
        </div>
        <button
          type="button"
          className="handbill__turn"
          aria-label={side === 'front' ? 'Turn the handbill over' : 'Turn the handbill back'}
          aria-describedby={statusId}
          aria-disabled={turning || undefined}
          onClick={() => turnTo(side === 'front' ? 'back' : 'front')}
        />
      </div>
      <span id={statusId} className="handbill__status" role="status" aria-live="polite">
        {turning ? 'Turning the handbill' : side === 'front' ? 'Front of the handbill' : 'Back of the handbill'}
      </span>
    </div>
  );
}

/* --- Print furniture ------------------------------------------------------
   The pieces a handbill is set from. Each is printed in the dark ink unless it
   says otherwise, and sized in the card's own units. */

/** A small line of capitals along the top of the card. `right` prints at the other end. */
export function HandbillKicker({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <p className="handbill-print__kicker">
      <span>{children}</span>
      {right != null ? <span>{right}</span> : null}
    </p>
  );
}

/** Display type in the site's fat face, letterpressed, with its shadow printed in the spot colour. */
export function HandbillTitle({ children, size = 118, as: Tag = 'h2' }: { children: React.ReactNode; size?: number; as?: 'h2' | 'h3' | 'p' }) {
  return (
    <Tag className="handbill-print__title" style={{ '--handbill-title-size': size } as React.CSSProperties}>
      <Distressed className="handbill-print__title-ink">{children}</Distressed>
    </Tag>
  );
}

/** A picture printed in the dark ink alone, over a sunburst in the spot colour. */
export function HandbillArt({ src, alt = '', burst = true, height = 400 }: { src: string; alt?: string; burst?: boolean; height?: number }) {
  return (
    <figure className="handbill-print__art" style={{ '--handbill-art-height': height } as React.CSSProperties}>
      {burst ? <span className="handbill-print__burst" aria-hidden="true" /> : null}
      <img className="handbill-print__ink-image" src={src} alt={alt} />
    </figure>
  );
}

/** A photograph printed as a one-ink halftone, with a caption in small capitals. */
export function HandbillPhoto({ src, alt, caption, height = 340, focus = '50% 50%' }: { src: string; alt: string; caption?: React.ReactNode; height?: number; focus?: string }) {
  return (
    <figure className="handbill-print__photo" style={{ '--handbill-photo-height': height, '--handbill-photo-focus': focus } as React.CSSProperties}>
      <img className="handbill-print__halftone" src={src} alt={alt} />
      {caption != null ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

/** A solid bar of the dark ink with the stock showing through the letters. */
export function HandbillBand({ children }: { children: React.ReactNode }) {
  return <p className="handbill-print__band">{children}</p>;
}

/** Running text in the site's typed face. */
export function HandbillBody({ children }: { children: React.ReactNode }) {
  return <div className="handbill-print__body">{children}</div>;
}

/** The small print along the bottom: one line each side. */
export function HandbillFoot({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <p className="handbill-print__foot">
      <span>{children}</span>
      {right != null ? <span>{right}</span> : null}
    </p>
  );
}
