import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { DESK_CLOCK_FINISHES, DeskClock, readout } from './DeskClock';

const meta = {
  title: 'Components/Desk Clock',
  component: DeskClock,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    finish: { control: 'inline-radio', options: DESK_CLOCK_FINISHES },
    hours: { control: 'inline-radio', options: [12, 24] },
    rotation: { control: { type: 'range', min: -20, max: 20, step: 0.5 } },
    now: { control: false },
  },
  args: { hours: 12, finish: 'black', rotation: -3, running: true },
  decorators: [
    (Story) => (
      <div style={{ padding: 56, background: '#6e4a2f' }}>
        <div style={{ width: 300 }}>
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof DeskClock>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Keeping real time. */
export const Ticking: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('timer')).toHaveAccessibleName(/^Desk clock: \d{1,2}:\d{2} (AM|PM), (SUN|MON|TUE|WED|THU|FRI|SAT) [A-Z]{3} +\d{1,2}$/);
  },
};

/** Held at ten past six on the festival's Saturday, twenty-four hour face. */
export const Held: Story = {
  args: { running: false, hours: 24, now: () => new Date(2026, 8, 26, 18, 10, 0), finish: 'silver', rotation: 2 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('timer')).toHaveAccessibleName('Desk clock: 18:10, SAT SEP 26');
    await expect(readout(new Date(2026, 8, 26, 18, 10, 0), 12)).toEqual({ time: ' 6:10', date: 'SAT SEP 26', meridian: 'PM', seconds: 0 });
    await expect(readout(new Date(2026, 0, 1, 0, 5, 30), 12).time).toBe('12:05');
  },
};

/** The three casings. */
export const Finishes: Story = {
  args: { running: false, now: () => new Date(2026, 8, 26, 9, 41, 0) },
  render: (args) => (
    <div style={{ display: 'flex', gap: 32 }}>
      {DESK_CLOCK_FINISHES.map((finish) => (
        <div key={finish} style={{ width: 240 }}>
          <DeskClock {...args} finish={finish} rotation={0} />
        </div>
      ))}
    </div>
  ),
};
