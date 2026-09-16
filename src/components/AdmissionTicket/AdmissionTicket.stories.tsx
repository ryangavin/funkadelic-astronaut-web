import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ADMISSION_TICKET_COLORS,
  AdmissionTicket,
  DEFAULT_ADMISSION_TICKET_COLOR,
  DEFAULT_ADMISSION_TICKET_ROTATION,
  TOUR_ADMISSION_TICKET_PROPS,
} from './AdmissionTicket';

const meta = {
  title: 'Components/Admission Ticket',
  component: AdmissionTicket,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 'min(720px, calc(100vw - 48px))' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    rotation: { control: { type: 'range', min: -10, max: 10, step: 0.25 } },
    color: { control: 'inline-radio', options: ADMISSION_TICKET_COLORS },
  },
  args: {
    ...TOUR_ADMISSION_TICKET_PROPS,
    rotation: DEFAULT_ADMISSION_TICKET_ROTATION,
    color: DEFAULT_ADMISSION_TICKET_COLOR,
  },
} satisfies Meta<typeof AdmissionTicket>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The ticket as it appears in the site's live section heading. */
export const TourHeading: Story = {};

export const SingleShow: Story = {
  args: {
    title: 'OLIVE’S',
    subtitle: 'Nyack, New York',
    seasonYear: '18',
    seasonLabel: 'Sep · Fri',
    location: '118 Main Street',
    detail: 'Doors 7:00 PM · Set 8:00 PM',
    admission: 'Artist',
    serial: '000118',
    price: '$20.00',
    priceSerial: 'FA 0918',
    color: 'purple',
  },
};

export const Tilted: Story = {
  args: { rotation: -2.5 },
};

export const Small: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
};

export const Inks: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '2.5rem' }}>
      {ADMISSION_TICKET_COLORS.map((color) => (
        <AdmissionTicket key={color} {...args} color={color} />
      ))}
    </div>
  ),
};

export const Stack: Story = {
  render: (args) => (
    <div style={{ position: 'relative', height: 420 }}>
      <div style={{ position: 'absolute', inset: '0 auto auto 0', width: '78%' }}>
        <AdmissionTicket {...args} rotation={-4} color="blue" serial="004267" />
      </div>
      <div style={{ position: 'absolute', inset: '70px auto auto 60px', width: '78%' }}>
        <AdmissionTicket {...args} rotation={2} color="green" serial="004268" />
      </div>
      <div style={{ position: 'absolute', inset: '150px auto auto 120px', width: '78%' }}>
        <AdmissionTicket {...args} rotation={-1} serial="004269" />
      </div>
    </div>
  ),
};
