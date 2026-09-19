import './MeterStick.css';

/** Artwork coordinates and physical scene dimensions are millimetres. */
export const STICK_VARIANTS = {
  meter: { length: 1000, width: 40, height: 6, label: 'Meter stick', description: 'One meter stick, 100 centimeters', brand: 'FUNK ASTRONAUT · FIELD STANDARD · 1 m / 100 cm' },
  twelveInch: { length: 304.8, width: 40, height: 6, label: 'Twelve-inch ruler', description: 'Twelve-inch ruler, 30.48 centimeters', brand: '12 in / 30.48 cm' },
  tenCentimeter: { length: 100, width: 40, height: 6, label: 'Ten-centimeter stick', description: 'Ten-centimeter stick', brand: '10 cm' },
} as const;
export type StickVariant = keyof typeof STICK_VARIANTS;
export const METER_STICK_MM = STICK_VARIANTS.meter;
export const METER_STICK_OUTLINE = 'M0 0H100V100H0Z';

export type MeterStickProps = {
  variant?: StickVariant;
  /** Secondary eighth-inch graduations; metric markings always remain visible. */
  inches?: boolean;
};

/** A responsive drawing. In a scene use mmToUnits(STICK_VARIANTS[variant].length) for its width. */
export function MeterStick({ inches = true, variant = 'meter' }: MeterStickProps) {
  const { length, width, description, brand } = STICK_VARIANTS[variant];
  const metricTicks = Array.from({ length: Math.floor(length) + 1 }, (_, mm) =>
    `M${mm} 0v${mm % 10 === 0 ? 10 : mm % 5 === 0 ? 8 : 4}`).join('');
  const inchTicks = Array.from({ length: Math.floor(length / 25.4 * 8) + 1 }, (_, eighth) =>
    `M${Number((eighth * 25.4 / 8).toFixed(4))} ${width}v-${eighth % 8 === 0 ? 8 : eighth % 4 === 0 ? 7 : 4}`).join('');
  return <svg className="meter-stick" viewBox={`0 0 ${length} ${width}`} role="img" aria-label={`${description}${inches && variant === 'meter' ? ', 39.37 inches' : ''}`}>
    <rect width={length} height={width} fill="#d9b776" />
    <path d="M0 17Q210 14 450 18T1000 16M0 25Q320 22 520 26T1000 23M0 37Q230 35 550 37T1000 36" stroke="#986b36" opacity=".23" fill="none" />
    <path d={metricTicks} className="meter-stick__ticks" />
    <g className="meter-stick__numbers">
      {Array.from({ length: Math.floor(length / 10) + 1 }, (_, cm) => <text key={cm} x={cm * 10} y="17" textAnchor={cm === 0 ? 'start' : cm * 10 === length ? 'end' : 'middle'}>{cm}</text>)}
    </g>
    {inches && <>
      <path d={inchTicks} className="meter-stick__ticks meter-stick__inches" />
      <g className="meter-stick__numbers meter-stick__inches">
        {Array.from({ length: Math.floor(length / 25.4) + 1 }, (_, inch) => <text key={inch} x={Number((inch * 25.4).toFixed(4))} y="30" textAnchor={inch === 0 ? 'start' : Math.abs(inch * 25.4 - length) < .0001 ? 'end' : 'middle'}>{inch}</text>)}
      </g>
    </>}
    <text className="meter-stick__brand" x={length / 2} y={inches ? 23 : 30} textAnchor="middle">{brand}</text>
    <text className="meter-stick__unit" x={length - 2} y="23" textAnchor="end">{inches ? 'in' : 'cm'}</text>
  </svg>;
}
