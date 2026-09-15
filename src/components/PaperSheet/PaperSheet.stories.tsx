import type { Meta, StoryObj } from '@storybook/react-vite';
import { OLIVES_TOUR_PASS_PROPS, TourPass } from '../TourPass/TourPass';
import { Pin } from '../Pin/Pin';
import { PAPER_STOCKS, PaperSheet } from './PaperSheet';

const meta = {
  title: 'Layout/Paper Sheet',
  component: PaperSheet,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    stock: { control: 'inline-radio', options: PAPER_STOCKS },
    height: { control: { type: 'range', min: 0, max: 1600, step: 10 } },
    surround: { control: { type: 'range', min: 0, max: 40, step: 1 } },
  },
  args: {
    stock: 'wheat',
    height: 900,
    surround: 10,
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PaperSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const PinnedPasses: Story = {
  render: (args) => (
    <PaperSheet {...args}>
      <Pin x={80} y={120} width={420} rotation={-2}>
        <TourPass {...OLIVES_TOUR_PASS_PROPS} rotation={0} />
      </Pin>
      <Pin x={520} y={180} width={420} rotation={1.5}>
        <TourPass {...OLIVES_TOUR_PASS_PROPS} rotation={0} color="blue" tierLabel="GA pass" />
      </Pin>
      <Pin x={960} y={110} width={420} rotation={-1}>
        <TourPass {...OLIVES_TOUR_PASS_PROPS} rotation={0} color="purple" tierLabel="VIP pass" />
      </Pin>
    </PaperSheet>
  ),
};

export const InkStock: Story = {
  args: { stock: 'ink', height: 600 },
};
