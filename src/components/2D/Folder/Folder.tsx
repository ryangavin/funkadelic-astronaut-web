import type React from 'react';
import { Weathered } from '../../../behaviors/Weathered/Weathered';
import { Distressed } from '../../../foundations/Distressed/Distressed';
import '../../../styles/fonts.css';
import './Folder.css';

export const FOLDER_STOCKS = ['manila', 'kraft', 'green'] as const;
export type FolderStock = (typeof FOLDER_STOCKS)[number];
export const FOLDER_TABS = ['top', 'side'] as const;
export type FolderTab = (typeof FOLDER_TABS)[number];

export type FolderProps = {
  /** Label on the tab. */
  label?: React.ReactNode;
  /** Where the tab is cut: along the top edge, or down the right edge. */
  tab?: FolderTab;
  stock?: FolderStock;
  /** Whether the front cover is swung open. Toggling it animates the swing. */
  open?: boolean;
  /** Rubber stamps inside the front cover. Up to three read well. */
  stamps?: React.ReactNode[];
  /** Whether the stamps sit at the top or the bottom of the cover. */
  stampsAt?: 'top' | 'bottom';
  /** A label stuck to the outside of the front cover, seen when closed. */
  sticker?: React.ReactNode;
  /** What is kept inside the front cover, on the left when open. */
  cover?: React.ReactNode;
  /** What sits in the well of the folder, on the right when open. */
  children?: React.ReactNode;
  /** Tilt of the whole folder in degrees. */
  rotation?: number;
  className?: string;
  style?: React.CSSProperties;
};

const present = (node: React.ReactNode) => node != null && node !== '' && node !== false;

/**
 * A manila folder lying on the desk, seen from above. The back leaf carries the
 * tab and holds the well; the front cover swings open around the spine to show
 * what is kept inside it. Sized in 1440ths of its open width.
 */
export function Folder({
  label,
  tab = 'top',
  stock = 'manila',
  open = true,
  stamps = [],
  stampsAt = 'top',
  sticker,
  cover,
  children,
  rotation = 0,
  className = '',
  style,
}: FolderProps) {
  return (
    <div
      className={`folder ${className}`}
      data-stock={stock}
      data-tab={tab}
      data-stamps={stampsAt}
      data-open={open ? 'true' : 'false'}
      style={{ '--folder-rotation': `${rotation}deg`, ...style } as React.CSSProperties}
    >
      <div className="folder__body">
        <Weathered className="folder__leaf folder__back" patina={0.5} flecks={0.5}>
          {present(label) ? (
            <Weathered className="folder__tab" patina={0.5} flecks={0.5}>
              <span className="folder__label">{label}</span>
            </Weathered>
          ) : null}
        </Weathered>
        <div className="folder__well">{children}</div>
        <div className="folder__cover">
          <Weathered className="folder__face folder__face--inside" patina={0.5} flecks={0.5}>
            {stamps.slice(0, 3).map((stamp, index) => (
              <Distressed key={index} className="folder__stamp" style={{ '--folder-stamp-index': index } as React.CSSProperties}>
                <span className="folder__stamp-ink">{stamp}</span>
              </Distressed>
            ))}
            <div className="folder__pocket">{cover}</div>
          </Weathered>
          <Weathered className="folder__face folder__face--outside" patina={0.5} flecks={0.5}>
            {present(sticker) ? <span className="folder__sticker">{sticker}</span> : null}
          </Weathered>
        </div>
        <div className="folder__spine" aria-hidden="true" />
      </div>
    </div>
  );
}
