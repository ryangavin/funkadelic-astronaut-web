import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import festivalSketch from '../../../assets/festival-scribble-fully-shaded.png';
import { FOLDER_STOCKS } from '../../components/Folder/Folder';
import { PaperSheet } from '../../components/PaperSheet/PaperSheet';
import { BandDossier } from './BandDossier';

const meta = {
  title: 'Sections/Band Dossier',
  component: BandDossier,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: {
    stock: { control: 'inline-radio', options: FOLDER_STOCKS },
    label: { control: 'text' },
    rotation: { control: { type: 'range', min: -6, max: 6, step: 0.5 } },
    initial: { control: { type: 'range', min: 0, max: 2, step: 1 } },
    spread: { control: { type: 'range', min: 0.5, max: 1.4, step: 0.05 } },
    duration: { control: { type: 'range', min: 200, max: 2400, step: 50 } },
  },
  args: { open: true, rotation: -1, initial: 0, spread: 0.9, duration: 900 },
} satisfies Meta<typeof BandDossier>;

export default meta;
type Story = StoryObj<typeof meta>;

const topItem = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>('.stack__item')].reduce((top, item) => (Number(item.style.zIndex) > Number(top.style.zIndex) ? item : top));

/** The section as it will sit on the site: the package open on the sketched desk. */
export const OnDesk: Story = {
  render: (args) => (
    <PaperSheet height={0} imageSrc={festivalSketch} imageSize="118% auto" imagePosition="center top" imageOpacity={0.9} imageContrast={1.28}>
      <div style={{ padding: '6% 7% 6% 5%' }}>
        <BandDossier {...args} />
      </div>
    </PaperSheet>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(topItem(canvasElement).textContent).toContain('Ryan Gavin');
    await userEvent.click(canvas.getByRole('button', { name: 'Bring Sam Luba to the front' }));
    await waitFor(() => expect(topItem(canvasElement).textContent).toContain('Sam Luba'), { timeout: 2000 });
    await expect(canvas.getByRole('status').textContent).toBe('Sam Luba · 3 of 3');
  },
};

/** The folder alone, on plain paper. */
export const Folder: Story = {
  render: (args) => (
    <div style={{ padding: '72px 64px', background: '#ead3a7' }}>
      <div style={{ width: 1100, maxWidth: '100%', margin: 'auto' }}>
        <BandDossier {...args} />
      </div>
    </div>
  ),
};

/** Closed on the desk, sticker up. */
export const Closed: Story = {
  args: { open: false },
  render: (args) => (
    <div style={{ padding: '72px 64px', background: '#ead3a7' }}>
      <div style={{ width: 1100, maxWidth: '100%', margin: 'auto' }}>
        <BandDossier {...args} />
      </div>
    </div>
  ),
};
