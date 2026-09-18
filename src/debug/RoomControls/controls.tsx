import { useEffect, useState, type ReactNode } from 'react';
import { DEFAULT_LIGHT_TUNING, type LightTuning } from '../../geometry/lightingSetup';
import type { RoomProps } from '../../foundations/Room/Room';

export type RoomStoryControls = Partial<LightTuning>;
const numeric = (category: string, description: string, step = 1) => ({ control: { type: 'number' as const, step }, table: { category }, description });
export const physicalControls = {
  cameraMode: { control: 'inline-radio' as const, options: ['legacy', 'physical'], description: 'Legacy uses angle/depth; physical uses eye height and setback.' },
  deskWidthMm: numeric('Physical desk', 'Width in millimetres. Changes the surface, not object measurements.'),
  deskDepthMm: numeric('Physical desk', 'Front-to-back desktop depth in millimetres, distinct from camera distance.'),
  deskHeightMm: numeric('Physical desk', 'Tabletop height above the floor in millimetres.'),
  deskEdgeMm: numeric('Physical desk', 'Drawn front edge thickness in millimetres; zero hides it.'),
  eyeHeightMm: numeric('Physical camera', 'Eye height above the floor; must exceed tabletop height.'),
  viewerSetbackMm: numeric('Physical camera', 'Horizontal distance back from the desk front edge. Zero is overhead.'),
  lampIntensity: numeric('Lighting', 'Relative emitted pool brightness: zero emits no light, one preserves the original.', 0.1),
  roomSpanMm: numeric('Room extent', 'Exact width of floor and wall in millimetres. Leave unset for automatic frame coverage.'),
  floorFrontMm: numeric('Room extent', 'Exact floor extension in millimetres. Leave unset for automatic frame coverage.'),
  wallHeightMm: numeric('Room extent', 'Exact wall height in millimetres. Leave unset for automatic frame coverage.'),
  poolSpread: numeric('Light shaping', 'Desk pool diameter as a multiple of bulb height.', 0.1),
  floorPoolSpread: numeric('Light shaping', 'Floor pool radius as a multiple of bulb-to-floor height.', 0.1),
  poolFalloff: numeric('Light shaping', 'Lamp shadow mask radius as a multiple of bulb height.', 0.1),
  shadowReach: numeric('Light shaping', 'Artistic lamp shadow reach limit in desk units (1.2 units/mm).'),
  shadowScaleLimit: numeric('Light shaping', 'Artistic silhouette/radius scale cap, at least one.', 0.1),
  shadowAttenuation: numeric('Light shaping', 'Distance in desk units at which object shadow opacity halves.'),
  floorShadowLimit: numeric('Light shaping', 'Artistic cap on tabletop-to-bulb height ratio.', 0.1),
  floorShadowTemper: numeric('Light shaping', 'Multiplier for the floor shadow throw; not a physical correction.', 0.01),
  lightTuning: { table: { disable: true } },
};
export const physicalDefaults = {
  cameraMode: 'legacy' as const, deskWidthMm: 1200, deskDepthMm: 800, deskHeightMm: 750, deskEdgeMm: 10,
  eyeHeightMm: 1650, viewerSetbackMm: 650, lampIntensity: 1,
  ...DEFAULT_LIGHT_TUNING,
};
export function withLightTuning<T extends RoomProps & RoomStoryControls>(args: T) {
  const { poolSpread, floorPoolSpread, poolFalloff, shadowReach, shadowScaleLimit, shadowAttenuation, floorShadowLimit, floorShadowTemper, ...rest } = args;
  const tuning = { ...DEFAULT_LIGHT_TUNING, ...rest.lightTuning };
  for (const [key, value] of Object.entries({ poolSpread, floorPoolSpread, poolFalloff, shadowReach, shadowScaleLimit, shadowAttenuation, floorShadowLimit, floorShadowTemper }))
    if (value !== undefined) tuning[key as keyof LightTuning] = value;
  return { ...rest, lightTuning: tuning };
}

/** The experiment keeps its most useful numeric controls beside the scene. */
export function RoomControlPanel({ args, update, children }: { args: RoomProps & RoomStoryControls; update: (args: Partial<RoomProps & RoomStoryControls>) => void; children: ReactNode }) {
  const fields = [
    ['deskWidthMm', 'Desk width (mm)', 300, 3000, 10, true],
    ['deskDepthMm', 'Desk depth (mm)', 200, 1800, 10, true],
    ['deskHeightMm', 'Desk height (mm)', 100, 1600, 10, true],
    ['eyeHeightMm', 'Eye height (mm)', 600, 2400, 10, true],
    ['viewerSetbackMm', 'Setback (mm)', 0, 3000, 10, true],
    ['lampIntensity', 'Light intensity', 0, 6, 0.1, false],
    ['poolSpread', 'Pool spread', 0, 6, 0.1, false],
  ] as const;
  return <div style={{ width: '100%' }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: 12, color: '#ead3a7', background: '#211b16', font: '13px system-ui' }}>
      {fields.map(([key, label, min, max, step, physical]) => {
        const value = args[key] ?? physicalDefaults[key];
        const valid = Number.isFinite(value);
        return <fieldset key={key} style={{ display: 'grid', gap: 6, width: 145, margin: 0, padding: 8, border: '1px solid #6d5b45' }}>
          <legend>{label}</legend>
          <input aria-label={`${label} slider`} type="range" min={min} max={max} step={step} value={valid ? Math.min(max, Math.max(min, value)) : min} onChange={event => update({ [key]: Number(event.target.value) })} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input aria-label={label} type="number" step={physical ? 1 : step} value={valid ? value : ''} onChange={event => update({ [key]: event.target.value === '' ? NaN : Number(event.target.value) })} style={{ width: 72 }} />
            {physical && <output aria-label={`${label} inches`}>{valid ? `${(value / 25.4).toFixed(2)} in` : '— in'}</output>}
          </div>
          <small style={{ color: '#c7bcae' }}>Slider {min}–{max}{physical ? ' mm' : ''}; type any value.</small>
        </fieldset>;
      })}
    </div>
    {children}
  </div>;
}

/** Inline edits are local; changing external Storybook args starts a fresh experiment. */
export function RoomExperiment<T extends RoomProps & RoomStoryControls>({ args, children }: { args: T; children: (args: T) => ReactNode }) {
  const [edits, setEdits] = useState<Partial<T>>({});
  useEffect(() => setEdits({}), [args]);
  const current = { ...args, ...edits };
  return <RoomControlPanel args={current} update={next => setEdits(previous => ({ ...previous, ...next }))}>{children(current)}</RoomControlPanel>;
}
