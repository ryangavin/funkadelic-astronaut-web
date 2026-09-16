import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import festivalSketch from '../../../assets/festival-scribble-fully-shaded.png';
import { PaperSheet } from '../../components/PaperSheet/PaperSheet';
import { MiniZine, ZINE_SPREADS, ZINE_STOCKS } from './MiniZine';
import { BAND_ZINE_PAGES } from './MiniZine.band';

const meta = {
  title: 'Experiments/Band Introduction/Mini Zine',
  component: MiniZine,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    stock: { control: 'inline-radio', options: ZINE_STOCKS },
    spread: { control: { type: 'range', min: 0, max: ZINE_SPREADS, step: 1 } },
    rotation: { control: { type: 'range', min: -20, max: 20, step: 0.5 } },
    duration: { control: { type: 'range', min: 200, max: 3000, step: 50 } },
    pages: { control: false },
  },
  args: {
    pages: BAND_ZINE_PAGES,
    stock: 'white',
    spread: 0,
    rotation: -1.5,
    duration: 800,
    onTurn: fn(),
  },
  decorators: [
    (Story, context) =>
      context.parameters.composition ? (
        <Story />
      ) : (
        <div style={{ padding: 56, background: '#ead3a7' }}>
          <div style={{ width: 640, maxWidth: '100%' }}>
            <Story />
          </div>
        </div>
      ),
  ],
} satisfies Meta<typeof MiniZine>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Closed on the desk. Click the cover to open it; the arrow keys turn pages too. */
export const Cover: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status').textContent).toBe('Cover');
    await expect(canvas.getByRole('button', { name: 'Turn the page' })).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Turn back' })).toBeNull();
  },
};

/** Open at the first spread: who they are, and the live shot. */
export const TheBand: Story = {
  args: { spread: 1 },
};

/** The members, a page each. */
export const Members: Story = {
  args: { spread: 2 },
};

/** The dates and the back. */
export const Dates: Story = {
  args: { spread: 3 },
};

/** Closed the other way. */
export const BackCover: Story = {
  args: { spread: 4 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status').textContent).toBe('Back cover');
    await expect(canvas.queryByRole('button', { name: 'Turn the page' })).toBeNull();
  },
};

/** Read through by hand: a page turns, the status follows, and a turn back closes it again. */
export const ReadThrough: Story = {
  args: { duration: 500 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Turn the page' }));
    await expect(canvas.getByRole('status').textContent).toBe('Turning the page');
    await waitFor(() => expect(canvas.getByRole('status').textContent).toBe('Pages 2 and 3 of 8'), { timeout: 2000 });
    await expect(args.onTurn).toHaveBeenLastCalledWith(1);
    await expect(canvas.getByRole('heading', { name: /Three friends\.\s*One orbit\./ })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Turn back' }));
    await waitFor(() => expect(canvas.getByRole('status').textContent).toBe('Cover'), { timeout: 2000 });
    await expect(args.onTurn).toHaveBeenLastCalledWith(0);
  },
};

/** The same master run on every ream in the shop. */
export const Stocks: Story = {
  parameters: { composition: true },
  render: (args) => (
    <div style={{ display: 'flex', gap: 40, padding: 56, background: '#ead3a7', flexWrap: 'wrap', justifyContent: 'center' }}>
      {ZINE_STOCKS.map((stock, index) => (
        <div key={stock} style={{ width: 300 }}>
          <MiniZine {...args} stock={stock} spread={0} rotation={(index % 3) - 1} />
        </div>
      ))}
    </div>
  ),
};

/** Left open on the desk beside the dossier. */
export const OnDesk: Story = {
  parameters: { composition: true, layout: 'fullscreen' },
  args: { spread: 1, rotation: -3 },
  render: (args) => (
    <PaperSheet height={0} imageSrc={festivalSketch} imageSize="118% auto" imagePosition="center top" imageOpacity={0.9} imageContrast={1.28}>
      <div style={{ padding: '8% 10%', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 720, maxWidth: '100%' }}>
          <MiniZine {...args} />
        </div>
      </div>
    </PaperSheet>
  ),
};
