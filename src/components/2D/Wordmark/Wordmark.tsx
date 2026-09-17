import { isValidElement, useEffect, useId, useRef, type CSSProperties, type ReactNode } from 'react';
import { attachJitter, type JitterOptions } from '../../../behaviors/Jitter/motion';
import { PaperStrip, type PaperStripProps } from '../PaperStrip/PaperStrip';
import { PrintInkFilter } from '../../../foundations/Distressed/Distressed';
import { GLYPH_CLASS, printGlyphs } from './glyphs';
import './Wordmark.css';

export type WordmarkProps = Omit<PaperStripProps, 'children' | 'ref'> & {
  children: ReactNode;
  inkColor?: string;
  fontSize?: number;
  letterSpacing?: CSSProperties['letterSpacing'];
  outlineWidth?: number;
  shadowX?: number;
  shadowY?: number;
  /**
   * Print-registration jitter on every letter independently. `true` uses the `print`
   * preset; pass Jitter options to tune it. Supplied artwork moves as one print.
   */
  jitter?: boolean | JitterOptions;
};

/** Printed content on one paper strip. The caller owns its words, markup, and arrangement. */
export function Wordmark({ children, inkColor = '#9275b2', fontSize = 64, letterSpacing = '.02em',
  outlineWidth = 2, shadowX = 2, shadowY = 3, jitter = false, className = '', style, ...paperProps }: WordmarkProps) {
  const id = useId().replace(/:/g, '');
  const root = useRef<HTMLDivElement>(null);
  const ink = useRef<HTMLDivElement>(null);
  const svgArtwork = isValidElement(children) && children.type === 'svg';
  const jittering = jitter !== false;
  const motion: JitterOptions = { preset: 'print', ...(jitter === true ? {} : jitter || {}) };
  useEffect(() => {
    if (!jittering || !root.current || !ink.current) return;
    const glyphs = [...ink.current.querySelectorAll<HTMLElement>(`.${GLYPH_CLASS}`)];
    return attachJitter(root.current, glyphs, motion);
    // The letter elements follow the content; the options are compared by value.
  }, [jittering, motion.preset, motion.x, motion.y, motion.rotation, motion.cadenceMs, motion.activation, motion.enabled, children]);
  return <PaperStrip {...paperProps} ref={root} className={`printed-wordmark ${className}`} style={{
    '--wordmark-ink': inkColor, '--wordmark-font-size': `${fontSize}px`,
    '--wordmark-letter-spacing': letterSpacing, '--wordmark-outline': `${outlineWidth}px`,
    ...style,
  } as CSSProperties}>
    <svg width="0" height="0" className="printed-wordmark__definitions" aria-hidden="true" focusable="false">
      <defs><PrintInkFilter id={`${id}-print`} /></defs>
    </svg>
    <div ref={ink} className="printed-wordmark__ink" style={{
      filter: `url(#${id}-print) drop-shadow(${shadowX}px ${shadowY}px 0 #121420)`,
      // Balance the visible shadow as well as the font's adjusted line metrics.
      // Explicit SVG artwork owns its baseline and surrounding space.
      translate: svgArtwork ? undefined : `0 ${-shadowY / 2}px`,
    }}>
      {jittering ? printGlyphs(children) : children}
    </div>
  </PaperStrip>;
}
