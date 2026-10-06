import { DeskObjectStudy } from '../../../experience/debug/ObjectStudy/DeskObjectStudy';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DESK_CLOCK_FINISHES, DeskClock } from './DeskClock';

const meta = {
  title: 'Library/Components/3D/Desk Clock',
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
    (Story, context) => context.parameters.composition ? <Story /> : (
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
export const Ticking: Story = {};

/** Held at ten past six on the festival's Saturday, twenty-four hour face. */
export const Held: Story = {
  args: { running: false, hours: 24, now: () => new Date(2026, 8, 26, 18, 10, 0), finish: 'silver', rotation: 2 },
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

export const OnDesk: Story = {
  name: 'On desk',
  parameters: { layout: 'fullscreen', composition: true },
  render: (args) => <DeskObjectStudy name="Desk clock" widthMm={90} depthRatio={560/720} heightMm={15} ><DeskClock {...args} rotation={0} /></DeskObjectStudy>,
};
