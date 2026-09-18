import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { MeterStick } from './MeterStick';
import { ScaleBench } from '../../../debug/ScaleBench/ScaleBench';

const meta = {
  title: 'Components/3D/Meter Stick',
  component: MeterStick,
  parameters: { layout: 'fullscreen' },
  args: { inches: true },
  tags: ['autodocs'],
} satisfies Meta<typeof MeterStick>;
export default meta;
type Story = StoryObj<typeof meta>;

/** 1000 individual millimetres, centimetre labels, and optional eighth-inch marks. */
export const OneMeter: Story = {
  render: args => <div style={{ padding: '80px 24px', background: '#493a2a' }}><MeterStick {...args} /></div>,
  play: async ({ canvasElement }) => {
    const svg = within(canvasElement).getByRole('img', { name: /One meter stick/ });
    await expect(svg).toHaveAttribute('viewBox', '0 0 1000 40');
    await expect(svg.querySelector('.meter-stick__ticks')?.getAttribute('d')?.split('M').length).toBe(1002);
    await expect(svg.querySelector('.meter-stick__numbers')?.lastElementChild).toHaveAttribute('x', '1000');
  },
};

/** A 1 m stick spans five sixths of the 1.2 m desktop. Drag or use arrows; brackets rotate. */
export const OnDesk: Story = {
  render: () => <ScaleBench />,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    if (import.meta.env.MODE !== 'test') return;
    const canvas = within(canvasElement);
    const stick = canvas.getByRole('group', { name: 'Meter stick' });
    await expect(stick.style.getPropertyValue('--movable-width')).toBe('calc(1200 * var(--movable-unit))');
    await expect(canvas.queryByRole('button', { name: 'Resize Meter stick' })).not.toBeInTheDocument();
    const before = stick.getAttribute('style');
    stick.focus();
    await userEvent.keyboard('{ArrowRight}]');
    await expect(stick.getAttribute('style')).not.toBe(before);
    await expect(stick.style.getPropertyValue('--movable-rotation')).toBe('1deg');
    await userEvent.keyboard('+');
    await expect(stick.style.getPropertyValue('--movable-width')).toBe('calc(1200 * var(--movable-unit))');
    // Restore the reference after assertions so browsing never leaves a modified scene.
    await userEvent.keyboard('[[{ArrowLeft}');
    await expect(stick.getAttribute('style')).toBe(before);
  },
};
