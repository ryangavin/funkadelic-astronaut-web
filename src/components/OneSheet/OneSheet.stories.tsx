import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import festivalSketch from '../../../assets/festival-scribble-fully-shaded.png';
import { PaperSheet } from '../../components/PaperSheet/PaperSheet';
import { ONE_SHEET_STOCKS, OneSheet } from './OneSheet';
import { BAND_ONE_SHEET_BOTTOM, BAND_ONE_SHEET_MIDDLE, BAND_ONE_SHEET_TOP } from '../../sections/BandDossier/bandOneSheet';

const meta = {
  title: 'Components/One-Sheet',
  component: OneSheet,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    stock: { control: 'inline-radio', options: ONE_SHEET_STOCKS },
    rotation: { control: { type: 'range', min: -20, max: 20, step: 0.5 } },
    duration: { control: { type: 'range', min: 200, max: 3000, step: 50 } },
    top: { control: false },
    middle: { control: false },
    bottom: { control: false },
  },
  args: {
    top: BAND_ONE_SHEET_TOP,
    middle: BAND_ONE_SHEET_MIDDLE,
    bottom: BAND_ONE_SHEET_BOTTOM,
    stock: 'bond',
    open: false,
    rotation: -1,
    duration: 900,
    onToggle: fn(),
  },
  decorators: [
    (Story, context) =>
      context.parameters.composition ? (
        <Story />
      ) : (
        <div style={{ padding: 56, background: '#ead3a7' }}>
          <div style={{ width: 520, maxWidth: '100%' }}>
            <Story />
          </div>
        </div>
      ),
  ],
} satisfies Meta<typeof OneSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Folded, as it comes out of the envelope: the letterhead and the first paragraph. Click to unfold. */
export const Folded: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status').textContent).toBe('Folded: the top panel shows');
    await expect(canvas.getByRole('button', { name: 'Unfold the one-sheet' })).toHaveAttribute('aria-expanded', 'false');
  },
};

/** Flat on the desk. */
export const Unfolded: Story = {
  args: { open: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status').textContent).toBe('Unfolded');
    await expect(canvas.getByRole('link', { name: 'Booking: samluba1@gmail.com' })).toBeVisible();
  },
};

/** Pulled open and folded back by hand: the status follows and the callback fires once it settles. */
export const Handled: Story = {
  args: { duration: 400 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Unfold the one-sheet' }));
    await expect(canvas.getByRole('status').textContent).toBe('Unfolding');
    await waitFor(() => expect(canvas.getByRole('status').textContent).toBe('Unfolded'), { timeout: 2000 });
    await expect(args.onToggle).toHaveBeenLastCalledWith(true);
    await userEvent.click(canvas.getByRole('button', { name: 'Fold the one-sheet' }));
    await waitFor(() => expect(canvas.getByRole('status').textContent).toBe('Folded: the top panel shows'), { timeout: 2000 });
    await expect(args.onToggle).toHaveBeenLastCalledWith(false);
  },
};

/** The same file printed on the three papers in the tray. */
export const Stocks: Story = {
  parameters: { composition: true },
  render: (args) => (
    <div style={{ display: 'flex', gap: 40, padding: 56, background: '#ead3a7', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start' }}>
      {ONE_SHEET_STOCKS.map((stock, index) => (
        <div key={stock} style={{ width: 340 }}>
          <OneSheet {...args} stock={stock} open rotation={(index % 3) - 1} />
        </div>
      ))}
    </div>
  ),
};

/** Unfolded on the desk beside the dossier. */
export const OnDesk: Story = {
  parameters: { composition: true, layout: 'fullscreen' },
  args: { open: true, rotation: -2.5 },
  render: (args) => (
    <PaperSheet height={0} imageSrc={festivalSketch} imageSize="118% auto" imagePosition="center top" imageOpacity={0.9} imageContrast={1.28}>
      <div style={{ padding: '8% 10%', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 560, maxWidth: '100%' }}>
          <OneSheet {...args} />
        </div>
      </div>
    </PaperSheet>
  ),
};
