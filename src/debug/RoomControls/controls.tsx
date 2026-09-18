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
  roomSpanMm: numeric('Room extent', 'Width of floor and wall in millimetres. Increase when framing exposes an edge.'),
  floorFrontMm: numeric('Room extent', 'Floor extension in front of the desk, in millimetres.'),
  wallHeightMm: numeric('Room extent', 'Wall height in millimetres.'),
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
  roomSpanMm: 2200, floorFrontMm: 400 / 1.2, wallHeightMm: 2400, ...DEFAULT_LIGHT_TUNING,
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
    ['deskWidthMm', 'Desk width (mm)'], ['deskDepthMm', 'Desk depth (mm)'], ['deskHeightMm', 'Desk height (mm)'],
    ['eyeHeightMm', 'Eye height (mm)'], ['viewerSetbackMm', 'Setback (mm)'], ['lampIntensity', 'Light intensity'], ['poolSpread', 'Pool spread'],
  ] as const;
  return <div style={{ width: '100%' }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: 12, color: '#ead3a7', background: '#211b16', font: '13px system-ui' }}>
      {fields.map(([key, label]) => <label key={key}>{label}<input aria-label={label} type="number" step={key === 'lampIntensity' || key === 'poolSpread' ? 0.1 : 1} value={args[key] ?? physicalDefaults[key]} onChange={event => update({ [key]: event.target.value === '' ? NaN : Number(event.target.value) })} style={{ display: 'block', width: 95 }} /></label>)}
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
