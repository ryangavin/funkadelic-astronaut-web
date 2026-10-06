import { useArgs } from 'storybook/preview-api';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { physicalControls, physicalDefaults, withLightTuning, RoomExperiment, type RoomStoryControls } from '../RoomControls/controls';
import { ScaleBench, type ScaleBenchProps } from './ScaleBench';

const meta = {
  title: 'Experience/Debug/Scale Bench',
  component: ScaleBench,
  parameters: { layout: 'fullscreen' },
  argTypes: { ...physicalControls, stickVariant: { control: 'select', options: ['meter', 'twelveInch', 'tenCentimeter'] } },
  args: { ...physicalDefaults, stickVariant: 'meter', eyeHeightMm: 1650, viewerSetbackMm: 650, deskShare: .8, roomLip: 180 },
  render: function Experiment(args) {
    const [currentArgs, updateArgs] = useArgs<typeof args>();
    return <RoomExperiment args={currentArgs} update={updateArgs}>{values => <ScaleBench {...withLightTuning(values)} />}</RoomExperiment>;
  },
} satisfies Meta<ScaleBenchProps & RoomStoryControls>;
export default meta;

/** A quiet scene for judging real dimensions; no synthetic performance measurements. */
export const PhysicalSetup: StoryObj<typeof meta> = {
  args: {
    deskShare: 0.6,
    roomLip: -15,
    deskWidthMm: 1800,
    eyeHeightMm: 1850,
    viewerSetbackMm: 425,
    headTiltDegrees: 85,
    horizontalFieldOfViewDegrees: 81
  },
};

/** Twelve inches occupies exactly 304.8 mm of the same desktop. */
export const TwelveInchRuler: StoryObj<typeof meta> = {
  args: { stickVariant: 'twelveInch' },
};

/** A pocket-size 100 mm reference, without changing the camera or desk. */
export const TenCentimeterStick: StoryObj<typeof meta> = {
  args: { stickVariant: 'tenCentimeter' },
};
