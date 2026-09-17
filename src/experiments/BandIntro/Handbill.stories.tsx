import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import festivalSketch from '../../../assets/festival-scribble-fully-shaded.png';
import { PaperSheet } from '../../components/2D/PaperSheet/PaperSheet';
import { HANDBILL_SIDES, HANDBILL_SPOTS, HANDBILL_STOCKS, Handbill } from './Handbill';
import { BAND_HANDBILL_BACK, BAND_HANDBILL_FRONT } from './Handbill.band';

const meta = {
  title: 'Experiments/Band Introduction/Handbill',
  component: Handbill,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    stock: { control: 'inline-radio', options: HANDBILL_STOCKS },
    spot: { control: 'inline-radio', options: HANDBILL_SPOTS },
    side: { control: 'inline-radio', options: HANDBILL_SIDES },
    rotation: { control: { type: 'range', min: -20, max: 20, step: 0.5 } },
    duration: { control: { type: 'range', min: 200, max: 3000, step: 50 } },
    front: { control: false },
    back: { control: false },
  },
  args: {
    front: BAND_HANDBILL_FRONT,
    back: BAND_HANDBILL_BACK,
    stock: 'goldenrod',
    spot: 'red',
    side: 'front',
    rotation: -2,
    duration: 900,
    onTurn: fn(),
  },
  decorators: [
    (Story, context) =>
      context.parameters.composition ? (
        <Story />
      ) : (
        <div style={{ padding: 56, background: '#ead3a7' }}>
          <div style={{ width: 380, maxWidth: '100%' }}>
            <Story />
          </div>
        </div>
      ),
  ],
} satisfies Meta<typeof Handbill>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The band's handbill, front up. Click it to turn it over. */
export const Front: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status').textContent).toBe('Front of the handbill');
    await expect(canvas.getByRole('heading', { name: /Funkadelic\s*Astronaut/ })).toBeVisible();
  },
};

/** The reverse: the bio and the live photo in one ink. */
export const Back: Story = {
  args: { side: 'back' },
};

/** Turned over by hand: the status follows the card and the callback fires once it has settled. */
export const Turned: Story = {
  args: { duration: 600 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const turn = canvas.getByRole('button', { name: 'Turn the handbill over' });
    await userEvent.click(turn);
    await expect(canvas.getByRole('status').textContent).toBe('Turning the handbill');
    // A second click while it is in the air does nothing.
    await userEvent.click(turn);
    await waitFor(() => expect(canvas.getByRole('status').textContent).toBe('Back of the handbill'), { timeout: 2000 });
    await expect(args.onTurn).toHaveBeenCalledTimes(1);
    await expect(args.onTurn).toHaveBeenCalledWith('back');
    await expect(canvas.getByRole('button', { name: 'Turn the handbill back' })).toBeInTheDocument();
  },
};

/** The same job run on every stock the shop keeps, each in a different second ink. */
export const Stocks: Story = {
  parameters: { composition: true },
  render: (args) => (
    <div style={{ display: 'flex', gap: 36, padding: 56, background: '#ead3a7', flexWrap: 'wrap', justifyContent: 'center' }}>
      {HANDBILL_STOCKS.map((stock, index) => (
        <div key={stock} style={{ width: 260 }}>
          <Handbill {...args} stock={stock} spot={HANDBILL_SPOTS[index % HANDBILL_SPOTS.length]} rotation={(index % 3) - 1} />
        </div>
      ))}
    </div>
  ),
};

/** A stack of them left on the desk beside the dossier. */
export const OnDesk: Story = {
  parameters: { composition: true, layout: 'fullscreen' },
  render: (args) => (
    <PaperSheet height={0} imageSrc={festivalSketch} imageSize="118% auto" imagePosition="center top" imageOpacity={0.9} imageContrast={1.28}>
      <div style={{ padding: '8% 12%', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 380, maxWidth: '100%' }}>
          <Handbill {...args} rotation={-4} />
        </div>
      </div>
    </PaperSheet>
  ),
};
