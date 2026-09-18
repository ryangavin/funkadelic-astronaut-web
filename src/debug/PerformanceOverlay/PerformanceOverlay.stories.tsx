import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Room } from '../../foundations/Room/Room';
import { PerformanceOverlay } from './PerformanceOverlay';

const meta = {
  title: 'Debug/Performance Overlay',
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
  play: async ({ canvasElement }) => {
    const overlay = within(canvasElement).getByRole('group', { name: 'Animation frame timing' });
    await expect(getComputedStyle(overlay).pointerEvents).toBe('none');
    await expect(getComputedStyle(overlay).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    await expect(overlay).toHaveAttribute('aria-live', 'off');
    await waitFor(() => expect(overlay.textContent).toMatch(/FPS \d+\.\dframe \d+\.\d ms/), { timeout: 2000 });
    const box = overlay.getBoundingClientRect();
    await expect(canvasElement.ownerDocument.elementFromPoint(box.x + 3, box.y + 3)).toBe(within(canvasElement).getByRole('button'));
  },
};

export const RoomToggle: Story = {
  render: function Toggle() {
    const [show, setShow] = useState(false);
    return <><button onClick={() => setShow(value => !value)}>Toggle performance</button><Room showPerformance={show} /></>;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('group', { name: 'Animation frame timing' })).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Toggle performance' }));
    const overlay = canvas.getByRole('group', { name: 'Animation frame timing' });
    await expect(overlay.closest('.room')).toBeInTheDocument();
    await expect(overlay.closest('.perspective')).toBeNull();
    await waitFor(() => expect(overlay.textContent).toMatch(/FPS \d/), { timeout: 2000 });
    await userEvent.click(canvas.getByRole('button', { name: 'Toggle performance' }));
    await expect(overlay).not.toBeInTheDocument();
  },
};
