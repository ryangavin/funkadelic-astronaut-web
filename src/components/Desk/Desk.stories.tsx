import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Mug } from '../Mug/Mug';
import { CoffeeRing } from '../Mug/CoffeeRing';
import { Pen } from '../Pen/Pen';
import { Pin } from '../Pin/Pin';
import { Stage } from '../Stage/Stage';
import { StickyNote } from '../StickyNote/StickyNote';
import { DESK_WOODS, Desk } from './Desk';

const meta = {
  title: 'Layout/Desk',
  component: Desk,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: {
    wood: { control: 'inline-radio', options: DESK_WOODS },
    height: { control: { type: 'range', min: 300, max: 1600, step: 10 } },
    boards: { control: { type: 'range', min: 1, max: 6, step: 1 } },
    light: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
  },
  args: { wood: 'walnut', height: 720, boards: 3, light: 1 },
} satisfies Meta<typeof Desk>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The bare top, filling the width it is shown at; the grain and the light are drawn, not photographed. */
export const Bare: Story = {
  play: async ({ canvasElement }) => {
    const desk = canvasElement.querySelector<HTMLElement>('.desk__top')!;
    // The height follows the width, in desk units.
    await expect(desk.getBoundingClientRect().height / desk.getBoundingClientRect().width).toBeCloseTo(720 / 1440, 2);
    await expect(canvasElement.querySelectorAll('.desk__board')).toHaveLength(3);
  },
};

/** A few things on it, pinned in desk units on a Stage, so the composition scales as one piece. */
export const WithThings: Story = {
  render: (args) => (
    <Stage height={args.height}>
      <Desk {...args}>
        <Pin x={120} y={140} width={180} rotation={20}>
          <CoffeeRing strength={0.5} />
        </Pin>
        <Pin x={170} y={90} width={160}>
          <Mug rotation={40} />
        </Pin>
        <Pin x={420} y={200} width={220} rotation={-3}>
          <StickyNote color="pink" rotation={0} size={76}>
            <p>Buy more tape</p>
          </StickyNote>
        </Pin>
        <Pin x={700} y={420} width={330} rotation={-24}>
          <Pen kind="marker" ink="#228542" />
        </Pin>
        <Pin x={980} y={120} width={300} rotation={8}>
          <Pen kind="pencil" />
        </Pin>
      </Desk>
    </Stage>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Buy more tape')).toBeVisible();
  },
};

/** The three timbers. */
export const Woods: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 24, padding: 24, background: '#1a120c' }}>
      {DESK_WOODS.map((wood) => (
        <Desk key={wood} {...args} wood={wood} height={260} />
      ))}
    </div>
  ),
};
