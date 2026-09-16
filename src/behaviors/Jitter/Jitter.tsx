import { useEffect, useRef, type HTMLAttributes } from 'react';
import { attachJitter, type JitterOptions } from './motion';
import './Jitter.css';

export { JITTER_PRESETS, PRINT_CADENCE_MS } from './motion';
export type { JitterOptions } from './motion';
export type JitterProps = JitterOptions & HTMLAttributes<HTMLDivElement>;

/** Wrap any cutout, label, or interactive content. Put static layout/tilt on this wrapper or its child. */
export function Jitter({ preset, x, y, rotation, cadenceMs, activation, enabled, children, className = '', ...props }: JitterProps) {
  const trigger = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!trigger.current || !layer.current) return;
    return attachJitter(trigger.current, layer.current, { preset, x, y, rotation, cadenceMs, activation, enabled });
  }, [preset, x, y, rotation, cadenceMs, activation, enabled]);
  return <div {...props} className={`jitter ${className}`} ref={trigger}>
    <div className="jitter__motion" ref={layer}>{children}</div>
  </div>;
}
