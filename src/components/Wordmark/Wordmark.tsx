import { isValidElement, useId, type CSSProperties, type ReactNode } from 'react';
import { PaperStrip, type PaperStripProps } from '../PaperStrip/PaperStrip';
import { PrintInkFilter } from '../../foundations/Distressed/Distressed';
import './Wordmark.css';

export type WordmarkProps = Omit<PaperStripProps, 'children'> & {
  children: ReactNode;
  inkColor?: string;
  fontSize?: number;
  letterSpacing?: CSSProperties['letterSpacing'];
  outlineWidth?: number;
  shadowX?: number;
  shadowY?: number;
};

/** Printed content on one paper strip. The caller owns its words, markup, and arrangement. */
export function Wordmark({ children, inkColor = '#9275b2', fontSize = 64, letterSpacing = '.02em',
  outlineWidth = 2, shadowX = 2, shadowY = 3, className = '', style, ...paperProps }: WordmarkProps) {
  const id = useId().replace(/:/g, '');
  const svgArtwork = isValidElement(children) && children.type === 'svg';
  return <PaperStrip {...paperProps} className={`printed-wordmark ${className}`} style={{
    '--wordmark-ink': inkColor, '--wordmark-font-size': `${fontSize}px`,
    '--wordmark-letter-spacing': letterSpacing, '--wordmark-outline': `${outlineWidth}px`,
    ...style,
  } as CSSProperties}>
    <svg width="0" height="0" className="printed-wordmark__definitions" aria-hidden="true" focusable="false">
      <defs><PrintInkFilter id={`${id}-print`} /></defs>
    </svg>
    <div className="printed-wordmark__ink" style={{
      filter: `url(#${id}-print) drop-shadow(${shadowX}px ${shadowY}px 0 #121420)`,
      // Balance the visible shadow as well as the font's adjusted line metrics.
      // Explicit SVG artwork owns its baseline and surrounding space.
      translate: svgArtwork ? undefined : `0 ${-shadowY / 2}px`,
    }}>
      {children}
    </div>
  </PaperStrip>;
}
