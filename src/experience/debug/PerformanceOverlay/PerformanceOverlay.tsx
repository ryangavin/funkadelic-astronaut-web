import { useEffect, useState, type CSSProperties } from 'react';
import { observeFrameTiming, type FrameTiming } from './frameTiming';
import './PerformanceOverlay.css';

export type PerformanceOverlayProps = {
  className?: string;
  style?: CSSProperties;
};

/** Browser animation-frame cadence, not CPU/GPU load or guaranteed paint rate.
 * Place inside a positioned, untransformed parent; mount only while wanted. */
export function PerformanceOverlay({ className = '', style }: PerformanceOverlayProps) {
  const [timing, setTiming] = useState<FrameTiming | null>(null);
  useEffect(() => observeFrameTiming({
    request: callback => window.requestAnimationFrame(callback),
    cancel: id => window.cancelAnimationFrame(id),
    hidden: () => document.hidden,
    onVisibility: listener => {
      document.addEventListener('visibilitychange', listener);
      return () => document.removeEventListener('visibilitychange', listener);
    },
  }, setTiming), []);
  return <div className={`performance-overlay ${className}`} style={style} role="group" aria-label="Animation frame timing" aria-live="off">
    <span className="performance-overlay__label">rAF · 2s window</span>
    <span>FPS {timing ? timing.fps.toFixed(1) : '—'}</span>
    <span>frame {timing ? timing.frameMs.toFixed(1) : '—'} ms</span>
  </div>;
}
