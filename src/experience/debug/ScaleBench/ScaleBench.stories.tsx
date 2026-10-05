import { useArgs } from 'storybook/preview-api';
import { expect, waitFor, within } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { physicalControls, physicalDefaults, withLightTuning, RoomExperiment, roomSeam, type RoomStoryControls } from '../RoomControls/controls';
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

  play: async ({ canvasElement }) => {
    if (import.meta.env.MODE !== 'test') return;
    const canvas = within(canvasElement);
    const stick = canvas.getByRole('group', { name: 'Meter stick' });
    const desk = canvasElement.querySelector<HTMLElement>('.desk')!;
    const fraction = () => parseFloat(getComputedStyle(stick).width) / parseFloat(getComputedStyle(desk).width);
    await expect(fraction()).toBeCloseTo(1000 / 1800, 3);
    await expect(canvas.getByLabelText('Desk width inches')).toHaveTextContent('70.87 in');
    roomSeam(canvasElement).set({ deskWidthMm: 2000 });
    await waitFor(() => expect(fraction()).toBeCloseTo(.5, 3));
    await expect(canvasElement.querySelector('.desk-study__shadow')).toHaveAttribute('viewBox', '0 0 2400 960');
    // The on-scene caption is the only imperial readout now that the sidebar is gone.
    await expect(canvas.getByLabelText('Desk width (mm)')).toHaveTextContent('2000 mm');
    await expect(canvas.getByLabelText('Desk width inches')).toHaveTextContent('78.74 in');
    await expect(canvas.getByLabelText('Desk depth inches')).toHaveTextContent('31.50 in');
    await expect(stick.style.getPropertyValue('--movable-width')).toBe('calc(1200 * var(--movable-unit))');
  }
};

/** Twelve inches occupies exactly 304.8 mm of the same desktop. */
export const TwelveInchRuler: StoryObj<typeof meta> = {
  args: { stickVariant: 'twelveInch' },
  play: async ({ canvasElement }) => {
    const stick = within(canvasElement).getByRole('group', { name: 'Twelve-inch ruler' });
    const desk = canvasElement.querySelector<HTMLElement>('.desk')!;
    await expect(parseFloat(getComputedStyle(stick).width) / parseFloat(getComputedStyle(desk).width)).toBeCloseTo(304.8 / 1200, 3);
  },
};

/** A pocket-size 100 mm reference, without changing the camera or desk. */
export const TenCentimeterStick: StoryObj<typeof meta> = {
  args: { stickVariant: 'tenCentimeter' },
  play: async ({ canvasElement }) => {
    const stick = within(canvasElement).getByRole('group', { name: 'Ten-centimeter stick' });
    const desk = canvasElement.querySelector<HTMLElement>('.desk')!;
    await expect(parseFloat(getComputedStyle(stick).width) / parseFloat(getComputedStyle(desk).width)).toBeCloseTo(100 / 1200, 3);
  },
};
