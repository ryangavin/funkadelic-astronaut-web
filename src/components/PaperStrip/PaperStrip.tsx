import type { CSSProperties, HTMLAttributes } from 'react';
import { PaperSheet, type PaperStock } from '../PaperSheet/PaperSheet';
import './PaperStrip.css';

export type PaperStripProps = HTMLAttributes<HTMLDivElement> & {
  stock?: PaperStock;
  /** Content padding, in CSS pixels. */
  paddingX?: number;
  paddingY?: number;
  /** Static tilt of paper and content together. */
  rotation?: number;
};

export function PaperStrip({ stock = 'pale', paddingX = 16, paddingY = 8, rotation = 0, children, className = '', style, ...props }: PaperStripProps) {
  return <div {...props} className={`paper-strip ${className}`} data-stock={stock} style={{
    '--paper-strip-padding-x': `${paddingX}px`, '--paper-strip-padding-y': `${paddingY}px`,
    rotate: `${rotation}deg`, ...style,
  } as CSSProperties}>
    <PaperSheet stock={stock} shape={{ width: 720, height: 100, fitContent: true, edge: 'scrap',
      margin: 8, tear: 11.4, detailScale: .3, fiberOpacity: .35 }}>
      <div className="paper-strip__content">{children}</div>
    </PaperSheet>
  </div>;
}
