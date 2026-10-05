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
    // Booking is written out twice: in the pitch at the top and in the spec strip where a reader finishes.
    const booking = page.getAllByRole('link', { name: 'samluba1@gmail.com' });
    await expect(booking).toHaveLength(2);
    for (const link of booking) await expect(link).toHaveAttribute('href', expect.stringMatching(/^mailto:samluba1@gmail\.com/));
    await expect(page.getAllByRole('button', { name: 'Copy' })).toHaveLength(2);
  },
};

/** The video is a still until it is asked for, then YouTube's player with sound. */
export const PlayingTheVideo: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await userEvent.click(page.getByRole('button', { name: /^Play / }));
    await expect(page.getByTitle(/live at Barrier Brewing/i)).toHaveAttribute('src', expect.stringContaining('youtube-nocookie.com/embed/iVZmXA27KfA'));
  },
};

export const Tablet: Story = { globals: { viewport: { value: 'tablet' } } };
export const Phone: Story = { globals: { viewport: { value: 'phone' } } };
