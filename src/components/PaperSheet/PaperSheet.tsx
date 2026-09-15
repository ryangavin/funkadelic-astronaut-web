import type React from 'react';
import { ShapedPaper, type PaperShape } from './ShapedPaper';
import '../../styles/fonts.css';
import '../../styles/torn-edge.css';
import './PaperSheet.css';

export const PAPER_SHEET_REFERENCE_WIDTH = 1440;
export const PAPER_STOCKS = ['wheat', 'white', 'ink', 'pale'] as const;
export type PaperStock = (typeof PAPER_STOCKS)[number];

export type PaperSheetProps = {
  /** Paper colour. Wheat is the site's poster stock. */
  stock?: PaperStock;
  /** Sheet height in reference units (1440 = one sheet width). 0 lets content set it. */
  height?: number;
  /** Thickness of the dark surround that exposes the torn edge, in pixels. */
  surround?: number;
  /** Optional cutout silhouette. Uses its own aspect ratio and no rectangular surround. */
  shape?: PaperShape;
  children?: React.ReactNode;
};

export function PaperSheet({ stock = 'wheat', height = 900, surround = 10, shape, children }: PaperSheetProps) {
  if (shape) return <ShapedPaper stock={stock} shape={shape}>{children}</ShapedPaper>;

  const sheetStyle = {
    '--paper-sheet-height': height > 0 ? `calc(${height} * var(--sheet-unit))` : 'auto',
  } as React.CSSProperties;

  return (
    <div
      className="paper-sheet-surround"
      style={{ '--paper-sheet-surround': `${surround}px` } as React.CSSProperties}
    >
      <section className="paper-sheet torn-edge" data-stock={stock} style={sheetStyle}>
        <div className="paper-sheet__stage">{children}</div>
        <div className="paper-sheet__wear" aria-hidden="true" />
      </section>
    </div>
  );
}
