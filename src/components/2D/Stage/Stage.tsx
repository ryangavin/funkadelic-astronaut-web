import type React from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import './Stage.css';

/** The design width every page is laid out at, in CSS pixels. One sheet unit is one of these. */
export const STAGE_WIDTH = 1440;

export type StageProps = {
  /** The width the composition was designed at. Defaults to the site's 1440. */
  width?: number;
  /** A fixed design height, for a page that is one canvas of set proportions. Unset, the content sets it. */
  height?: number;
  /** Never shrink below this factor, so a phone shows the composition scrolling sideways instead of at a squint. */
  minScale?: number;
  /** Never grow beyond this factor. Unset, a wide monitor gets a proportionally bigger page. */
  maxScale?: number;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * A page laid out at a fixed design width and scaled as one piece to whatever
 * width it is shown at. Everything inside keeps its place and its proportions
 * to everything else; on a wider screen it is simply bigger, the way a poster
 * is when you stand closer. Pixel sizes inside mean design pixels.
 */
export function Stage({ width = STAGE_WIDTH, height, minScale = 0, maxScale = Infinity, children, className = '', style }: StageProps) {
  const host = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const element = host.current;
    if (!element) return;
    const measure = () => {
      // A hidden stage measures 0 wide; keep the last real scale.
      if (!element.clientWidth) return;
      setScale(Math.min(maxScale, Math.max(minScale, element.clientWidth / width)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [width, minScale, maxScale]);

  return (
    <div ref={host} className={`stage ${className}`} style={{ '--stage-width': `${width}px`, '--stage-height': height ? `${height}px` : 'auto', '--stage-scale': scale, ...style } as React.CSSProperties}>
      <div className="stage__sheet">{children}</div>
    </div>
  );
}
