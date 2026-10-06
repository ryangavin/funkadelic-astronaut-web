import type { Meta, StoryObj } from '@storybook/react-vite';
import { MeterStick } from './MeterStick';
import { ScaleBench } from '../../../experience/debug/ScaleBench/ScaleBench';

const meta = {
  title: 'Library/Components/3D/Meter Stick',
  component: MeterStick,
  parameters: { layout: 'fullscreen' },
  args: { inches: true, variant: 'meter' },
  argTypes: { variant: { control: 'select', options: ['meter', 'twelveInch', 'tenCentimeter'] } },
  tags: ['autodocs'],
} satisfies Meta<typeof MeterStick>;
export default meta;
type Story = StoryObj<typeof meta>;

/** 1000 individual millimetres, centimetre labels, and optional eighth-inch marks. */
export const OneMeter: Story = {
  render: args => <div style={{ padding: '80px 24px', background: '#493a2a' }}><MeterStick {...args} /></div>,
};

/** A 1 m stick spans five sixths of the 1.2 m desktop. Drag or use arrows; brackets rotate. */
export const OnDesk: Story = {
  render: () => <ScaleBench />,
  parameters: { controls: { disable: true } },
};

/** The measuring edges are exactly twelve inches (304.8 mm) apart. */
export const TwelveInch: Story = {
  args: { variant: 'twelveInch' },
  render: args => <div style={{ padding: '80px 24px', background: '#493a2a', maxWidth: 900 }}><MeterStick {...args} /></div>,
};

export const TenCentimeter: Story = {
  args: { variant: 'tenCentimeter' },
  render: args => <div style={{ padding: '80px 24px', background: '#493a2a', maxWidth: 400 }}><MeterStick {...args} /></div>,
};
