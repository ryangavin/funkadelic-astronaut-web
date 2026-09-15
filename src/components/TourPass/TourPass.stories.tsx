import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  DEFAULT_TOUR_PASS_COLOR,
  DEFAULT_TOUR_PASS_ROTATION,
  OLIVES_TOUR_PASS_PROPS,
  TOUR_PASS_COLORS,
  TourPass,
} from './TourPass';

const meta = {
  title: 'Components/Tour Pass',
  component: TourPass,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 'min(420px, calc(100vw - 32px))' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    rotation: { control: { type: 'range', min: -10, max: 10, step: 0.25 } },
    color: { control: 'inline-radio', options: TOUR_PASS_COLORS },
  },
  args: { ...OLIVES_TOUR_PASS_PROPS, rotation: DEFAULT_TOUR_PASS_ROTATION, color: DEFAULT_TOUR_PASS_COLOR },
} satisfies Meta<typeof TourPass>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OlivesArtistPass: Story = {};

export const AnnouncedTickets: Story = {
  args: {
    location: '118 Main Street',
    time: 'Doors 7:00 PM · set 8:00 PM',
    actionLabel: 'Get tickets',
    actionHref: '#tickets',
    actionAriaLabel: 'Get tickets for Olive’s',
  },
};

export const Straight: Story = {
  args: { rotation: 0 },
};

export const Inks: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {TOUR_PASS_COLORS.map((color) => (
        <TourPass key={color} {...args} color={color} />
      ))}
    </div>
  ),
};
