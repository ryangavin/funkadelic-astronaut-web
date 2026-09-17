import type React from 'react';
import { MARGINS, STOCK, advance, capHeight, printBand, tapeMm, tapeUnits, type Margin, type TapeStock, type TapeWidth } from './tape';
import './PrintedLabel.css';

export { TAPE_STOCKS, TAPE_WIDTHS, tapeMm, type Margin, type TapeStock, type TapeWidth } from './tape';

export type PrintedLabelProps = {
  /** What was printed on it. */
  text?: string;
  /** Which cassette it came off, in millimetres across. */
  width?: TapeWidth;
  /** Which ink on which tape. */
  stock?: TapeStock;
  /** How much blank the cutter left at each end. */
  margin?: Margin;
  /** How it came to rest, in degrees. */
  rotation?: number;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * A strip of laminated tape, printed and cut off and lying wherever it was
 * put down. The print is inside the sandwich rather than on top of it, so
 * there is nothing raised to catch the light and nothing to rub off: seen
 * from above it is a flat rectangle of tape with flat ink in it, which is
 * exactly what makes it duller and more durable than an embossed one.
 *
 * Every glyph is set at the advance the machine worked out for it, so the
 * drawing and the length on the screen are the same arithmetic and a strip
 * that says 58 mm measures 58 mm. Sized by its parent's width.
 */
export function PrintedLabel({ text = '', width = 12, stock = 'black-on-white', margin = 'full', rotation = 0, className = '', style }: PrintedLabelProps) {
  const units = tapeUnits(text, width, margin);
  const tall = width / 0.25;
  const paint = STOCK[stock];
  const vars = {
    '--printed-unit': `calc(100% / ${units})`,
    '--printed-ink': paint.ink,
    '--printed-tape': paint.tape,
    '--printed-edge': paint.edge,
    '--printed-rotation': `${rotation}deg`,
    '--printed-margin': MARGINS[margin],
    '--printed-band': printBand(width),
    '--printed-cap': capHeight(width),
    aspectRatio: `${units} / ${tall}`,
    ...style,
  } as React.CSSProperties;
  return (
    <div
      className={`printed-label ${className}`}
      data-stock={stock}
      role="img"
      aria-label={text.trim() ? `Printed label, ${paint.name}, ${width} mm: ${text.trim()}` : `A blank strip of ${width} mm ${paint.name} tape`}
      style={vars}
    >
      <span className="printed-label__print" aria-hidden="true">
        {[...text].map((character, index) => (
          <span
            className="printed-label__glyph"
            key={`${index}-${character}`}
            style={{ '--printed-advance': advance(character, width) } as React.CSSProperties}
          >
            {character === ' ' ? ' ' : character}
          </span>
        ))}
      </span>
    </div>
  );
}

/** How long a strip carrying this text runs, in millimetres. */
export const printedMm = tapeMm;
