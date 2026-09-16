import type React from 'react';
import { Children, useEffect, useId, useRef, useState } from 'react';
import { Weathered } from '../../behaviors/Weathered/Weathered';
import { Distressed } from '../../foundations/Distressed/Distressed';
import '../../styles/fonts.css';
import './MiniZine.css';

/** Copy paper: the reams a copy shop keeps beside the machine. */
export const ZINE_STOCKS = ['white', 'canary', 'goldenrod', 'lilac', 'pink'] as const;
export type ZineStock = (typeof ZINE_STOCKS)[number];

/** One letter sheet folded into eight: four leaves, eight pages. */
export const ZINE_PAGES = 8;
export const ZINE_LEAVES = ZINE_PAGES / 2;
/** Spreads: 0 is the closed cover, 1 to 3 the inside, 4 the closed back. */
export const ZINE_SPREADS = ZINE_LEAVES;
/** How long a page takes to turn, in milliseconds. */
export const ZINE_TURN_MS = 800;

export type MiniZineProps = {
  /** The eight pages in reading order, the cover first. Missing pages are left blank. */
  pages: React.ReactNode[];
  stock?: ZineStock;
  /** Which spread is open: 0 for the cover, 4 for the back cover. Changing it turns the leaves. */
  spread?: number;
  /** Tilt of the booklet on the desk, in degrees. */
  rotation?: number;
  /** Length of one page turn, in milliseconds. */
  duration?: number;
  /** Called once a turn has settled, with the spread now open. */
  onTurn?: (spread: number) => void;
  className?: string;
  style?: React.CSSProperties;
};

const clampSpread = (spread: number) => Math.max(0, Math.min(ZINE_SPREADS, Math.round(spread)));

/** What a screen reader is told is open. */
export const describeSpread = (spread: number) =>
  spread <= 0 ? 'Cover' : spread >= ZINE_SPREADS ? 'Back cover' : `Pages ${2 * spread} and ${2 * spread + 1} of ${ZINE_PAGES}`;

/**
 * An eight-page mini zine: one letter sheet folded into 2¾ by 4¼ inch pages
 * and run off on a photocopier, so each page's print sits a little skewed on
 * the paper and the toner is heavy. It lies on the desk and opens like a
 * booklet: click the right page to turn it, the left page to turn back. Each
 * leaf swings around the spine with a page on either side. The open spread is
 * 1440 units wide, one page 720, like the folder.
 */
export function MiniZine({
  pages,
  stock = 'white',
  spread: wantedSpread = 0,
  rotation = 0,
  duration = ZINE_TURN_MS,
  onTurn,
  className = '',
  style,
}: MiniZineProps) {
  const [spread, setSpread] = useState(() => clampSpread(wantedSpread));
  const [turning, setTurning] = useState(false);
  const settle = useRef<number | undefined>(undefined);
  const statusId = useId();
  const sheets = Children.toArray(pages);

  const turnTo = (next: number) => {
    next = clampSpread(next);
    if (turning || next === spread) return;
    setSpread(next);
    const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still) {
      onTurn?.(next);
      return;
    }
    setTurning(true);
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      setTurning(false);
      onTurn?.(next);
    }, duration);
  };

  useEffect(() => {
    turnTo(wantedSpread);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantedSpread]);

  useEffect(() => () => window.clearTimeout(settle.current), []);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowRight') turnTo(spread + 1);
    if (event.key === 'ArrowLeft') turnTo(spread - 1);
  };

  const closed = spread === 0 ? 'front' : spread === ZINE_SPREADS ? 'back' : undefined;
  const cssVars = { '--zine-rotation': `${rotation}deg`, '--zine-turn': `${duration}ms` } as React.CSSProperties;

  return (
    <div
      className={`zine ${className}`}
      data-stock={stock}
      data-closed={closed}
      data-turning={turning ? '' : undefined}
      style={{ ...cssVars, ...style }}
      role="group"
      aria-label="Mini zine"
      aria-describedby={statusId}
      onKeyDown={onKeyDown}
    >
      <div className="zine__book">
        {Array.from({ length: ZINE_LEAVES }, (_, index) => {
          const leaf = index + 1;
          const turned = spread >= leaf;
          const rectoShown = spread === leaf - 1;
          const versoShown = spread === leaf;
          return (
            <div
              key={leaf}
              className="zine__leaf"
              data-leaf={leaf}
              data-turned={turned ? '' : undefined}
              style={{ '--zine-leaf': leaf, zIndex: turning && (spread === leaf || spread === leaf - 1) ? 10 : turned ? leaf : ZINE_LEAVES + 1 - leaf } as React.CSSProperties}
            >
              <Weathered className="zine__page zine__page--recto" wear={0.3} grain aria-hidden={!rectoShown} inert={!rectoShown}>
                <div className="zine__print" style={{ '--zine-page': 2 * leaf - 1 } as React.CSSProperties}>
                  {sheets[2 * leaf - 2]}
                </div>
              </Weathered>
              <Weathered className="zine__page zine__page--verso" wear={0.3} grain aria-hidden={!versoShown} inert={!versoShown}>
                <div className="zine__print" style={{ '--zine-page': 2 * leaf } as React.CSSProperties}>
                  {sheets[2 * leaf - 1]}
                </div>
              </Weathered>
            </div>
          );
        })}
        {spread > 0 ? (
          <button type="button" className="zine__turn zine__turn--back" aria-label="Turn back" aria-disabled={turning || undefined} onClick={() => turnTo(spread - 1)} />
        ) : null}
        {spread < ZINE_SPREADS ? (
          <button type="button" className="zine__turn zine__turn--forward" aria-label="Turn the page" aria-disabled={turning || undefined} onClick={() => turnTo(spread + 1)} />
        ) : null}
      </div>
      <span id={statusId} className="zine__status" role="status" aria-live="polite">
        {turning ? 'Turning the page' : describeSpread(spread)}
      </span>
    </div>
  );
}

/* --- Print furniture ------------------------------------------------------
   What a zine page is pasted up from. It all comes out in toner. */

/** Display type, hand-pasted from a photocopied enlargement. */
export function ZineTitle({ children, size = 96 }: { children: React.ReactNode; size?: number }) {
  return (
    <h2 className="zine-print__title" style={{ '--zine-title-size': size } as React.CSSProperties}>
      <Distressed>{children}</Distressed>
    </h2>
  );
}

/** A typed heading, in capitals. */
export function ZineHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="zine-print__heading">{children}</h3>;
}

/** Typed running text. */
export function ZineText({ children }: { children: React.ReactNode }) {
  return <div className="zine-print__text">{children}</div>;
}

/** A line in marker pen. */
export function ZineNote({ children, size = 34, rotation = -2 }: { children: React.ReactNode; size?: number; rotation?: number }) {
  return (
    <p className="zine-print__note" style={{ '--zine-note-size': size, '--zine-note-rotation': `${rotation}deg` } as React.CSSProperties}>
      {children}
    </p>
  );
}

/** A photograph through the copier: no greys to speak of, all toner and paper. */
export function ZinePhoto({ src, alt, caption, height = 420, focus = '50% 50%', cutout = false }: { src: string; alt: string; caption?: React.ReactNode; height?: number; focus?: string; cutout?: boolean }) {
  return (
    <figure className="zine-print__photo" data-cutout={cutout ? '' : undefined} style={{ '--zine-photo-height': height, '--zine-photo-focus': focus } as React.CSSProperties}>
      <img src={src} alt={alt} />
      {caption != null ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

/** Short typed lines, each with a hand-drawn tick. */
export function ZineList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="zine-print__list">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

/** The running foot: page number one side, a line the other. */
export function ZineFolio({ page, children }: { page: number; children?: React.ReactNode }) {
  return (
    <p className="zine-print__folio">
      <span>{children}</span>
      <span>{page}</span>
    </p>
  );
}
