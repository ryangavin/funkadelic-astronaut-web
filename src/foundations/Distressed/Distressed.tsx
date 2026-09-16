import type React from 'react';
import { useId } from 'react';
import { PrintInkFilter } from './PrintInkFilter';
import './Distressed.css';

export { PrintInkFilter } from './PrintInkFilter';

export type DistressedProps = {
  children: React.ReactNode;
  /** Turn the texture off without changing the tree, e.g. for very small marks. */
  enabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Ink on paper. Wrap anything and it prints with the site's worn letterpress
 * finish: edges roughened, solid fills flecked where the ink didn't take.
 * Works on text, images, SVG and whole blocks. For artwork inside an SVG use
 * `PrintInkFilter` in its defs and `filter="url(#id)"` on the group instead.
 */
export function Distressed({ children, enabled = true, className = '', style }: DistressedProps) {
  const id = `distressed-${useId().replace(/:/g, '')}`;
  return (
    <div
      className={`distressed ${className}`}
      style={enabled ? { ...style, filter: `url(#${id})` } : style}
    >
      {enabled ? (
        <svg className="distressed__definitions" width="0" height="0" aria-hidden="true" focusable="false">
          <defs>
            <PrintInkFilter id={id} />
          </defs>
        </svg>
      ) : null}
      {children}
    </div>
  );
}
