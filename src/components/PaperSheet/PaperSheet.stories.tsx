import type { Meta, StoryObj } from '@storybook/react-vite';
import festivalSketch from '../../../assets/festival-scribble-fully-shaded.png';
import { OLIVES_TOUR_PASS_PROPS, TourPass } from '../TourPass/TourPass';
import { Pin } from '../Pin/Pin';
import { PAPER_SHEET_IMAGE_DEFAULTS, PAPER_STOCKS, PaperSheet, type PaperSheetProps } from './PaperSheet';

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
    imageSrc: { control: 'text' },
    imageSize: { control: 'text' },
    imagePosition: { control: 'text' },
    imageOpacity: { control: { type: 'range', min: 0, max: 1, step: 0.02 } },
    imageContrast: { control: { type: 'range', min: 0.5, max: 3, step: 0.05 } },
  },
  args: {
    stock: 'wheat',
    height: 900,
    surround: 10,
    imageSrc: '',
    imageSize: PAPER_SHEET_IMAGE_DEFAULTS.size,
    imagePosition: PAPER_SHEET_IMAGE_DEFAULTS.position,
    imageOpacity: PAPER_SHEET_IMAGE_DEFAULTS.opacity,
    imageContrast: PAPER_SHEET_IMAGE_DEFAULTS.contrast,
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PaperSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The home page hero's crop of the festival sketch. */
const heroSketch: Partial<PaperSheetProps> = { imageSrc: festivalSketch, imagePosition: 'center 66%' };

function pinnedPasses(args: PaperSheetProps) {
  return (
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
  );
}

export const Empty: Story = {};

export const PinnedPasses: Story = {
  render: pinnedPasses,
};

export const InkStock: Story = {
  args: { stock: 'ink', height: 600 },
};

/** The festival sketch printed onto the stock exactly as the home page hero shows it. */
export const Sketched: Story = {
  args: heroSketch,
};

/** Pinned pieces sit above the printed sketch, like the cutouts pasted over the hero. */
export const SketchedWithPins: Story = {
  args: heroSketch,
  render: pinnedPasses,
};

/** The band section's crop: zoomed past the sheet edges and anchored to the top of the drawing. */
export const CroppedSketch: Story = {
  args: { imageSrc: festivalSketch, imageSize: '118% auto', imagePosition: 'center top', imageOpacity: 0.9, imageContrast: 1.28 },
};
