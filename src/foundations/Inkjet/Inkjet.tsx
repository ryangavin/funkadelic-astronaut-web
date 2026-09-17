import type React from 'react';
import { useId } from 'react';
import { InkjetFilter, type InkjetFilterProps } from './InkjetFilter';
import './Inkjet.css';

export { InkjetFilter } from './InkjetFilter';

export type InkjetProps = Omit<InkjetFilterProps, 'id'> & {
  children?: React.ReactNode;
  /** Send it to the printer, or leave it as the file it was. */
  enabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Something run off on the office inkjet. Whatever it wraps is the file that
 * was sent; what comes back is ink on plain copy paper. The white of a print
 * is the paper and not a fifth ink, so the sheet is multiplied onto whatever
 * it is laid on and is never lighter than the stock it was printed on: put it
 * on a weathered page and the grain and the fibre show through the map.
 * For artwork already inside an SVG, put `InkjetFilter` in its defs and
 * `filter="url(#id)"` on the group instead.
 */
export function Inkjet({ children, enabled = true, className = '', style, ...press }: InkjetProps) {
  const id = `inkjet-${useId().replace(/:/g, '')}`;
  return (
    <div className={`inkjet ${className}`} data-printed={enabled ? '' : undefined} style={enabled ? { ...style, filter: `url(#${id})` } : style}>
      {enabled ? (
        <svg className="inkjet__definitions" width="0" height="0" aria-hidden="true" focusable="false">
          <defs>
            <InkjetFilter id={id} {...press} />
          </defs>
        </svg>
      ) : null}
      {children}
    </div>
  );
}
