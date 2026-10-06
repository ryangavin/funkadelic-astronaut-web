import type { Meta, StoryObj } from '@storybook/react-vite';
import { TourPasses, TOUR_PASSES_LAYOUT } from './TourPasses';

const meta = {
  title: 'Experience/Sections/Tour Passes',
  component: TourPasses,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  decorators: [(Story) => <div style={{ padding: 24, background: '#ead3a7' }}><Story /></div>],
  argTypes: Object.fromEntries(Object.keys(TOUR_PASSES_LAYOUT).map((key) => [key, {
    control: { type: 'range', min: key.endsWith('Rotation') ? -12 : key.endsWith('Width') ? 200 : -100,
      max: key.endsWith('Rotation') ? 12 : key.endsWith('Width') ? 420 : 1300, step: key.endsWith('Rotation') ? 0.25 : 1 },
    table: { category: key.startsWith('olives') ? 'Olive’s' : key.startsWith('nyack') ? 'Nyack festival' : 'Saturn Lanes' },
  }])),
  args: { ...TOUR_PASSES_LAYOUT },
} satisfies Meta<typeof TourPasses>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TourRow: Story = {
  args: {
    nyackX: 443,
    nyackWidth: 416
  },
};
