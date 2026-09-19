import { useArgs } from 'storybook/preview-api';
import { expect, waitFor, within } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { physicalControls, physicalDefaults, withLightTuning, RoomExperiment, roomSeam, type RoomStoryControls } from '../RoomControls/controls';
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
    stage: { control: 'inline-radio', options: ['papers', 'everything', 'one'], table: { category: 'Sizing' }, description: 'The sheets alone, everything at life size, or one thing.' },
    focus: { control: 'select', options: OBJECT_IDS, table: { category: 'Sizing' }, description: 'The one thing on the desk when the stage is one.' },
    ruler: { control: 'inline-radio', options: ['twelveInch', 'meter', 'tenCentimeter', 'none'], table: { category: 'Sizing' } },
    paperTargetPx: { control: { type: 'number', step: 10 }, table: { category: 'Sizing' }, description: 'How wide the front sheet should come out on this screen.' },
    readout: { control: 'boolean', table: { category: 'Sizing' } },
    objectPlacements: { control: 'object', table: { category: 'Sizing' } },
    deskWidthMm: physicalControls.deskWidthMm,
    deskDepthMm: physicalControls.deskDepthMm,
    deskShare: { table: { category: 'Framing' }, control: { type: 'range', min: 0.3, max: 1, step: 0.01 }, description: 'How much of the frame the reference desk takes.' },
    roomLip: { table: { category: 'Framing' }, control: { type: 'number', step: 5 } },
    eyeHeightMm: physicalControls.eyeHeightMm,
    viewerSetbackMm: physicalControls.viewerSetbackMm,
    headTiltDegrees: physicalControls.headTiltDegrees,
    horizontalFieldOfViewDegrees: physicalControls.horizontalFieldOfViewDegrees,
    wood: { table: { category: 'Desktop' }, control: 'inline-radio', options: DESK_WOODS },
    ...Object.fromEntries(['windowHeightMm', 'windowSillHeightMm', 'deskHeightMm', 'deskEdgeMm', 'lampIntensity', 'showPerformance', 'roomSpanMm', 'floorFrontMm', 'wallHeightMm', 'poolSpread', 'floorPoolSpread', 'poolFalloff', 'shadowReach', 'shadowScaleLimit', 'shadowAttenuation', 'floorShadowLimit', 'floorShadowTemper', 'lightTuning', 'showCamera',
      'room', 'floor', 'wall', 'roomBlur', 'roomDim', 'lamp', 'shadowStrength', 'lampX', 'lampY', 'lampRotation', 'lampWidth', 'lampEnamel', 'lampLowerAngle', 'lampUpperAngle', 'showObjects',
      'onArrange', 'onArticulate', 'onLamp', 'onCaptureSettings', 'children'].map(key => [key, { table: { disable: true } }])),
  },
  args: { ...physicalDefaults, ...shipped, stage: 'papers', focus: 'mug', ruler: 'twelveInch', paperTargetPx: 260, readout: true },
  render: function Experiment(args) {
    const [currentArgs, updateArgs] = useArgs<typeof args>();
    return <RoomExperiment args={currentArgs} update={updateArgs}>{values => <SizingBench {...withLightTuning(values)} />}</RoomExperiment>;
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
    roomSeam(canvasElement).set({ deskWidthMm: 1800 });
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
    await waitFor(() => expect(rows(canvasElement)).toHaveLength(OBJECT_IDS.length));
    for (const row of rows(canvasElement)) await expect(row).toHaveTextContent('1.00×');
    await expect(canvasElement.querySelectorAll('.sizing-bench__row--scaled')).toHaveLength(0);
  },
};

/** Step three: the shipped arrangement, with whatever composition scale each thing was given. Scaled rows are marked. */
export const AsComposed: Story = {
  args: { stage: 'everything', objectPlacements: composed },
  play: async ({ canvasElement }) => {
    if (import.meta.env.MODE !== 'test') return;
    await waitFor(() => expect(rows(canvasElement)).toHaveLength(OBJECT_IDS.length));
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
