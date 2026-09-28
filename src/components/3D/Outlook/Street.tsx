import { useId } from 'react';

/** Where things are across the street, in millimetres out from the shop's glass. */
export const STREET = { threshold: 250, kerb: 1850, road: 2000, farKerb: 9000, facade: 10600 } as const;

/**
 * The street outside a café window, in plan: what the ground is from the
 * glass to the shops across the road, `widthMm` wide and centred on the
 * window, with the glass along the bottom edge.
 *
 * Only what lies on the ground is here. A table, a car or a tree is a thing
 * with a height, and seen from up here it would need to be stood up like
 * everything else that has one; the street is sold by what is underfoot —
 * slabs, a granite kerb, the lines on the road, a zebra — which is what a
 * street is from a first-floor window, and very nearly from a stool at a
 * window counter looking down.
 */
export function Street({ widthMm = 44000 }: { widthMm?: number }) {
  const id = `street-${useId().replace(/:/g, '')}`;
  const half = widthMm / 2, depth = STREET.facade;
  const y = (out: number) => -out;
  const slabs: string[] = [];
  for (let row = 0, out = STREET.threshold; out < STREET.kerb; row++, out += 600)
    for (let x = -half - (row % 2) * 450; x < half; x += 900) slabs.push(`M${x} ${y(out)}v-600`);
  const farSlabs: string[] = [];
  for (let row = 0, out = STREET.farKerb + 150; out < depth; row++, out += 600)
    for (let x = -half - (row % 2) * 450; x < half; x += 900) farSlabs.push(`M${x} ${y(out)}v-600`);
  const courses = (from: number, to: number) => Array.from({ length: Math.ceil((to - from) / 600) }, (_, i) => `M${-half} ${y(from + i * 600)}H${half}`).join('');
  const zebra = Array.from({ length: 12 }, (_, i) => STREET.road + 150 + i * 580);
  const dashes = Array.from({ length: Math.ceil(widthMm / 9000) + 1 }, (_, i) => -half + i * 9000);
  return <svg viewBox={`${-half} ${-depth} ${widthMm} ${depth}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <defs>
      <pattern id={`${id}-asphalt`} width="400" height="400" patternUnits="userSpaceOnUse">
        <rect width="400" height="400" fill="#4d4f50" />
        <circle cx="60" cy="90" r="30" fill="#5a5c5c" /><circle cx="250" cy="40" r="22" fill="#434546" /><circle cx="320" cy="260" r="34" fill="#575959" /><circle cx="130" cy="310" r="18" fill="#3f4142" />
      </pattern>
    </defs>
    {/* The shop's own step and the pavement in front of it. */}
    <rect x={-half} y={y(STREET.threshold)} width={widthMm} height={STREET.threshold} fill="#3b3a38" />
    <rect x={-half} y={y(STREET.kerb)} width={widthMm} height={STREET.kerb - STREET.threshold} fill="#b9b4aa" />
    <path d={courses(STREET.threshold, STREET.kerb) + slabs.join('')} stroke="#8e897f" strokeWidth="14" fill="none" />
    {/* Blister paving where the zebra lands, and two tree grates. */}
    {[STREET.kerb, STREET.farKerb + 1230].map(out => <rect key={out} x={-1600} y={y(out)} width={3200} height={1080} fill="#b7875e" opacity=".85" />)}
    {[-7400, 6200].map(x => <g key={x}>
      <rect x={x - 600} y={y(STREET.kerb - 300)} width={1200} height={1200} fill="#2d2b28" />
      {Array.from({ length: 5 }, (_, i) => <rect key={i} x={x - 500 + i * 220} y={y(STREET.kerb - 380)} width={80} height={1040} fill="#4a4540" />)}
      <circle cx={x} cy={y(STREET.kerb - 900)} r={160} fill="#433b30" />
    </g>)}
    {/* Two Sheffield stands, seen from above as two short steel bars, and a gully by the kerb. */}
    {[2600, 3500].map(x => <rect key={x} x={x - 360} y={y(STREET.kerb - 450)} width={720} height={60} rx={30} fill="#7c7f80" />)}
    {/* What a pavement collects: gum, a few leaves, a dropped lid. */}
    {Array.from({ length: 70 }, (_, i) => { const x = -half + ((i * 7919) % widthMm), out = STREET.threshold + 200 + ((i * 3571) % (STREET.kerb - STREET.threshold - 300)); return i % 5 ? <circle key={i} cx={x} cy={y(out)} r={14 + (i % 3) * 6} fill="#6f6a61" opacity=".7" /> : <ellipse key={i} cx={x} cy={y(out)} rx={70} ry={38} transform={`rotate(${i * 47} ${x} ${y(out)})`} fill={i % 2 ? '#9a6a2f' : '#7c7a3a'} opacity=".8" />; })}
    <circle cx={-2300} cy={y(900)} r={45} fill="#f2efe8" stroke="#2f5b4d" strokeWidth="10" />
    {/* Granite kerb, gutter and the road. */}
    <rect x={-half} y={y(STREET.road)} width={widthMm} height={STREET.road - STREET.kerb} fill="#8c8a86" />
    <rect x={-half} y={y(STREET.farKerb)} width={widthMm} height={STREET.farKerb - STREET.road} fill={`url(#${id}-asphalt)`} />
    <rect x={-half} y={y(STREET.road + 300)} width={widthMm} height={300} fill="#3f4142" opacity=".5" />
    {/* Double yellows along this side, except across the crossing and its zig-zags. */}
    {[STREET.road + 250, STREET.road + 400].map(out => <g key={out} fill="#d8b43a">
      <rect x={-half} y={y(out + 100)} width={half - 5500} height={100} />
      <rect x={5500} y={y(out + 100)} width={half - 5500} height={100} />
    </g>)}
    {/* The zig-zags that say a crossing is coming, both kerbs. */}
    {[STREET.road + 250, STREET.farKerb - 350].map(out => [-1, 1].map(side => <path key={`${out}${side}`} fill="none" stroke="#eeeae0" strokeWidth="100" d={`M${side * 1900} ${y(out)}${Array.from({ length: 6 }, (_, i) => `L${side * (1900 + (i + 1) * 580)} ${y(out + (i % 2 ? 0 : 350))}`).join('')}`} />))}
    {/* The zebra: bands parallel to the kerb, across the road in front of the window. */}
    {zebra.map(out => out + 500 < STREET.farKerb && <rect key={out} x={-1500} y={y(out + 500)} width={3000} height={500} fill="#ecebe4" opacity=".92" />)}
    {/* The centre line, broken either side of the crossing. */}
    {dashes.map(x => Math.abs(x) > 2800 && <rect key={x} x={x} y={y((STREET.road + STREET.farKerb) / 2 + 50)} width={4000} height={100} fill="#ecebe4" opacity=".85" />)}
    {/* A painted cycle lane along this kerb, broken by the crossing. */}
    {[-1, 1].map(side => <rect key={side} x={side < 0 ? -half : 2600} y={y(STREET.road + 1500)} width={half - 2600} height={1500} fill="#9c4d3d" opacity=".55" />)}
    <path d={`M${-half} ${y(STREET.road + 1560)}H-2600 M2600 ${y(STREET.road + 1560)}H${half}`} stroke="#ecebe4" strokeWidth="100" strokeDasharray="1000 500" />
    {[-6400, 7200].map(x => <g key={x} fill="none" stroke="#ecebe4" strokeWidth="45" opacity=".9"><circle cx={x - 330} cy={y(STREET.road + 750)} r={230} /><circle cx={x + 330} cy={y(STREET.road + 750)} r={230} /><path d={`M${x - 330} ${y(STREET.road + 750)}L${x - 80} ${y(STREET.road + 1080)}H${x + 200}L${x + 330} ${y(STREET.road + 750)}M${x - 80} ${y(STREET.road + 1080)}L${x} ${y(STREET.road + 750)}H${x + 200}`} /></g>)}
    <circle cx={-4200} cy={y(STREET.road + 2200)} r={330} fill="#3a3b3b" stroke="#2a2b2b" strokeWidth="40" />
    <rect x={9800} y={y(STREET.road + 450)} width={450} height={300} fill="#2b2b2a" />
    {/* The far kerb and the pavement under the shops opposite. */}
    <rect x={-half} y={y(STREET.farKerb + 150)} width={widthMm} height={150} fill="#8c8a86" />
    <rect x={-half} y={y(depth)} width={widthMm} height={depth - STREET.farKerb - 150} fill="#b3aea4" />
    <path d={courses(STREET.farKerb + 150, depth) + farSlabs.join('')} stroke="#8e897f" strokeWidth="14" fill="none" />
    {/* Late morning: the buildings opposite throw nothing this way, but their own face is in shade at its foot. */}
    <rect x={-half} y={y(depth)} width={widthMm} height={500} fill="#1f1b17" opacity=".25" />
  </svg>;
}

type Unit = { width: number; brick: string; fascia: string; awning?: string; floors: number };
const TERRACE: Unit[] = [
  { width: 5600, brick: '#8a5a44', fascia: '#1f3a33', awning: '#2f5b4d', floors: 3 },
  { width: 4800, brick: '#b39b7a', fascia: '#6e2a24', floors: 3 },
  { width: 6200, brick: '#6d4a3a', fascia: '#27324a', awning: '#b5462f', floors: 4 },
  { width: 5000, brick: '#c2b8a3', fascia: '#3a3a36', floors: 3 },
  { width: 5800, brick: '#91604a', fascia: '#b08b2e', awning: '#e0dccd', floors: 3 },
  { width: 4600, brick: '#7a5646', fascia: '#1b2a2f', floors: 4 },
  { width: 6000, brick: '#a88468', fascia: '#4d2f47', awning: '#3c6b8f', floors: 3 },
  { width: 5200, brick: '#86634d', fascia: '#2d4a2a', floors: 3 },
];

/**
 * The shops across the road, in elevation, with the ground along the bottom
 * edge and sky above: a terrace of three- and four-storey fronts, each its own
 * brick and its own shop, the way a high street is.
 */
export function StreetFacade({ widthMm = 44000, heightMm = 16000 }: { widthMm?: number; heightMm?: number }) {
  const id = `facade-${useId().replace(/:/g, '')}`;
  const half = widthMm / 2;
  const units: (Unit & { x: number })[] = [];
  for (let x = -half, i = 0; x < half; i++) { const unit = TERRACE[i % TERRACE.length]; units.push({ ...unit, x }); x += unit.width; }
  return <svg viewBox={`${-half} ${-heightMm} ${widthMm} ${heightMm}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor="#a9c3d3" /><stop offset="1" stopColor="#e3e7e2" /></linearGradient>
      <linearGradient id={`${id}-pane`} x2="0" y2="1"><stop stopColor="#5e6e74" /><stop offset="1" stopColor="#2a3033" /></linearGradient>
    </defs>
    <rect x={-half} y={-heightMm} width={widthMm} height={heightMm} fill={`url(#${id}-sky)`} />
    {units.map(({ x, width, brick, fascia, awning, floors }) => {
      const top = 3600 + floors * 2800 - 2800 + 600;
      const upper = Array.from({ length: floors - 1 }, (_, f) => 3600 + f * 2800);
      const lights = Math.max(2, Math.round(width / 1800));
      return <g key={x}>
        <rect x={x} y={-top - 500} width={width} height={top + 500} fill={brick} />
        <rect x={x} y={-top - 500} width={width} height={260} fill="#d9d2c2" opacity=".7" />
        <rect x={x - 20} y={-top - 500} width={40} height={top + 500} fill="#1c1612" opacity=".3" />
        {upper.map(floor => Array.from({ length: lights }, (_, w) => {
          const cx = x + (w + 0.5) * width / lights;
          return <g key={`${floor}${w}`}>
            <rect x={cx - 450} y={-(floor + 700 + 1500)} width={900} height={1500} fill="#ece6d6" />
            <rect x={cx - 380} y={-(floor + 700 + 1440)} width={760} height={1380} fill={`url(#${id}-pane)`} />
            <rect x={cx - 380} y={-(floor + 700 + 780)} width={760} height={50} fill="#ece6d6" />
            <rect x={cx - 500} y={-(floor + 700)} width={1000} height={90} fill="#d9d2c2" />
          </g>;
        }))}
        {/* The shop: fascia, its window and door, and a stallriser under the glass. */}
        <rect x={x + 150} y={-3600} width={width - 300} height={600} fill={fascia} />
        <rect x={x + 250} y={-3000} width={width - 500} height={2500} fill={`url(#${id}-pane)`} />
        <rect x={x + 250} y={-3000} width={width - 500} height={2500} fill="#dfe8e6" opacity=".12" />
        <rect x={x + width - 1350} y={-2700} width={900} height={2700} fill="#1e2224" />
        <rect x={x + 250} y={-500} width={width - 1600} height={500} fill={fascia} opacity=".85" />
        {awning && <path d={`M${x + 200} ${-3050}H${x + width - 200}L${x + width - 350} ${-2350}H${x + 350}Z`} fill={awning} />}
        {awning && <path d={`M${x + 350} ${-2350}H${x + width - 350}`} stroke="#000" strokeOpacity=".25" strokeWidth="60" />}
      </g>;
    })}
  </svg>;
}
