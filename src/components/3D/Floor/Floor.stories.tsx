import type { Meta, StoryObj } from '@storybook/react-vite';
import { GENTLE_DEPTH, Perspective } from '../../../behaviors/Perspective/Perspective';
import { FLOOR_BOARD, FLOOR_BOARD_RUN, FLOOR_LAYS, FLOOR_WOODS, Floor } from './Floor';

const meta = {
  title: 'Library/Foundations/Layout/Floor',
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
export const Boards: Story = {};

/** Laid in unbroken lengths, wall to wall, with no ends showing. */
export const Unbroken: Story = {
  args: { run: 0 },
};

/** Laid away from the near edge, toward a wall at the top: a 1440 wide floor of 180 boards is eight courses across. */
export const LaidAway: Story = {
  name: 'Laid away',
  args: { lay: 'away' },
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
