import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import festivalSketch from '../../../assets/festival-scribble-fully-shaded.png';
import { FOLDER_STOCKS } from '../../components/Folder/Folder';
import { PaperSheet } from '../../components/PaperSheet/PaperSheet';
import { BandDossier, DOSSIER_PLACEMENT } from './BandDossier';

const percent = (category: string, min = 0, max = 100) => (({
  control: { type: 'range', min, max, step: 0.5 },
  table: { category }
}) as const);
const degrees = (category: string) => (({
  control: { type: 'range', min: -20, max: 20, step: 0.5 },
  table: { category }
}) as const);

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
    proofWidth: percent('Print', 40, 120),
    proofX: percent('Print', -20, 40),
    proofY: percent('Print', -20, 40),
    proofRotation: degrees('Print'),
    deckWidth: percent('Player', 30, 100),
    deckX: percent('Player', -20, 60),
    deckY: percent('Player', -20, 60),
    deckRotation: degrees('Player'),
    wellWidth: percent('Well', 40, 125),
    wellX: percent('Well', -10, 40),
    wellGap: percent('Well', 0, 20),
    pileRotation: degrees('Well'),
    bandRotation: degrees('Well'),
  },
  args: { open: true, rotation: -1, initial: 0, spread: 1.1, duration: 900, ...DOSSIER_PLACEMENT },
} satisfies Meta<typeof BandDossier>;

export default meta;
type Story = StoryObj<typeof meta>;

const topItem = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>('.stack__item')].reduce((top, item) => (Number(item.style.zIndex) > Number(top.style.zIndex) ? item : top));

/** The section as it will sit on the site: the package open on the sketched desk. */
export const OnDesk: Story = {
  render: (args) => (
    <PaperSheet height={0} imageSrc={festivalSketch} imageSize="118% auto" imagePosition="center top" imageOpacity={0.9} imageContrast={1.28}>
      <div style={{ padding: '10% 13% 23% 8%' }}>
        <BandDossier {...args} />
      </div>
    </PaperSheet>
  ),

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(topItem(canvasElement).textContent).toContain('Ryan Gavin');
    await userEvent.click(canvas.getByRole('button', { name: 'Bring Sam Luba to the front' }));
    await waitFor(() => expect(topItem(canvasElement).textContent).toContain('Sam Luba'), { timeout: 2000 });
    const pile = within(canvas.getByRole('region', { name: 'Meet the band' }));
    await expect(pile.getByRole('status').textContent).toBe('Sam Luba · 3 of 3');
    await expect(canvas.getByRole('group', { name: 'Cassette player: Spacewalk (demo)' })).toBeInTheDocument();
  }
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

/** Exercises the whole flight across the crease, including Kevin's leftward pull. */
export const SpineCrossing: Story = {
  ...OnDesk,
  args: { duration: 900 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument;
    const win = doc.defaultView!;
    const cover = canvasElement.querySelector('.folder__cover')!;
    const spine = canvasElement.querySelector('.folder__spine')!;
    const well = canvasElement.querySelector('.folder__well')!;
    await expect(Number(win.getComputedStyle(well).zIndex)).toBeGreaterThan(Number(win.getComputedStyle(spine).zIndex));

    const flights = [
      { name: 'Sam Luba', next: 'Sam Luba', toBack: false },
      { name: 'Kevin O’Neill', next: 'Kevin O’Neill', toBack: false },
      { name: 'Ryan Gavin', next: 'Ryan Gavin', toBack: false },
      { name: 'Ryan Gavin', next: 'Kevin O’Neill', toBack: true },
      { name: 'Kevin O’Neill', next: 'Sam Luba', toBack: true },
      { name: 'Sam Luba', next: 'Ryan Gavin', toBack: true },
    ];
    for (const { name, next, toBack } of flights) {
      const card = canvas.getByRole('button', { name: toBack ? `${name}, on top. Show the next card` : `Bring ${name} to the front` });
      await userEvent.click(card);
      let crossings = 0;
      let occlusions = 0;
      const start = win.performance.now();
      // Sample every rendered frame through the flight, not just the final slot.
      await new Promise<void>((resolve) => {
        const sample = () => {
          const bounds = card.getBoundingClientRect();
          const x = spine.getBoundingClientRect().left - 8;
          for (let y = Math.max(0, bounds.top) + 8; y < Math.min(win.innerHeight, bounds.bottom); y += 12) {
            const layers = doc.elementsFromPoint(x, y);
            const cardAt = layers.indexOf(card);
            if (cardAt < 0) continue;
            crossings++;
            const coverAt = layers.findIndex((element) => cover.contains(element));
            if (coverAt >= 0 && coverAt < cardAt) occlusions++;
          }
          if (win.performance.now() - start < 1000) win.requestAnimationFrame(sample);
          else resolve();
        };
        win.requestAnimationFrame(sample);
      });
      if (!toBack && !win.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        await expect(crossings, `${name} crosses the spine during the flight`).toBeGreaterThan(0);
      }
      await expect(occlusions, `${name} stays above the cover throughout the flight`).toBe(0);
      await expect(topItem(canvasElement).textContent).toContain(next);
    }
  },
};
