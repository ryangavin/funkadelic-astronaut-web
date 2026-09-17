import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { STICKY_NOTE_COLORS, StickyNote } from './StickyNote';

const meta = {
  title: 'Components/2D/Sticky Note',
  component: StickyNote,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    color: { control: 'inline-radio', options: STICKY_NOTE_COLORS },
    curl: { control: 'inline-radio', options: ['none', 'left', 'right'] },
    ink: { control: 'color' },
    size: { control: { type: 'range', min: 40, max: 120, step: 2 } },
    rotation: { control: { type: 'range', min: -20, max: 20, step: 0.5 } },
    children: { control: false },
  },
  args: {
    color: 'canary',
    curl: 'right',
    ink: '#1d2a5e',
    size: 72,
    rotation: 3,
    children: (
      <>
        <p>Sept 26 — the 6pm slot?</p>
        <p>Listen to the tape!!</p>
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ padding: 56, background: '#dcbe86' }}>
        <div style={{ width: 200 }}>
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof StickyNote>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The promoter's note to themself. */
export const Note: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Listen to the tape!!')).toBeVisible();
    await expect(canvasElement.querySelector('.sticky-note[data-curl="right"]')).toBeInTheDocument();
  },
};

/** Stuck down flat, the other corner. */
export const Flat: Story = {
  args: { curl: 'none', color: 'blue', rotation: -2 },
};

/** The pad's colours. */
export const Pad: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', width: 560 }}>
      {STICKY_NOTE_COLORS.map((color, index) => (
        <div key={color} style={{ width: 160 }}>
          <StickyNote {...args} color={color} rotation={index % 2 ? 3 : -4} curl={index % 2 ? 'left' : 'right'}>
            <p>{color}</p>
          </StickyNote>
        </div>
      ))}
    </div>
  ),
};
