import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { PAPER_STOCKS } from '../PaperSheet/PaperSheet';
import { PaperStrip, type PaperStripProps } from './PaperStrip';

const meta = {
  title: 'Foundations/Layout/Paper Strip', component: PaperStrip, tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    stock: { control: 'inline-radio', options: PAPER_STOCKS },
    rotation: { control: { type: 'range', min: -12, max: 12, step: .5 } },
    paddingX: { control: { type: 'range', min: 0, max: 48, step: 1 } },
    paddingY: { control: { type: 'range', min: 0, max: 48, step: 1 } },
  },
  args: { stock: 'pale', rotation: -1, paddingX: 16, paddingY: 8, children: 'New Jersey · Future Rock' },
} satisfies Meta<typeof PaperStrip>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Label: Story = {};
export const IconRow: Story = {
  render: (args) => <PaperStrip {...args}><div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
    <span>Listen to the band</span><span aria-hidden="true">↗</span>
  </div></PaperStrip>,
};
export const WrappedContent: Story = {
  args: { rotation: 2, children: 'Three friends blending funk and electronics with keyboards, drums, bass and vocals.' },
  render: (args) => <div style={{ width: 'min(260px, 70vw)' }}><PaperStrip {...args} /></div>,
};
function ChangingContent(args: PaperStripProps) {
  const [expanded, setExpanded] = useState(false);
  return <div style={{ width: 240 }}>
    <button onClick={() => setExpanded(!expanded)} style={{ marginBottom: 24 }}>Toggle content</button>
    <PaperStrip {...args}>{expanded ? 'A paper strip grows and wraps around longer content, keeping its torn backing fitted to every line.' : 'Short label'}</PaperStrip>
  </div>;
}
export const ContentChanges: Story = {
  args: { rotation: 0 },
  render: (args) => <ChangingContent {...args} />,
  play: async ({ canvasElement }) => {
    const surface = canvasElement.querySelector('.shaped-paper') as HTMLElement;
    const backing = surface.querySelector('svg')!;
    await canvasElement.ownerDocument.fonts.load('16px "Balsamiq Sans"');
    const originalHeight = surface.clientHeight;
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Toggle content' }));
    await waitFor(() => {
      expect(surface.clientHeight).toBeGreaterThan(originalHeight);
      const [, , width, height] = backing.getAttribute('viewBox')!.split(' ').map(Number);
      expect(height / width).toBeCloseTo(surface.clientHeight / surface.clientWidth, 5);
    });
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Toggle content' }));
    await waitFor(() => expect(surface.clientHeight).toBe(originalHeight));
  },
};
