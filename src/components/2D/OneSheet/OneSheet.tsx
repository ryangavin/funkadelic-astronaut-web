import type React from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { Weathered } from '../../../behaviors/Weathered/Weathered';
import { Distressed } from '../../../foundations/Distressed/Distressed';
import '../../../styles/fonts.css';
import './OneSheet.css';

/** Office paper: what the one-sheet came off the laser printer on. */
export const ONE_SHEET_STOCKS = ['bond', 'ivory', 'grey'] as const;
export type OneSheetStock = (typeof ONE_SHEET_STOCKS)[number];
/** How long the pull open takes, in milliseconds. Folding back takes about as long. */
export const ONE_SHEET_PULL_MS = 900;
/** The three panels' names, top to bottom. */
export const ONE_SHEET_PANELS = ['a', 'b', 'c'] as const;

/** What is printed on the three panels. */
export type OneSheetContent = {
  /** The top panel: the part that shows while the sheet is folded. */
  top: React.ReactNode;
  /** The middle panel. */
  middle: React.ReactNode;
  /** The bottom panel. */
  bottom: React.ReactNode;
};

export type OneSheetProps = OneSheetContent & {
  stock?: OneSheetStock;
  /** Whether the sheet is unfolded. Changing it pulls it open or folds it back. */
  open?: boolean;
  /** Tilt of the sheet on the desk, in degrees. */
  rotation?: number;
  /** Length of the pull open, in milliseconds. Folding back takes about as long. */
  duration?: number;
  /** Called once the sheet has settled open or folded. */
  onToggle?: (open: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * A press one-sheet: a letter-size page, 8½ by 11 inches, folded in three the
 * way a letter goes into an envelope, but as a Z so the top panel stays face
 * up. Folded, that panel shows, tilted up off the packet because the creases
 * spring a little, with the bottom panel peeking out flat beneath it. Click it
 * and the bottom panel is pulled out from under the top one, both creases
 * opening together so it stays face up. Fold it again and it goes back the way
 * a hand does it: the bottom panel flipped up onto the middle, then the middle
 * tucked behind the top.
 * Measured in 720ths of its width, so each panel is 932 / 3 tall.
 */
export function OneSheet({
  top,
  middle,
  bottom,
  stock = 'bond',
  open: wantedOpen = false,
  rotation = 0,
  duration = ONE_SHEET_PULL_MS,
  onToggle,
  className = '',
  style,
}: OneSheetProps) {
  const [open, setOpen] = useState(wantedOpen);
  const [moving, setMoving] = useState(false);
  const settle = useRef<number | undefined>(undefined);
  const statusId = useId();
  const sheetId = useId();

  const set = (next: boolean) => {
    if (moving || next === open) return;
    setOpen(next);
    const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still) {
      onToggle?.(next);
      return;
    }
    setMoving(true);
    window.clearTimeout(settle.current);
    // The pull is one motion; folding is two tucks of 0.6, the second starting 0.75 into the first.
    settle.current = window.setTimeout(() => {
      setMoving(false);
      onToggle?.(next);
    }, next ? duration : duration * 1.05);
  };

  useEffect(() => {
    set(wantedOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantedOpen]);

  useEffect(() => () => window.clearTimeout(settle.current), []);

  const cssVars = { '--one-sheet-rotation': `${rotation}deg`, '--one-sheet-pull': `${duration}ms` } as React.CSSProperties;

  return (
    <div
      className={`one-sheet ${className}`}
      data-stock={stock}
      data-open={open ? 'true' : 'false'}
      data-moving={moving ? '' : undefined}
      style={{ ...cssVars, ...style }}
      role="group"
      aria-label="Press one-sheet"
      aria-describedby={statusId}
    >
      <div className="one-sheet__scene" id={sheetId}>
        <span className="one-sheet__shadow" aria-hidden="true" />
        <div className="one-sheet__panel one-sheet__panel--a">
          <Weathered className="one-sheet__face one-sheet__face--front" grain>
            {top}
          </Weathered>
          <div className="one-sheet__panel one-sheet__panel--b">
            <Weathered className="one-sheet__face one-sheet__face--front" grain aria-hidden={!open} inert={!open}>
              <span className="one-sheet__crease one-sheet__crease--mountain" aria-hidden="true" />
              {middle}
            </Weathered>
            <span className="one-sheet__face one-sheet__face--back" aria-hidden="true" />
            <div className="one-sheet__panel one-sheet__panel--c">
              <Weathered className="one-sheet__face one-sheet__face--front" grain aria-hidden={!open} inert={!open}>
                <span className="one-sheet__crease one-sheet__crease--valley" aria-hidden="true" />
                {bottom}
                <button
                  type="button"
                  className="one-sheet__fold"
                  aria-label="Fold the one-sheet"
                  aria-expanded="true"
                  aria-controls={sheetId}
                  aria-disabled={moving || undefined}
                  onClick={() => set(false)}
                >
                  fold ↑
                </button>
              </Weathered>
              <span className="one-sheet__face one-sheet__face--back" aria-hidden="true" />
            </div>
          </div>
        </div>
        {open ? null : (
          <button
            type="button"
            className="one-sheet__unfold"
            aria-label="Unfold the one-sheet"
            aria-expanded="false"
            aria-controls={sheetId}
            aria-disabled={moving || undefined}
            onClick={() => set(true)}
          />
        )}
      </div>
      <span id={statusId} className="one-sheet__status" role="status" aria-live="polite">
        {moving ? (open ? 'Unfolding' : 'Folding') : open ? 'Unfolded' : 'Folded: the top panel shows'}
      </span>
    </div>
  );
}

/* --- Print furniture ------------------------------------------------------
   The parts of a one-sheet: a laser printer's black on office paper. */

/** The letterhead across the top: the name in the fat face, the rest typed at the right, a rule beneath. */
export function OneSheetLetterhead({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <header className="one-sheet-print__letterhead">
      <h2 className="one-sheet-print__name">
        <Distressed>{children}</Distressed>
      </h2>
      {aside != null ? <div className="one-sheet-print__aside">{aside}</div> : null}
    </header>
  );
}

const letters = (word: string) => [...word].map((letter, index) => <i key={index}>{letter}</i>);

/**
 * A two-line lockup for the corner of the letterhead: a word in the space-age
 * geometric over a word in the heavy grotesque. The wider word sets the width
 * and the other's letters are spread to meet it, as a label sets its mark.
 */
export function OneSheetTag({ over, under }: { over: string; under: string }) {
  return (
    <span className="one-sheet-print__tag" aria-label={`${over} ${under}`}>
      <span className="one-sheet-print__tag-over" aria-hidden="true">
        {letters(over)}
      </span>
      <span className="one-sheet-print__tag-under" aria-hidden="true">
        {letters(under)}
      </span>
    </span>
  );
}

/** A small typed heading in capitals. */
export function OneSheetHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="one-sheet-print__heading">{children}</h3>;
}

/** Typed running text. */
export function OneSheetText({ children }: { children: React.ReactNode }) {
  return <div className="one-sheet-print__text">{children}</div>;
}

/** Side-by-side columns. */
export function OneSheetColumns({ children, count = 3 }: { children: React.ReactNode; count?: number }) {
  return (
    <div className="one-sheet-print__columns" style={{ '--one-sheet-columns': count } as React.CSSProperties}>
      {children}
    </div>
  );
}

export type OneSheetPhotoProps = {
  src: string;
  alt: string;
  caption?: React.ReactNode;
  /** Height of the whole photograph, in 720ths of the sheet's width. */
  height?: number;
  focus?: string;
  /** How much of the top of the photograph is printed on the panel above, across the crease. */
  spill?: number;
};

/**
 * A photograph off the laser printer: greyscale, light, no gloss. With `spill`
 * it runs across the crease: the top of it is printed on the panel above with
 * `OneSheetPhotoSpill`, and this shows the rest from where that left off.
 */
export function OneSheetPhoto({ src, alt, caption, height = 200, focus = '50% 50%', spill = 0 }: OneSheetPhotoProps) {
  return (
    <figure
      className="one-sheet-print__photo"
      data-spill={spill > 0 ? '' : undefined}
      style={{ '--one-sheet-photo-height': height, '--one-sheet-photo-focus': focus, '--one-sheet-photo-spill': spill } as React.CSSProperties}
    >
      <span className="one-sheet-print__photo-window">
        <img src={src} alt={alt} />
      </span>
      {caption != null ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

/** The top of a photograph that spills over the crease, printed flush with the bottom of its panel. */
export function OneSheetPhotoSpill({ src, height = 200, focus = '50% 50%', spill = 60 }: Omit<OneSheetPhotoProps, 'alt' | 'caption'>) {
  return (
    <span
      className="one-sheet-print__photo-spill"
      aria-hidden="true"
      style={{ '--one-sheet-photo-height': height, '--one-sheet-photo-focus': focus, '--one-sheet-photo-spill': spill } as React.CSSProperties}
    >
      <img src={src} alt="" />
    </span>
  );
}

/** Labelled facts, typed. */
export function OneSheetFacts({ items }: { items: { label: React.ReactNode; value: React.ReactNode }[] }) {
  return (
    <dl className="one-sheet-print__facts">
      {items.map((item, index) => (
        <div key={index}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A line in pen, added after printing. */
export function OneSheetNote({ children, rotation = -2 }: { children: React.ReactNode; rotation?: number }) {
  return (
    <p className="one-sheet-print__note" style={{ '--one-sheet-note-rotation': `${rotation}deg` } as React.CSSProperties}>
      {children}
    </p>
  );
}

/** The foot of the page: one line each side, above nothing. */
export function OneSheetFoot({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <p className="one-sheet-print__foot">
      <span>{children}</span>
      {right != null ? <span>{right}</span> : null}
    </p>
  );
}
