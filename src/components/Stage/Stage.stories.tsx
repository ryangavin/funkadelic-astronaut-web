import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { PaperSheet } from '../PaperSheet/PaperSheet';
import { Pin } from '../Pin/Pin';
import { Wordmark } from '../Wordmark/Wordmark';
import { STAGE_WIDTH, Stage } from './Stage';

const meta = {
  title: 'Layout/Stage',
  component: Stage,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: {
    width: { control: { type: 'range', min: 320, max: 2560, step: 10 } },
    minScale: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    maxScale: { control: { type: 'range', min: 0.5, max: 3, step: 0.05 } },
  },
  args: { width: STAGE_WIDTH, minScale: 0, maxScale: Infinity },
} satisfies Meta<typeof Stage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Sheet-unit pieces (Pin, PaperSheet) and pixel pieces (Wordmark) on one sheet; resize the preview and they scale together. */
const ruler = (args: Story['args']) => (
  <Stage {...args}>
    <PaperSheet height={560}>
      <Pin x={72} y={64}>
        <Wordmark fontSize={120} rotation={-2}>
          1440 WIDE
        </Wordmark>
      </Pin>
      <Pin x={72} y={300} width={600}>
        <div style={{ font: '400 24px/1.4 var(--font-body)', maxWidth: 600 }}>
          This sheet is laid out at {args?.width ?? STAGE_WIDTH} design pixels. Everything on it, whether it measures itself in sheet units or in plain
          pixels, is scaled as one piece to the width it is shown at: narrow the preview and the words shrink with their positions, widen it and they grow.
        </div>
      </Pin>
      {[0, 360, 720, 1080, 1440].map((x) => (
        <Pin key={x} x={x - (x === 1440 ? 2 : 0)} y={0}>
          <div style={{ width: 2, height: 560, background: 'rgb(18 20 32 / 0.25)' }} />
        </Pin>
      ))}
      {[360, 720, 1080].map((x) => (
        <Pin key={x} x={x + 8} y={520}>
          <span style={{ font: '400 16px/1 var(--font-body)', opacity: 0.6 }}>{x}</span>
        </Pin>
      ))}
    </PaperSheet>
  </Stage>
);

/** The default: 1440 design pixels, scaled to fill whatever it is shown in. */
export const Ruler: Story = {
  render: ruler,
  play: async ({ canvasElement }) => {
    const stage = canvasElement.querySelector<HTMLElement>('.stage')!;
    const sheet = canvasElement.querySelector<HTMLElement>('.stage__sheet')!;
    await waitFor(() => expect(Number(getComputedStyle(sheet).zoom)).toBeCloseTo(stage.clientWidth / STAGE_WIDTH, 3));
    // The sheet lays out at its design width and the zoom brings it to the stage's width.
    await expect(sheet.getBoundingClientRect().width).toBeCloseTo(stage.clientWidth, 0);
  },
};

/** Capped so a wide monitor gets the composition at most half again as large. */
export const Capped: Story = {
  args: { maxScale: 1.5 },
  render: ruler,
};

/** A floor: below 720 wide the page stops shrinking and scrolls sideways instead. */
export const Floored: Story = {
  args: { minScale: 0.5 },
  render: ruler,
  globals: { viewport: { value: 'phone' } },
  parameters: { viewport: { options: { phone: { name: 'Phone', styles: { width: '390px', height: '844px' }, type: 'mobile' } } } },
};
