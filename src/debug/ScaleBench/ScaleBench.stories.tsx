import { expect, fireEvent, waitFor, within } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { physicalControls, physicalDefaults, withLightTuning, RoomExperiment, type RoomStoryControls } from '../RoomControls/controls';
import type { RoomProps } from '../../foundations/Room/Room';
import { ScaleBench } from './ScaleBench';

const meta = {
  title: 'Debug/Scale Bench',
  component: ScaleBench,
  parameters: { layout: 'fullscreen' },
  argTypes: { ...physicalControls },
  args: { ...physicalDefaults, cameraMode: 'physical', eyeHeightMm: 1650, viewerSetbackMm: 650, deskShare: .8, roomLip: 180 },
  render: function Experiment(args) {
    return <>
      <p style={{ margin: 16, font: '14px/1.5 monospace' }}>Scale bench · 1 meter / 39.37 inches. Drag the stick; use its turn handle or bracket keys to rotate. Its size stays fixed while you adjust the room.</p>
      <RoomExperiment args={args}>{values => <ScaleBench {...withLightTuning(values)} />}</RoomExperiment>
    </>;
  },
} satisfies Meta<RoomProps & RoomStoryControls>;
export default meta;

/** A quiet scene for judging real dimensions; no synthetic performance measurements. */
export const PhysicalSetup: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    if (import.meta.env.MODE !== 'test') return;
    const canvas = within(canvasElement);
    const stick = canvas.getByRole('group', { name: 'Meter stick' });
    const desk = canvasElement.querySelector<HTMLElement>('.desk')!;
    const fraction = () => parseFloat(getComputedStyle(stick).width) / parseFloat(getComputedStyle(desk).width);
    await expect(fraction()).toBeCloseTo(1000 / 1200, 3);
    fireEvent.change(canvas.getByRole('slider', { name: 'Desk width (mm) slider' }), { target: { value: '2000' } });
    await waitFor(() => expect(fraction()).toBeCloseTo(.5, 3));
    await expect(canvasElement.querySelector('.desk-study__shadow')).toHaveAttribute('viewBox', '0 0 2400 960');
    await expect(canvas.getByLabelText('Desk width (mm) inches')).toHaveTextContent('78.74 in');
    await expect(stick.style.getPropertyValue('--movable-width')).toBe('calc(1200 * var(--movable-unit))');
  },
};
