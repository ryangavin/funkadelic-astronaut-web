import './MeterStick.css';

/** Artwork coordinates are millimetres; the measuring edges are exactly 1 m apart. */
export const METER_STICK_MM = { length: 1000, width: 40, height: 6 } as const;
export const METER_STICK_OUTLINE = 'M0 0H100V100H0Z';
const metricTicks = Array.from({ length: 1001 }, (_, mm) =>
  `M${mm} 0v${mm % 10 === 0 ? 10 : mm % 5 === 0 ? 8 : 4}`).join('');
const inchTicks = Array.from({ length: Math.floor(1000 / 25.4 * 8) + 1 }, (_, eighth) =>
  `M${eighth * 25.4 / 8} 40v-${eighth % 8 === 0 ? 8 : eighth % 4 === 0 ? 7 : 4}`).join('');

export type MeterStickProps = {
  /** Secondary eighth-inch graduations; metric markings always remain visible. */
  inches?: boolean;
};

/** A responsive drawing. In a scene set its width to mmToUnits(METER_STICK_MM.length). */
export function MeterStick({ inches = true }: MeterStickProps) {
  return <svg className="meter-stick" viewBox="0 0 1000 40" role="img" aria-label={`One meter stick, 100 centimeters${inches ? ', 39.37 inches' : ''}`}>
    <rect width="1000" height="40" fill="#d9b776" />
    <path d="M0 17Q210 14 450 18T1000 16M0 25Q320 22 520 26T1000 23M0 37Q230 35 550 37T1000 36" stroke="#986b36" opacity=".23" fill="none" />
    <path d={metricTicks} className="meter-stick__ticks" />
    <g className="meter-stick__numbers">
      {Array.from({ length: 101 }, (_, cm) => <text key={cm} x={cm * 10} y="17" textAnchor={cm === 0 ? 'start' : cm === 100 ? 'end' : 'middle'}>{cm}</text>)}
    </g>
    {inches && <>
      <path d={inchTicks} className="meter-stick__ticks meter-stick__inches" />
      <g className="meter-stick__numbers meter-stick__inches">
        {Array.from({ length: 40 }, (_, inch) => <text key={inch} x={inch * 25.4} y="30" textAnchor={inch === 0 ? 'start' : 'middle'}>{inch}</text>)}
      </g>
    </>}
    <text className="meter-stick__brand" x="500" y={inches ? 23 : 30} textAnchor="middle">FUNK ASTRONAUT · FIELD STANDARD · 1 m / 100 cm</text>
    <text className="meter-stick__unit" x="990" y="23" textAnchor="end">{inches ? 'in' : 'cm'}</text>
  </svg>;
}
