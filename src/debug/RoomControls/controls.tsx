import { useLayoutEffect, useReducer, useRef, type ReactNode } from 'react';
import { ROOM_DESK_SHARE } from '../../foundations/Room/DeskRoom';
import { DEFAULT_HEAD_TILT_DEGREES, referenceFieldOfView } from '../../geometry/roomSetup';
import { DEFAULT_LIGHT_TUNING, type LightTuning } from '../../geometry/lightingSetup';
import './controls.css';
import type { RoomProps } from '../../foundations/Room/Room';

export type RoomStoryControls = Partial<LightTuning>;
const numeric = (category: string, description: string, step = 1) => ({ control: { type: 'number' as const, step }, table: { category }, description });
/** Storybook's own slider; the panel is the only control surface, so bounds live here. */
const ranged = (category: string, description: string, min: number, max: number, step = 1) => ({ control: { type: 'range' as const, min, max, step }, table: { category }, description });
export const physicalControls = {
  windowHeightMm: ranged('Window', 'Opening height in millimetres.', 300, 1800, 25),
  windowSillHeightMm: ranged('Window', 'Bottom of the opening above the floor in millimetres.', 0, 2200, 25),
  deskWidthMm: ranged('Physical desk', 'Width in millimetres. Changes the surface, not object measurements.', 300, 3000, 25),
  deskDepthMm: ranged('Physical desk', 'Front-to-back desktop depth in millimetres, distinct from camera distance.', 200, 1800, 25),
  deskHeightMm: ranged('Physical desk', 'Tabletop height above the floor in millimetres.', 100, 1600, 25),
  deskEdgeMm: numeric('Physical desk', 'Drawn front edge thickness in millimetres; zero hides it.'),
  eyeHeightMm: ranged('Physical camera', 'Eye height above the floor; must exceed tabletop height. Far above human height is legitimate.', 600, 12000, 25),
  viewerSetbackMm: ranged('Physical camera', 'Horizontal eye distance from the wall; independent of desk dimensions.', 0, 12000, 25),
  headTiltDegrees: ranged('Physical camera', 'Absolute downward angle from horizontal: greater than 0 and less than 180 degrees; 90 looks straight down.', 1, 179, 1),
  horizontalFieldOfViewDegrees: ranged('Physical camera', 'Horizontal lens angle, strictly between 0 and 180 degrees. Wider shows more without moving the eye or gaze; unset preserves reference framing.', 20, 110, 1),
  lampIntensity: ranged('Lighting', 'Relative emitted pool brightness: zero emits no light, one preserves the original.', 0, 6, 0.1),
  showPerformance: { control: 'boolean' as const, table: { category: 'Debug' }, description: 'Screen-aligned animation-frame timing overlay.' },
  showCamera: { control: 'boolean' as const, table: { category: 'Debug' }, description: 'A line under the frame saying where the derived camera ended up.' },
  roomSpanMm: numeric('Room extent', 'Exact width of floor and wall in millimetres. Leave unset for automatic frame coverage.'),
  floorFrontMm: numeric('Room extent', 'Exact floor extension in millimetres. Leave unset for automatic frame coverage.'),
  wallHeightMm: numeric('Room extent', 'Exact wall height in millimetres. Leave unset for automatic frame coverage.'),
  poolSpread: ranged('Light shaping', 'Desk pool diameter as a multiple of bulb height.', 0, 6, 0.1),
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
  windowHeightMm: 1000, windowSillHeightMm: 1000, showCamera: true, deskWidthMm: 1200, deskDepthMm: 800, deskHeightMm: 750, deskEdgeMm: 10,
  eyeHeightMm: 1650, viewerSetbackMm: 650, headTiltDegrees: DEFAULT_HEAD_TILT_DEGREES, lampIntensity: 1,
  ...DEFAULT_LIGHT_TUNING,
};
export function withLightTuning<T extends RoomProps & RoomStoryControls>(args: T) {
  const { poolSpread, floorPoolSpread, poolFalloff, shadowReach, shadowScaleLimit, shadowAttenuation, floorShadowLimit, floorShadowTemper, ...rest } = args;
  const tuning = { ...DEFAULT_LIGHT_TUNING, ...rest.lightTuning };
  for (const [key, value] of Object.entries({ poolSpread, floorPoolSpread, poolFalloff, shadowReach, shadowScaleLimit, shadowAttenuation, floorShadowLimit, floorShadowTemper }))
    if (value !== undefined) tuning[key as keyof LightTuning] = value;
  return { ...rest, lightTuning: tuning };
}

/** The four the eye is dialled in with; everything else stays in Storybook's panel. */
export const CAMERA_FIELDS = [
  { key: 'eyeHeightMm', label: 'Eye height', min: 600, max: 12000, step: 25, unit: 'mm' },
  { key: 'viewerSetbackMm', label: 'Wall distance', min: 0, max: 12000, step: 25, unit: 'mm' },
  { key: 'headTiltDegrees', label: 'Head tilt', min: 1, max: 179, step: 1, unit: '°' },
  { key: 'horizontalFieldOfViewDegrees', label: 'Field of view', min: 20, max: 110, step: 1, unit: '°' },
] as const;

type RoomArgs = RoomProps & RoomStoryControls;
/** Play functions have no native way to set args, so the scene publishes one. */
export type RoomSeam = { args: RoomArgs; set: (next: Partial<RoomArgs>) => void; live: (next: Partial<RoomArgs>) => void };
type SeamHost = HTMLDivElement & { __roomSeam?: RoomSeam };

/** Read the seam a rendered room experiment published for its play function. */
export function roomSeam(canvasElement: HTMLElement): RoomSeam {
  const host = canvasElement.querySelector<SeamHost>('.room-scene');
  if (!host?.__roomSeam) throw new Error('No room scene is rendered; RoomExperiment publishes the seam.');
  return host.__roomSeam;
}

const reading = (unit: 'mm' | '°', value: number) => unit === 'mm' ? `${value.toFixed(0)} mm · ${(value / 25.4).toFixed(1)} in` : `${value.toFixed(0)}${unit}`;

/** Camera sliders sit in the preview so a drag redraws without the manager round trip. */
function CameraStrip({ seam }: { seam: RoomSeam }) {
  const value = (key: (typeof CAMERA_FIELDS)[number]['key']) => {
    const given = seam.args[key];
    if (Number.isFinite(given)) return given as number;
    return key === 'horizontalFieldOfViewDegrees' ? referenceFieldOfView(seam.args.deskShare ?? ROOM_DESK_SHARE) : physicalDefaults[key];
  };
  return <aside className="camera-strip" aria-label="Physical camera">
    {CAMERA_FIELDS.map(({ key, label, min, max, step, unit }) => {
      const current = value(key);
      return <fieldset key={key} className="camera-strip__field">
        <legend>{label}</legend>
        <input
          aria-label={label}
          type="range"
          min={min} max={max} step={step}
          value={Math.min(max, Math.max(min, current))}
          // Dragging stays in the preview; releasing writes the value back to the story args.
          onChange={event => seam.live({ [key]: Number(event.target.value) })}
          onPointerUp={event => seam.set({ [key]: Number(event.currentTarget.value) })}
          onKeyUp={event => seam.set({ [key]: Number(event.currentTarget.value) })}
          onBlur={event => seam.set({ [key]: Number(event.currentTarget.value) })}
        />
        <output aria-label={`${label} value`}>{reading(unit, current)}</output>
      </fieldset>;
    })}
  </aside>;
}

/**
 * Sizing context for the scene. Sizing stays on the frame and containment on the scene
 * inside it: one element doing both feeds its own ResizeObserver.
 */
export function RoomScene({ seam, children }: { seam: RoomSeam; children: ReactNode }) {
  const frame = useRef<HTMLDivElement>(null);
  // The frame claims the viewport below wherever the story places it.
  useLayoutEffect(() => {
    const element = frame.current!;
    const measure = () => {
      let bottomPadding = 0;
      for (let parent = element.parentElement; parent; parent = parent.parentElement)
        bottomPadding += parseFloat(getComputedStyle(parent).paddingBottom) || 0;
      element.style.setProperty('--controls-top', `${element.getBoundingClientRect().top + window.scrollY + bottomPadding}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element.parentElement!);
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, []);
  return <div className="room-frame" ref={frame}>
    <div
      className="room-scene"
      role="region"
      aria-label="Room preview"
      tabIndex={0}
      ref={(node: SeamHost | null) => { if (node) node.__roomSeam = seam; }}
    >{children}</div>
    <CameraStrip seam={seam} />
  </div>;
}

/** Story renders supply Storybook's updateArgs so edits remain saveable and resettable. */
export function RoomExperiment<T extends RoomProps & RoomStoryControls>({ args, update, children }: { args: T; update: (args: Partial<T>) => void; children: (args: T) => ReactNode }) {
  // Panel edits arrive as new args and render the scene once; nothing is buffered on that path.
  // Local edits also stick, because the test runner has no manager channel to echo args back.
  const local = useRef<Partial<T>>({});
  const [, rerender] = useReducer((tick: number) => tick + 1, 0);
  const current = Object.keys(local.current).length ? { ...args, ...local.current } : args;
  const live = (next: Partial<RoomArgs>) => {
    local.current = { ...local.current, ...next as Partial<T> };
    rerender();
  };
  const set = (next: Partial<RoomArgs>) => { live(next); update(next as Partial<T>); };
  return <RoomScene seam={{ args: current, set, live }}>{children(current)}</RoomScene>;
}
