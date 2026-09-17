import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { GuitarPick } from './GuitarPick';

const meta = {
  title: 'Components/2D/Guitar Pick',
  component: GuitarPick,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    color: { control: 'color' },
    ink: { control: 'color' },
    print: { control: 'text' },
    rotation: { control: { type: 'range', min: -180, max: 180, step: 5 } },
  },
  args: { color: '#9275b2', ink: '#121420', print: 'FA', rotation: 20 },
  decorators: [
    (Story) => (
      <div style={{ padding: 56, background: '#5a3a25' }}>
        <div style={{ width: 64 }}>
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof GuitarPick>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The band's own, in the wordmark's purple. */
export const Purple: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('FA')).toBeInTheDocument();
  },
};

/** A pocketful. */
export const Pocketful: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
      {[
        ['#9275b2', 'FA', 10],
        ['#639ec8', 'FA', -25],
        ['#c9432f', '', 40],
        ['#f2b134', '73', -8],
        ['#228542', 'FA', 90],
      ].map(([color, print, rotation], index) => (
        <div key={index} style={{ width: 56 }}>
          <GuitarPick color={color as string} print={print as string} rotation={rotation as number} />
        </div>
      ))}
    </div>
  ),
};
