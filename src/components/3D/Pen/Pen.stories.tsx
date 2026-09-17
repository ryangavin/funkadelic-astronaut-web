import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { PEN_KINDS, Pen } from './Pen';

const meta = {
  title: 'Components/3D/Pen',
  component: Pen,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    kind: { control: 'inline-radio', options: PEN_KINDS },
    ink: { control: 'color' },
    rotation: { control: { type: 'range', min: -180, max: 180, step: 1 } },
  },
  args: { kind: 'ballpoint', ink: '#2c4fa3', rotation: -8 },
  decorators: [
    (Story) => (
      <div style={{ padding: '80px 56px', background: '#5a3a25' }}>
        <div style={{ width: 420 }}>
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof Pen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A clear ballpoint, cap on, the ink showing through the barrel. */
export const Ballpoint: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.pen[data-kind="ballpoint"] .pen__tube')).toBeInTheDocument();
  },
};

/** A permanent marker: black body, the cap in the ink's colour. */
export const Marker: Story = {
  args: { kind: 'marker', ink: '#c9432f', rotation: 6 },
};

/** A sharpened pencil, the eraser worn down. */
export const Pencil: Story = {
  args: { kind: 'pencil', rotation: -3 },
};

/** The three, dropped together. */
export const Handful: Story = {
  render: () => (
    <div style={{ position: 'relative', width: 480, height: 200 }}>
      <div style={{ position: 'absolute', left: 0, top: 30, width: 400 }}>
        <Pen kind="pencil" rotation={-14} />
      </div>
      <div style={{ position: 'absolute', left: 60, top: 70, width: 400 }}>
        <Pen kind="marker" ink="#228542" rotation={4} />
      </div>
      <div style={{ position: 'absolute', left: 40, top: 130, width: 400 }}>
        <Pen kind="ballpoint" ink="#121420" rotation={-2} />
      </div>
    </div>
  ),
};
