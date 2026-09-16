import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  DEFAULT_TOUR_PASS_COLOR,
  DEFAULT_TOUR_PASS_ROTATION,
  OLIVES_TOUR_PASS_PROPS,
  TOUR_PASS_COLORS,
  TourPass,
} from './TourPass';
import { NYACK_FESTIVAL_TOUR_PASS_PROPS, SATURN_LANES_TOUR_PASS_PROPS } from './TourPass.data';

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
    venue: { control: 'text' },
    city: { control: 'text' },
    location: { control: 'text' },
    time: { control: 'text' },
    actionLabel: { control: 'text' },
    actionHref: { control: 'text' },
    rotation: { control: { type: 'range', min: -10, max: 10, step: 0.25 } },
    color: { control: 'inline-radio', options: TOUR_PASS_COLORS },
  },
  args: { ...OLIVES_TOUR_PASS_PROPS, rotation: DEFAULT_TOUR_PASS_ROTATION, color: DEFAULT_TOUR_PASS_COLOR },
} satisfies Meta<typeof TourPass>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OlivesArtistPass: Story = {};

export const NyackNeighborhoodMusicArtsFestival: Story = {
  name: 'Nyack Neighborhood Music & Arts Festival',
  args: { ...NYACK_FESTIVAL_TOUR_PASS_PROPS, rotation: 1.5 },
};

export const SaturnLanes: Story = {
  args: { ...SATURN_LANES_TOUR_PASS_PROPS, rotation: -1 },
};

export const AnnouncedTickets: Story = {
  args: {
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
