import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import darkFlecks from '../../../assets/paper-dark-flecks.svg';
import printWear from '../../../assets/print-wear.svg';
import type { PaperStock } from './PaperSheet';
import './ShapedPaper.css';

export type PaperShape = {
  path?: string;
  width: number;
  height: number;
  margin?: number;
  /** Rectangular scraps measure their content and tear the entire surface. */
  fitContent?: boolean;
  edge?: 'silhouette' | 'scrap';
  tear?: number;
  detailScale?: number;
  fiberOpacity?: number;
};

const agingColors: Record<PaperStock, string[]> = {
  pale: ['#f6e8ca', '#f0dfbc', '#e8d3ab', '#ddc298'],
  wheat: ['#ead3a7', '#e7cda0', '#d8b985', '#c3a06b'],
  white: ['#fff7ec', '#f6e8ca', '#f0dfbc', '#ddc298'],
  ink: ['#121420', '#171922', '#1c1b25', '#24202a'],
};

/** The legacy PaperCutout material, expressed as a React-owned SVG surface. */
export function ShapedPaper({ shape, stock, children }: {
  shape: PaperShape;
  stock: PaperStock;
  children?: ReactNode;
}) {
  const id = useId().replace(/:/g, '');
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: shape.width, height: shape.height });
  const width = shape.width;
  const height = shape.fitContent ? width * Math.max(1, size.height) / Math.max(1, size.width) : shape.height;
  const { margin = 80, detailScale = 1, tear = 38, fiberOpacity = .48 } = shape;
  const path = shape.path ?? `M0 0H${width}V${height}H0Z`;
  const scrap = shape.edge === 'scrap';
  const tile = 640 * width / Math.max(1, size.width);
  const url = (name: string) => `url(#${id}-${name})`;

  useLayoutEffect(() => {
    const host = ref.current;
    if (!host) return;
    const measure = () => setSize(previous => {
      const next = { width: host.clientWidth, height: host.clientHeight };
      return previous.width === next.width && previous.height === next.height ? previous : next;
    });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="shaped-paper" data-stock={stock} style={{ aspectRatio: shape.fitContent ? undefined : `${width} / ${height}` }}>
      <svg className="shaped-paper__backing" viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
        <defs>
          <path id={`${id}-shape`} d={path} />
          <radialGradient id={`${id}-aging`} gradientUnits="userSpaceOnUse"
            cx={width * 280 / 720} cy={height * 340 / 1080} r={Math.max(width, height) * 780 / 1080}
            gradientTransform={`translate(0 ${-height * 80 / 1080}) scale(1 1.2)`}>
            {[0, .52, .8, 1].map((offset, index) => <stop key={offset} offset={offset} stopColor={agingColors[stock][index]} />)}
          </radialGradient>
          <filter id={`${id}-tear`} x="-15%" y="-15%" width="130%" height="130%">
            <feTurbulence type="fractalNoise" baseFrequency={.018 / detailScale} numOctaves="2" seed="19" result="tear" />
            <feDisplacementMap in="SourceGraphic" in2="tear" scale={tear} xChannelSelector="R" yChannelSelector="G" result="ragged" />
            <feTurbulence type="fractalNoise" baseFrequency={.28 / detailScale} numOctaves="2" seed="47" result="fibers" />
            <feDisplacementMap in="ragged" in2="fibers" scale={3 * detailScale} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <mask id={`${id}-outside`} maskUnits="userSpaceOnUse" x={-width / 4} y={-height / 4} width={width * 1.5} height={height * 1.5}>
            <rect x={-width / 4} y={-height / 4} width={width * 1.5} height={height * 1.5} fill="white" />
            <use href={`#${id}-shape`} fill="black" stroke="black" strokeWidth="3" />
          </mask>
          <pattern id={`${id}-speckles`} patternUnits="userSpaceOnUse" width={tile} height={tile}>
            <image href={darkFlecks} width={tile} height={tile} preserveAspectRatio="none" />
            <image href={printWear} width={tile} height={tile} preserveAspectRatio="none" opacity=".5" />
          </pattern>
        </defs>
        {!scrap && <use href={`#${id}-shape`} fill={url('aging')} />}
        <g mask={scrap ? undefined : url('outside')} filter={url('tear')}>
          <use href={`#${id}-shape`} fill="none" stroke="#fff8e9" strokeOpacity={fiberOpacity}
            strokeWidth={margin + 5 * detailScale} strokeDasharray="1 19 2 37 1 11 3 53 2 29 1 71" strokeDashoffset="23" strokeLinejoin="round" />
          {scrap && <use href={`#${id}-shape`} fill={url('aging')} />}
          <use href={`#${id}-shape`} fill="none" stroke={url('aging')} strokeWidth={margin} strokeLinejoin="round" />
          {scrap && <use href={`#${id}-shape`} fill={url('speckles')} stroke={url('speckles')}
            strokeWidth={margin} strokeLinejoin="round" />}
        </g>
        {!scrap && <use href={`#${id}-shape`} fill={url('speckles')} stroke={url('speckles')}
          strokeWidth={margin} strokeLinejoin="round" filter={url('tear')} />}
      </svg>
      {children}
    </div>
  );
}
