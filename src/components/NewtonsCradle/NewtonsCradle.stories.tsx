import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CRADLE_BALLS, NewtonsCradle } from './NewtonsCradle';

const meta = {
  title: 'Components/Newton’s Cradle',
  component: NewtonsCradle,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    rotation: { control: { type: 'range', min: -30, max: 30, step: 0.5 } },
  },
  args: { rotation: -4, sound: true, swinging: false, onSwing: fn() },
  decorators: [
    (Story) => (
      <div style={{ padding: 56, background: '#6e4a2f' }}>
        <div style={{ width: 320 }}>
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof NewtonsCradle>;

export default meta;
type Story = StoryObj<typeof meta>;

/** At rest. Click it. */
export const Still: Story = {
  args: { sound: false },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelectorAll('.newtons-cradle__ball')).toHaveLength(CRADLE_BALLS.length);
    const push = canvas.getByRole('button', { name: 'Set the cradle going' });
    await userEvent.click(push);
    await expect(args.onSwing).toHaveBeenCalledWith(true);
    await expect(canvas.getByRole('button', { name: 'Stop the cradle' })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvasElement.querySelector('.newtons-cradle')).toHaveAttribute('data-swinging');
    await userEvent.click(canvas.getByRole('button', { name: 'Stop the cradle' }));
    await expect(args.onSwing).toHaveBeenCalledWith(false);
  },
};

/** Already going, with the click of the balls. */
export const Swinging: Story = {
  args: { swinging: true },
};
