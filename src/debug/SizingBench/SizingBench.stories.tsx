import { useArgs } from 'storybook/preview-api';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { physicalControls, physicalDefaults, withLightTuning, RoomExperiment, roomSeam, type RoomStoryControls } from '../RoomControls/controls';
import { MVP_INITIAL_PLACEMENTS, MVP_CONTENT_PLACEMENTS } from './roster';
import { Desk } from '../../pages/Desk/PerspectiveDesk.stories';
import { DESK_WOODS } from '../../components/3D/Desk/Desk';
import { OBJECT_IDS, PAPER_IDS, SizingBench, type SizingBenchProps } from './SizingBench';

/* The shipped desk's camera and lamp, so what is judged here is what ships. */
const { objectPlacements: composed, showObjects, ...shipped } = Desk.args!;
void showObjects;

const meta = {
  title: 'Debug/Sizing Bench',
  component: SizingBench,
  parameters: { layout: 'fullscreen' },
  /* Only what sizing is decided with. The lighting, window and room-extent knobs stay on the room benches. */
  argTypes: {
    stage: { control: 'inline-radio', options: ['papers', 'everything', 'one', 'mvp', 'contents'], table: { category: 'Sizing' }, description: 'The sheets alone, everything at life size, or one thing.' },
    capture: { control: 'boolean', table: { category: 'Sizing' } },
    focus: { control: 'select', options: OBJECT_IDS, table: { category: 'Sizing' }, description: 'The one thing on the desk when the stage is one.' },
    ruler: { control: 'inline-radio', options: ['twelveInch', 'meter', 'tenCentimeter', 'none'], table: { category: 'Sizing' } },
    paperTargetPx: { control: { type: 'number', step: 10 }, table: { category: 'Sizing' }, description: 'How wide the front sheet should come out on this screen.' },
    readout: { control: 'boolean', table: { category: 'Sizing' } },
    objectPlacements: { control: 'object', table: { category: 'Sizing' } },
    deskWidthMm: physicalControls.deskWidthMm,
    deskDepthMm: physicalControls.deskDepthMm,
    deskHeightMm: physicalControls.deskHeightMm,
    deskShare: { table: { category: 'Framing' }, control: { type: 'range', min: 0.3, max: 1, step: 0.01 }, description: 'How much of the frame the reference desk takes.' },
    roomLip: { table: { category: 'Framing' }, control: { type: 'number', step: 5 } },
    eyeHeightMm: physicalControls.eyeHeightMm,
    viewerSetbackMm: physicalControls.viewerSetbackMm,
    headTiltDegrees: physicalControls.headTiltDegrees,
    horizontalFieldOfViewDegrees: physicalControls.horizontalFieldOfViewDegrees,
    wood: { table: { category: 'Desktop' }, control: 'inline-radio', options: DESK_WOODS },
    ...Object.fromEntries(['windowHeightMm', 'windowSillHeightMm', 'deskEdgeMm', 'lampIntensity', 'showPerformance', 'roomSpanMm', 'floorFrontMm', 'wallHeightMm', 'poolSpread', 'floorPoolSpread', 'poolFalloff', 'shadowReach', 'shadowScaleLimit', 'shadowAttenuation', 'floorShadowLimit', 'floorShadowTemper', 'lightTuning', 'showCamera',
      'room', 'floor', 'wall', 'roomBlur', 'roomDim', 'lamp', 'shadowStrength', 'lampX', 'lampY', 'lampRotation', 'lampWidth', 'lampEnamel', 'lampLowerAngle', 'lampUpperAngle', 'showObjects',
      'onArrange', 'onArticulate', 'onLamp', 'onCaptureSettings', 'children'].map(key => [key, { table: { disable: true } }])),
  },
  args: { ...physicalDefaults, ...shipped, stage: 'papers', focus: 'mug', ruler: 'twelveInch', paperTargetPx: 260, readout: true },
  render: function Experiment(args) {
    const [currentArgs, updateArgs] = useArgs<typeof args>();
    return <RoomExperiment args={currentArgs} update={updateArgs}>{values => <SizingBench {...withLightTuning(values)} onCaptureSettings={settings => updateArgs(settings)} />}</RoomExperiment>;
  },
} satisfies Meta<SizingBenchProps & RoomStoryControls>;
export default meta;
type Story = StoryObj<typeof meta>;

const rows = (canvasElement: HTMLElement) => [...canvasElement.querySelectorAll<HTMLElement>('.sizing-bench__table tbody tr')];

/** Step one: the four sheets alone. Move the camera until the front sheet meets its target; nothing else is on the desk to argue with. */
export const PapersFirst: Story = {
  play: async ({ canvasElement }) => {
    if (import.meta.env.MODE !== 'test') return;
    const canvas = within(canvasElement);
    const desk = canvasElement.querySelector<HTMLElement>('.desk')!;
    const ruler = canvas.getByRole('group', { name: 'Twelve-inch ruler' });
    await expect(parseFloat(getComputedStyle(ruler).width) / parseFloat(getComputedStyle(desk).width)).toBeCloseTo(304.8 / 1200, 3);
    for (const id of PAPER_IDS) await expect(canvasElement.querySelector(`[data-object="${id}"]`)).not.toBeNull();
    await waitFor(() => expect(rows(canvasElement)).toHaveLength(PAPER_IDS.length));
    for (const row of rows(canvasElement)) await expect(row).toHaveTextContent(/220 mm.*1\.00×.*\d+ px/);
    await expect(canvas.queryByRole('group', { name: 'Mug' })).toBeNull();
    await waitFor(() => expect(parseFloat(canvas.getByLabelText('Front sheet width on screen').textContent!)).toBeGreaterThan(0));
    await expect(canvas.getByLabelText('Paper target')).toHaveTextContent('260 px');
    // The eye is what the strip moves; the desk's size is a panel control, and it is what changes the ruler's share of the desk.
    await expect(canvas.getByRole('complementary', { name: 'Physical camera' })).toBeInTheDocument();
    await expect(canvas.getByRole('slider', { name: 'Desk height' })).toHaveValue('750');
    roomSeam(canvasElement).set({ deskWidthMm: 1800 });
    await waitFor(() => expect(canvas.getByLabelText('Desk width value')).toHaveTextContent('1800 mm'));
    await waitFor(() => expect(parseFloat(getComputedStyle(ruler).width) / parseFloat(getComputedStyle(desk).width)).toBeCloseTo(304.8 / 1800, 3));
    // Pixels per millimetre follow the desk that is actually there.
    await waitFor(() => expect(parseFloat(canvas.getByLabelText('Pixels per millimetre').textContent!)).toBeCloseTo(parseFloat(canvas.getByLabelText('Desk width on screen').textContent!) / 1800, 2));
    roomSeam(canvasElement).set({ deskWidthMm: 1200 });
  },
};

/** Step two: with the camera frozen, everything at a scale of one. What looks wrong here is a wrong number in the table, or the truth. */
export const EverythingAtLifeSize: Story = {
  args: { stage: 'everything' },
  play: async ({ canvasElement }) => {
    if (import.meta.env.MODE !== 'test') return;
    await waitFor(() => expect(rows(canvasElement)).toHaveLength(14));
    for (const row of rows(canvasElement)) await expect(row).toHaveTextContent('1.00×');
    await expect(canvasElement.querySelectorAll('.sizing-bench__row--scaled')).toHaveLength(0);
  },
};

/** Step three: the shipped arrangement, with whatever composition scale each thing was given. Scaled rows are marked. */
export const AsComposed: Story = {
  args: { stage: 'everything', objectPlacements: composed },
  play: async ({ canvasElement }) => {
    if (import.meta.env.MODE !== 'test') return;
    await waitFor(() => expect(rows(canvasElement)).toHaveLength(14));
    for (const [id, place] of Object.entries(composed!)) {
      const row = canvasElement.querySelector(`[data-object="${id}"]`)!;
      await expect(row).toHaveTextContent(`${((place as { scale?: number }).scale ?? 1).toFixed(2)}×`);
    }
  },
};

/** One thing beside the ruler, for checking its declared millimetres against the real object. */
export const OneThing: Story = {
  args: { stage: 'one', focus: 'mug', ruler: 'tenCentimeter' },
  play: async ({ canvasElement }) => {
    if (import.meta.env.MODE !== 'test') return;
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('group', { name: 'Mug' })).toBeInTheDocument();
    await expect(canvas.queryByRole('group', { name: 'Pen' })).toBeNull();
    await waitFor(() => expect(rows(canvasElement)).toHaveLength(1));
    await expect(rows(canvasElement)[0]).toHaveTextContent('140 mm');
    const stick = canvas.getByRole('group', { name: 'Ten-centimeter stick' });
    const mug = canvas.getByRole('group', { name: 'Mug' });
    await expect(mug.style.getPropertyValue('--movable-x')).toBe(stick.style.getPropertyValue('--movable-x'));
  },
};


const calibration = {
  deskWidthMm: 1800, deskDepthMm: 1000, eyeHeightMm: 2100,
  viewerSetbackMm: 650, headTiltDegrees: 85, horizontalFieldOfViewDegrees: 75,
  deskShare: .8, roomLip: 0, showCamera: false, capture: true,
  lampX: 20, lampY: 160,
  lampLowerAngle: -142.6818247177271, lampUpperAngle: 110.41274403236815,
};

/** A fixed-camera lineup, not the final composition. Dates are explicitly layout samples. */
export const MvpInitialCast: Story = {
  args: { ...calibration, stage: 'mvp', objectPlacements: MVP_INITIAL_PLACEMENTS },
  render: function Calibration(args) {
    const [, updateArgs] = useArgs();
    return <><div className="sizing-bench__brief"><strong>MVP · initial cast</strong> Compare relative sizes, not layout. All objects start at 1×. Date passes are samples; media wiring comes later. Resize any object, then Sync story controls to keep the result. The ruler and blank sheet are references.</div><SizingBench {...withLightTuning(args)} onCaptureSettings={settings => updateArgs(settings)} /></>;
  },
  play: async ({ canvasElement }) => {
    if (import.meta.env.MODE !== 'test') return;
    const canvas = within(canvasElement);
    for (const name of ['Festival site plan', 'Performance contract', 'Pen', 'Label Bro', 'Handheld', 'Walkman', 'Next show sample pass']) {
      await expect(canvas.getByRole('group', { name })).toBeInTheDocument();
    }
    await expect(canvas.queryByRole('group', { name: 'Rolodex' })).toBeNull();
    const row = canvasElement.querySelector('[data-object="handheld"]')!;
    await waitFor(() => expect(row).toHaveTextContent('1.00×'));
    canvas.getByRole('button', { name: 'Resize Handheld' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(row).not.toHaveTextContent('1.00×'));
    const changed = row.textContent;
    await userEvent.click(canvas.getByRole('button', { name: 'Sync story controls' }));
    await waitFor(() => expect(row.textContent).toBe(changed));
  },
};

/** The same room and ruler, with the selected dossier drawings unpacked for comparison. */
export const MvpDossierContents: Story = {
  args: { ...calibration, stage: 'contents', objectPlacements: MVP_CONTENT_PLACEMENTS },
  render: function Calibration(args) {
    const [, updateArgs] = useArgs();
    return <><div className="sizing-bench__brief"><strong>MVP · dossier papers</strong> These are the actual dossier drawings at their existing sizes, separated for scale review. Open folds or turn pages to judge their full bounds. This is not the reveal arrangement.</div><SizingBench {...withLightTuning(args)} onCaptureSettings={settings => updateArgs(settings)} /></>;
  },
  play: async ({ canvasElement }) => {
    if (import.meta.env.MODE !== 'test') return;
    const canvas = within(canvasElement);
    const row = canvasElement.querySelector('[data-object="calibration-handbill"]');
    await waitFor(() => expect(row).toHaveTextContent('108 mm'));
    canvas.getByRole('button', { name: 'Resize Press handbill' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(row).not.toHaveTextContent('1.00×'));
    const resized = row!.textContent;
    await userEvent.click(canvas.getByRole('button', { name: 'Sync story controls' }));
    await waitFor(() => expect(row!.textContent).toBe(resized));
    await expect(canvas.queryByRole('group', { name: 'Live set print' })).toBeNull();
  },
};
