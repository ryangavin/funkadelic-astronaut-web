import { useId } from 'react';

/**
 * A site cabin's sliding window, in elevation: a white uPVC frame, two lights
 * on a centre meeting rail, the left one slid half across and a fly screen in
 * the gap it leaves.
 */
export function CabinSlider({ widthMm = 1400, heightMm = 600 }: { widthMm?: number; heightMm?: number }) {
  const id = `slider-${useId().replace(/:/g, '')}`;
  const frame = 60, rail = 50, half = widthMm / 2;
  return <svg viewBox={`0 0 ${widthMm} ${heightMm}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-glass`} x1="0" y1="1" x2="1" y2="0"><stop offset=".2" stopColor="#dfeaf0" stopOpacity=".08" /><stop offset=".45" stopColor="#fff" stopOpacity=".28" /><stop offset=".55" stopColor="#fff" stopOpacity=".06" /></linearGradient>
      <pattern id={`${id}-mesh`} width="14" height="14" patternUnits="userSpaceOnUse"><path d="M0 0H14M0 0V14" stroke="#1d1f20" strokeOpacity=".5" strokeWidth="3" /></pattern>
    </defs>
    <rect x={frame} y={frame} width={half * 0.55} height={heightMm - frame * 2} fill={`url(#${id}-mesh)`} />
    <rect x={frame + half * 0.55} y={frame} width={widthMm - frame * 2 - half * 0.55} height={heightMm - frame * 2} fill={`url(#${id}-glass)`} />
    <g fill="#e9e8e2" stroke="#b7b5ab" strokeWidth="6">
      <path fillRule="evenodd" d={`M0 0H${widthMm}V${heightMm}H0Z M${frame} ${frame}V${heightMm - frame}H${widthMm - frame}V${frame}Z`} />
      <rect x={half * 0.55} y={frame} width={rail} height={heightMm - frame * 2} />
      <rect x={half + half * 0.55 - rail} y={frame} width={rail} height={heightMm - frame * 2} />
      <rect x={half - rail / 2 + 40} y={frame} width={rail} height={heightMm - frame * 2} />
    </g>
    <rect x={half + 20} y={heightMm / 2 - 50} width={24} height={100} rx={8} fill="#8b8a84" />
  </svg>;
}

/** How far it is from the cabin wall to the marquee opposite, in millimetres. */
export const BACKSTAGE_DEPTH = 6500;

/**
 * Backstage at a festival, in plan: the ground behind the cabin out to the
 * marquee. Worn grass, a run of aluminium trackway for the forklifts, a yellow
 * cable ramp across it, and the pegs and guys of the marquee opposite.
 */
export function Backstage({ widthMm = 30000 }: { widthMm?: number }) {
  const id = `backstage-${useId().replace(/:/g, '')}`;
  const half = widthMm / 2, depth = BACKSTAGE_DEPTH;
  const track = { from: 1400, to: 4400 };
  const tufts = Array.from({ length: 260 }, (_, i) => ({ x: -half + (i * 7919) % widthMm, y: -((i * 104729) % depth), r: 60 + (i % 5) * 30, dark: i % 3 === 0 }));
  return <svg viewBox={`${-half} ${-depth} ${widthMm} ${depth}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <defs>
      <pattern id={`${id}-track`} width="300" height="300" patternUnits="userSpaceOnUse">
        <rect width="300" height="300" fill="#9ea2a0" />
        <path d="M0 0H300M0 150H300M0 0V300M150 0V300" stroke="#7f8381" strokeWidth="18" />
        <circle cx="75" cy="75" r="16" fill="#6d706e" /><circle cx="225" cy="225" r="16" fill="#6d706e" />
      </pattern>
    </defs>
    <rect x={-half} y={-depth} width={widthMm} height={depth} fill="#6f7d4c" />
    {tufts.map((t, i) => <circle key={i} cx={t.x} cy={t.y} r={t.r} fill={t.dark ? '#58663b' : '#8a8f5c'} opacity=".7" />)}
    {/* Mud where the cabin's own door and steps have worn the grass off. */}
    <ellipse cx={-2600} cy={-500} rx={1600} ry={700} fill="#6b5a45" opacity=".75" />
    <rect x={-half} y={-track.to} width={widthMm} height={track.to - track.from} fill={`url(#${id}-track)`} />
    {Array.from({ length: Math.ceil(widthMm / 2500) }, (_, i) => <path key={i} d={`M${-half + i * 2500} ${-track.to}V${-track.from}`} stroke="#5d605e" strokeWidth="30" />)}
    <path d={`M${-half} ${-track.to}H${half}M${-half} ${-track.from}H${half}`} stroke="#4a4d4b" strokeWidth="40" />
    {/* A five-channel cable ramp laid across the trackway, and the feeds running into it. */}
    <g transform="translate(1200 0)">
      <rect x={-450} y={-track.to - 300} width={900} height={track.to - track.from + 600} fill="#d9b227" />
      {Array.from({ length: Math.ceil((track.to - track.from + 600) / 900) }, (_, i) => <rect key={i} x={-450} y={-track.to - 300 + i * 900} width={900} height={60} fill="#1c1c1b" />)}
      <rect x={-120} y={-track.to - 300} width={240} height={track.to - track.from + 600} fill="#bf9a1c" />
      <path d={`M-60 ${-track.from + 300}C-60 -600 -700 -400 -900 0M60 ${-track.from + 300}C60 -700 400 -500 700 0M-60 ${-track.to - 300}C-60 ${-track.to - 900} -900 ${-depth + 500} -1300 ${-depth}M60 ${-track.to - 300}C60 ${-track.to - 800} 800 ${-depth + 400} 1100 ${-depth}`} fill="none" stroke="#1d1d1d" strokeWidth="45" />
      <path d={`M0 ${-track.from + 300}C0 -500 200 -300 150 0`} fill="none" stroke="#c8461f" strokeWidth="55" />
    </g>
    {/* A pallet left by the cabin, and a fire point. */}
    <g transform="translate(-6200 -900) rotate(6)"><rect width="1200" height="1000" fill="#b49468" />{[0, 1, 2, 3, 4, 5].map(i => <rect key={i} x={i * 205} width="150" height="1000" fill="#c9a877" />)}</g>
    <rect x={4600} y={-1000} width={500} height={420} fill="#b8201a" /><rect x={4640} y={-960} width={420} height={340} fill="#d33026" />
    {/* The marquee's pegs and guys along its foot. */}
    {Array.from({ length: Math.ceil(widthMm / 1500) }, (_, i) => { const x = -half + 700 + i * 1500; return <g key={i}><path d={`M${x} ${-depth}L${x - 150} ${-depth + 900}`} stroke="#ece6d2" strokeWidth="18" /><circle cx={x - 150} cy={-depth + 900} r={40} fill="#6b6d6c" /></g>; })}
  </svg>;
}

/**
 * The side of a festival marquee, in elevation, across the trackway: white
 * PVC walling in bays between aluminium legs, a ridge of roof above it, and
 * sky.
 */
export function MarqueeSide({ widthMm = 30000, heightMm = 9000 }: { widthMm?: number; heightMm?: number }) {
  const id = `marquee-${useId().replace(/:/g, '')}`;
  const half = widthMm / 2, eave = 3200, bay = 5000;
  return <svg viewBox={`${-half} ${-heightMm} ${widthMm} ${heightMm}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor="#9ab8cc" /><stop offset="1" stopColor="#dfe6e3" /></linearGradient>
      <linearGradient id={`${id}-pvc`} x2="0" y2="1"><stop stopColor="#f3f1ea" /><stop offset="1" stopColor="#c9c7bd" /></linearGradient>
    </defs>
    <rect x={-half} y={-heightMm} width={widthMm} height={heightMm} fill={`url(#${id}-sky)`} />
    <path d={`M${-half} ${-eave}L${-half + 200} ${-eave - 2600}H${half - 200}L${half} ${-eave}Z`} fill="#e6e3d9" />
    <rect x={-half} y={-eave} width={widthMm} height={eave} fill={`url(#${id}-pvc)`} />
    {Array.from({ length: Math.ceil(widthMm / bay) + 1 }, (_, i) => { const x = -half + i * bay; return <g key={i}>
      <rect x={x - 60} y={-eave - 100} width={120} height={eave + 100} fill="#b9bcbd" />
      {Array.from({ length: 4 }, (_, k) => <path key={k} d={`M${x + 200 + k * 1200} ${-eave + 200}V-50`} stroke="#b8b5aa" strokeWidth="20" opacity=".6" />)}
    </g>; })}
    <rect x={-half} y={-eave - 60} width={widthMm} height={120} fill="#a7aaab" />
  </svg>;
}
