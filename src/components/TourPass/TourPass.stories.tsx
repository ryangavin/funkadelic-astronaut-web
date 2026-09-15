import type { Meta, StoryObj } from '@storybook/react-vite';
import { OLIVES_TOUR_PASS_PROPS, TourPass } from './TourPass';

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
  args: OLIVES_TOUR_PASS_PROPS,
} satisfies Meta<typeof TourPass>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OlivesArtistPass: Story = {};

export const AnnouncedTickets: Story = {
  args: {
    statusLabel: 'On sale',
    location: '118 Main Street',
    time: 'Doors 7:00 PM · set 8:00 PM',
    actionLabel: 'Get tickets',
    actionHref: '#tickets',
    actionAriaLabel: 'Get tickets for Olive’s',
  },
};
