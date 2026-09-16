import type React from 'react';
import { Distressed } from '../../foundations/Distressed/Distressed';
import '../../styles/fonts.css';
import './Folder.css';

export const FOLDER_STOCKS = ['manila', 'kraft', 'green'] as const;
export type FolderStock = (typeof FOLDER_STOCKS)[number];

export type FolderProps = {
  /** Typed label on the tab. */
  label?: React.ReactNode;
  stock?: FolderStock;
  /** Whether the front cover is swung open. Toggling it animates the swing. */
  open?: boolean;
  /** Rubber stamps inside the front cover. Up to three read well. */
  stamps?: React.ReactNode[];
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
  stock = 'manila',
  open = true,
  stamps = [],
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
      data-open={open ? 'true' : 'false'}
      style={{ '--folder-rotation': `${rotation}deg`, ...style } as React.CSSProperties}
    >
      <div className="folder__body">
        <div className="folder__leaf folder__back">
          {present(label) ? (
            <div className="folder__tab">
              <span className="folder__label">{label}</span>
            </div>
          ) : null}
          <div className="folder__well">{children}</div>
        </div>
        <div className="folder__cover">
          <div className="folder__face folder__face--inside">
            {stamps.slice(0, 3).map((stamp, index) => (
              <Distressed key={index} className="folder__stamp" style={{ '--folder-stamp-index': index } as React.CSSProperties}>
                <span className="folder__stamp-ink">{stamp}</span>
              </Distressed>
            ))}
            <div className="folder__pocket">{cover}</div>
          </div>
          <div className="folder__face folder__face--outside">
            {present(sticker) ? <span className="folder__sticker">{sticker}</span> : null}
          </div>
        </div>
        <div className="folder__spine" aria-hidden="true" />
      </div>
    </div>
  );
}
