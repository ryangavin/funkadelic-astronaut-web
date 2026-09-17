import type React from 'react';
import { Weathered } from '../../../behaviors/Weathered/Weathered';
import { ShapedPaper, type PaperShape } from './ShapedPaper';
import '../../../styles/fonts.css';
import '../../../styles/torn-edge.css';
import './PaperSheet.css';

export const PAPER_SHEET_REFERENCE_WIDTH = 1440;
export const PAPER_STOCKS = ['wheat', 'white', 'ink', 'pale'] as const;
export type PaperStock = (typeof PAPER_STOCKS)[number];

/** The home page hero's sketch treatment: multiplied onto the stock, a touch faded, inked up. */
export const PAPER_SHEET_IMAGE_DEFAULTS = {
  size: 'cover',
  position: 'center',
  opacity: 0.76,
  contrast: 1.5,
} as const;

export type PaperSheetProps = {
  /** Paper colour. Wheat is the site's poster stock. */
  stock?: PaperStock;
  /** Sheet height in reference units (1440 = one sheet width). 0 lets content set it. */
  height?: number;
  /** Thickness of the dark surround that exposes the torn edge, in pixels. */
  surround?: number;
  /** Optional cutout silhouette. Uses its own aspect ratio and no rectangular surround. */
  shape?: PaperShape;
  /**
   * A picture printed onto the stock underneath the content, the way the festival
   * sketch sits behind the home page hero. It is multiplied onto the paper like ink,
   * so the fibre and stock colour show through. Rectangular sheets only.
   */
  imageSrc?: string;
  /** How the picture is cropped to the sheet: `cover`, `contain`, or a CSS size such as `118% auto`. */
  imageSize?: string;
  /** Where the crop is anchored, as a CSS position. The home page hero uses `center 66%`. */
  imagePosition?: string;
  /** How strongly the picture prints, 0 to 1. */
  imageOpacity?: number;
  /** Ink contrast. 1 leaves the picture as supplied. */
  imageContrast?: number;
  children?: React.ReactNode;
};

export function PaperSheet({
  stock = 'wheat',
  height = 900,
  surround = 10,
  shape,
  imageSrc,
  imageSize = PAPER_SHEET_IMAGE_DEFAULTS.size,
  imagePosition = PAPER_SHEET_IMAGE_DEFAULTS.position,
  imageOpacity = PAPER_SHEET_IMAGE_DEFAULTS.opacity,
  imageContrast = PAPER_SHEET_IMAGE_DEFAULTS.contrast,
  children,
}: PaperSheetProps) {
  if (shape) return <ShapedPaper stock={stock} shape={shape}>{children}</ShapedPaper>;

  const sheetStyle = {
    '--paper-sheet-height': height > 0 ? `calc(${height} * var(--sheet-unit))` : 'auto',
  } as React.CSSProperties;

  const image = imageSrc ? (
    <div
      className="paper-sheet__image"
      aria-hidden="true"
      style={{
        '--paper-sheet-image': `url("${imageSrc.replace(/"/g, '%22')}")`,
        '--paper-sheet-image-size': imageSize,
        '--paper-sheet-image-position': imagePosition,
        '--paper-sheet-image-opacity': imageOpacity,
        '--paper-sheet-image-contrast': imageContrast,
      } as React.CSSProperties}
    />
  ) : null;

  return (
    <div
      className="paper-sheet-surround"
      style={{ '--paper-sheet-surround': `${surround}px` } as React.CSSProperties}
    >
      <Weathered
        as="section"
        className="paper-sheet torn-edge"
        data-stock={stock}
        style={sheetStyle}
        tone={stock === 'ink' ? 'light' : 'dark'}
        patina={stock !== 'ink'}
        flecks
        wear={stock !== 'ink'}
      >
        {image}
        <div className="paper-sheet__stage">{children}</div>
      </Weathered>
    </div>
  );
}
