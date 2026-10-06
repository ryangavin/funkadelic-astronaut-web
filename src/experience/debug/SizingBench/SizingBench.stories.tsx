import { useArgs } from 'storybook/preview-api';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { physicalControls, physicalDefaults, withLightTuning, RoomExperiment, type RoomStoryControls } from '../RoomControls/controls';
import { Desk } from '../../Desk/PerspectiveDesk.stories';
import { DESK_WOODS } from '../../../components/3D/Desk/Desk';
import { OBJECT_IDS, SizingBench, type SizingBenchProps } from './SizingBench';

/* The shipped desk's camera and lamp, so what is judged here is what ships. */
const { objectPlacements: composed, showObjects, ...shipped } = Desk.args!;
void showObjects;

const meta = {
  title: 'Experience/Debug/Sizing Bench',
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
    return <RoomExperiment args={currentArgs} update={updateArgs}>{values => <SizingBench {...withLightTuning(values)} />}</RoomExperiment>;
  },
} satisfies Meta<SizingBenchProps & RoomStoryControls>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Step one: the four sheets alone. Move the camera until the front sheet meets its target; nothing else is on the desk to argue with. */
export const PapersFirst: Story = {};

/** Step two: with the camera frozen, everything at a scale of one. What looks wrong here is a wrong number in the table, or the truth. */
export const EverythingAtLifeSize: Story = {
  args: { stage: 'everything' },
};

/** Step three: the shipped arrangement, with whatever composition scale each thing was given. Scaled rows are marked. */
export const AsComposed: Story = {
  args: { stage: 'everything', objectPlacements: composed },
};

/** One thing beside the ruler, for checking its declared millimetres against the real object. */
export const OneThing: Story = {
  args: { stage: 'one', focus: 'mug', ruler: 'tenCentimeter' },
};
