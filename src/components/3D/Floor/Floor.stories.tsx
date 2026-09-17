import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { GENTLE_DEPTH, Perspective } from '../../../behaviors/Perspective/Perspective';
import { FLOOR_BOARD, FLOOR_BOARD_RUN, FLOOR_LAYS, FLOOR_WOODS, Floor } from './Floor';

const meta = {
  title: 'Foundations/Layout/Floor',
  component: Floor,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: {
    wood: { control: 'inline-radio', options: FLOOR_WOODS },
    width: { control: { type: 'range', min: 720, max: 2880, step: 20 } },
    height: { control: { type: 'range', min: 400, max: 3200, step: 20 } },
    board: { control: { type: 'range', min: 90, max: 420, step: 6 } },
    run: { control: { type: 'range', min: 0, max: 3000, step: 30 } },
    lay: { control: 'inline-radio', options: FLOOR_LAYS },
    light: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
  },
  args: { wood: 'pine', width: 1440, height: 1620, board: FLOOR_BOARD, run: FLOOR_BOARD_RUN, lay: 'across', light: 1 },
} satisfies Meta<typeof Floor>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Straight down at the boards: 150 millimetre stock, laid across, butting at staggered ends. */
export const Boards: Story = {
  play: async ({ canvasElement }) => {
    const ground = canvasElement.querySelector<HTMLElement>('.floor__ground')!;
    const box = ground.getBoundingClientRect();
    // The depth follows the width, in floor units.
    await expect(box.height / box.width).toBeCloseTo(1620 / 1440, 2);
    // A 1620 deep floor of 180 boards is nine courses.
    await expect(canvasElement.querySelectorAll('.floor__course')).toHaveLength(9);
    // And they do not all butt in the same place.
    const at = [...canvasElement.querySelectorAll<HTMLElement>('.floor__butt')].map((butt) => butt.style.getPropertyValue('--floor-butt-at'));
    await expect(new Set(at).size).toBeGreaterThan(1);
  },
};

/** Laid in unbroken lengths, wall to wall, with no ends showing. */
export const Unbroken: Story = {
  args: { run: 0 },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('.floor__butt')).toHaveLength(0);
  },
};

/** Laid away from the near edge, toward a wall at the top: a 1440 wide floor of 180 boards is eight courses across. */
export const LaidAway: Story = {
  name: 'Laid away',
  args: { lay: 'away' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('.floor__course')).toHaveLength(8);
    const boards = canvasElement.querySelector<HTMLElement>('.floor__boards')!;
    const ground = canvasElement.querySelector<HTMLElement>('.floor__ground')!;
    // Turned a quarter, the layer still fills the floor's own box.
    const a = boards.getBoundingClientRect(), b = ground.getBoundingClientRect();
    await expect(Math.abs(a.width - b.width)).toBeLessThan(2);
    await expect(Math.abs(a.height - b.height)).toBeLessThan(2);
  },
};

/** Wide boards: 350 millimetre stock, the way an old building is floored. */
export const WideBoards: Story = {
  name: 'Wide boards',
  args: { board: 420, run: 2400 },
};

/** The four timbers. */
export const Woods: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 24, padding: 24, background: '#1a120c' }}>
      {FLOOR_WOODS.map((wood) => (
        <Floor key={wood} {...args} wood={wood} height={540} />
      ))}
    </div>
  ),
};

/** Tipped away from the near edge, which is how a room will ever see it: the courses foreshorten together and the far boards close up. */
export const InPerspective: Story = {
  name: 'In perspective',
  args: { height: 2400 },
  render: (args) => (
    <div style={{ padding: 24, background: '#15100b' }}>
      <Perspective angle={78} depth={GENTLE_DEPTH} width={args.width}>
        <Floor {...args} />
      </Perspective>
    </div>
  ),
};
