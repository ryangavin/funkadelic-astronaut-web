import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Room } from '../../../foundations/Room/Room';
import { PerformanceOverlay } from './PerformanceOverlay';

const meta = {
  title: 'Experience/Debug/Performance Overlay',
  component: PerformanceOverlay,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PerformanceOverlay>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Compact: Story = {
  render: args => <div style={{ position: 'relative', minHeight: 280, background: 'linear-gradient(120deg, #28322f, #9a8461)' }}>
    <PerformanceOverlay {...args} />
    <button style={{ position: 'absolute', inset: 0, color: '#f1ebdf', border: 0, background: 'transparent' }}>Scene remains interactive</button>
  </div>,
};

export const RoomToggle: Story = {
  render: function Toggle() {
    const [show, setShow] = useState(false);
    return <><button onClick={() => setShow(value => !value)}>Toggle performance</button><Room showPerformance={show} /></>;
  },
};
