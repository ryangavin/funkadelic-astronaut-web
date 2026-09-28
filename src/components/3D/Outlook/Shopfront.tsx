import { useId } from 'react';

/**
 * A café's shopfront glazing, in elevation: the whole opening in the wall
 * behind the counter, in millimetres from the sill.
 *
 * It is the frame and not the glass that says shopfront. Big fixed lights in
 * a slim bronze-black aluminium section, split into three bays by mullions and
 * crossed by a transom well above head height, with a row of short fanlights
 * over it. The glass itself is almost nothing: a cool cast and two long
 * diagonal glints of the room reflected in it, because what is through it has
 * to be seen.
 */
export function Shopfront({ widthMm = 3200, heightMm = 1720, bays = 3, transomMm = 1300 }: { widthMm?: number; heightMm?: number; bays?: number; transomMm?: number }) {
  const id = `shopfront-${useId().replace(/:/g, '')}`;
  const frame = 70, mullion = 56, rail = 50;
  const bay = widthMm / bays;
  const transomY = heightMm - transomMm;
  return <svg viewBox={`0 0 ${widthMm} ${heightMm}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-glass`} x2="0" y2="1"><stop stopColor="#cfe0e4" stopOpacity=".16" /><stop offset="1" stopColor="#8fa8ad" stopOpacity=".1" /></linearGradient>
      <linearGradient id={`${id}-glint`} x1="0" y1="1" x2="1" y2="0"><stop offset=".3" stopColor="#fff" stopOpacity="0" /><stop offset=".48" stopColor="#fff" stopOpacity=".2" /><stop offset=".52" stopColor="#fff" stopOpacity=".07" /><stop offset=".6" stopColor="#fff" stopOpacity="0" /></linearGradient>
      <linearGradient id={`${id}-metal`} x2="1"><stop stopColor="#1d1a17" /><stop offset=".5" stopColor="#3a342d" /><stop offset="1" stopColor="#15130f" /></linearGradient>
    </defs>
    <rect width={widthMm} height={heightMm} fill={`url(#${id}-glass)`} />
    {Array.from({ length: bays }, (_, i) => <rect key={i} x={i * bay + bay * 0.08} width={bay * 0.5} height={heightMm} fill={`url(#${id}-glint)`} />)}
    <g fill={`url(#${id}-metal)`}>
      {/* Outer frame, the sill rail under the glass, and the transom with its fanlights. */}
      <path fillRule="evenodd" d={`M0 0H${widthMm}V${heightMm}H0Z M${frame} ${frame}V${heightMm - rail}H${widthMm - frame}V${frame}Z`} />
      <rect y={transomY - mullion / 2} width={widthMm} height={mullion} />
      {Array.from({ length: bays - 1 }, (_, i) => <rect key={i} x={(i + 1) * bay - mullion / 2} width={mullion} height={heightMm} />)}
      {Array.from({ length: bays }, (_, i) => <rect key={i} x={i * bay + bay / 2 - 18} width={36} height={transomY} />)}
    </g>
    {/* The bright arris down one side of each section, where the day catches it. */}
    <g stroke="#8d8273" strokeOpacity=".5" strokeWidth="6">
      {Array.from({ length: bays + 1 }, (_, i) => { const x = Math.min(widthMm - frame, Math.max(frame, i * bay)) - (i === 0 ? frame / 2 : i === bays ? -frame / 2 : mullion / 2) + 4; return <path key={i} d={`M${x} 0V${heightMm}`} />; })}
      <path d={`M0 ${transomY - mullion / 2 + 4}H${widthMm}`} />
    </g>
  </svg>;
}
