import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Epk } from './Epk';
import { FEATURED_RELEASE } from './BandcampPlayer';

/* The breakpoints either side: the poster from 1080, stacked columns from 680, one column below. */
const viewports = {
  design: { name: 'Design 1440', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
  laptop: { name: 'Laptop 1080', styles: { width: '1080px', height: '800px' }, type: 'desktop' },
  tablet: { name: 'Tablet 834', styles: { width: '834px', height: '1194px' }, type: 'tablet' },
  phone: { name: 'Phone 390', styles: { width: '390px', height: '844px' }, type: 'mobile' },
} as const;

const meta = {
  title: 'Pages/EPK',
  component: Epk,
  parameters: { layout: 'fullscreen', viewport: { options: viewports } },
} satisfies Meta<typeof Epk>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The live site: the press kit as one printed poster. */
export const Poster: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await expect(page.getByRole('heading', { level: 1, name: /Funkadelic Astronaut/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Three friends/i })).toBeVisible();
    for (const name of ['Ryan Gavin', 'Kevin O’Neill', 'Sam Luba']) await expect(page.getByRole('heading', { level: 3, name: new RegExp(name) })).toBeVisible();
    await expect(page.getByTitle(/on Bandcamp/i)).toHaveAttribute('src', expect.stringContaining(`album=${FEATURED_RELEASE.albumId}`));
    // The foot offers the booking email; the masthead's Book us jumps to it.
    await expect(page.getByRole('link', { name: 'Book The Band' })).toHaveAttribute('href', expect.stringMatching(/^mailto:samluba1@gmail\.com/));
    await expect(page.getByRole('link', { name: 'Book us' })).toHaveAttribute('href', '#book');
    await expect(page.getByRole('link', { name: /on Instagram/ })).toBeVisible();
  },
};

/** The hero plays muted; one press swaps in YouTube's player with sound and controls. */
export const PlayingTheVideo: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await userEvent.click(page.getByRole('button', { name: /^(Watch with sound|Play) / }));
    const player = page.getByTitle(/live at Barrier Brewing Co\.$/i);
    await expect(player).toHaveAttribute('src', expect.stringContaining('youtube-nocookie.com/embed/iVZmXA27KfA'));
    await expect(player).toHaveAttribute('src', expect.not.stringContaining('mute=1'));
  },
};

/** Pressing an earlier record puts it in the Bandcamp player; pressing the new one puts it back. */
export const PickingARecord: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    const magrathea = page.getByRole('button', { name: /^Magrathea 2018/ });
    await userEvent.click(magrathea);
    await expect(magrathea).toHaveAttribute('aria-pressed', 'true');
    await expect(magrathea).toHaveTextContent('2018 · Playing');
    await expect(page.getByTitle(/^Magrathea by Funkadelic Astronaut/)).toHaveAttribute('src', expect.stringContaining('album=3829388634'));
    await userEvent.click(page.getByRole('button', { name: new RegExp(`^${FEATURED_RELEASE.title} ${FEATURED_RELEASE.year}`) }));
    await expect(page.getByTitle(/on Bandcamp$/)).toHaveAttribute('src', expect.stringContaining(`album=${FEATURED_RELEASE.albumId}`));
  },
};

export const Tablet: Story = { globals: { viewport: { value: 'tablet' } } };
export const Phone: Story = { globals: { viewport: { value: 'phone' } } };
