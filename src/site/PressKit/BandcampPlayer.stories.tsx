import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { EARLIER_RELEASES, FEATURED_RELEASE, type BandcampRelease } from '../../content/releases';
import { t } from '../../i18n/copy';
import { BandcampPlayer } from './BandcampPlayer';

const viewports = {
  desktop: { name: 'Desktop 1200', styles: { width: '1200px', height: '900px' }, type: 'desktop' },
  phone: { name: 'Phone 390', styles: { width: '390px', height: '844px' }, type: 'mobile' },
} as const;

const meta = {
  title: 'Site/Bandcamp Player',
  component: BandcampPlayer,
  decorators: [
    Story => (
      <div className="epk" style={{ maxWidth: 400 }}>
        <Story />
      </div>
    ),
  ],
  parameters: { viewport: { options: viewports }, a11y: { test: 'error' } },
} satisfies Meta<typeof BandcampPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A box of a fixed size the fitted player must work within, as the record's row gives it. */
const room =
  (height: number): Decorator =>
  Story => (
    <div data-testid="room" style={{ display: 'flex', flexDirection: 'column', width: '100%', height }}>
      <Story />
    </div>
  );

const playerOf = async (canvasElement: HTMLElement, release: BandcampRelease) =>
  within(canvasElement).findByTitle(t('pressKit.bandcamp.title', { title: release.title }));

/** On its own: the featured release from src/content/releases, with its whole track list. */
export const Featured: Story = {
  play: async ({ canvasElement }) => {
    const player = await playerOf(canvasElement, FEATURED_RELEASE);
    await expect(player).toHaveAttribute('src', expect.stringContaining(`/album=${FEATURED_RELEASE.albumId}/`));
    await expect(player).toHaveAttribute('src', expect.stringContaining('/tracklist=true/'));
  },
};

/** Given another release, it plays that one. */
export const EarlierRelease: Story = {
  args: { release: EARLIER_RELEASES[1] },
  play: async ({ canvasElement }) => {
    const player = await playerOf(canvasElement, EARLIER_RELEASES[1]);
    await expect(player).toHaveAttribute('src', expect.stringContaining(`/album=${EARLIER_RELEASES[1].albumId}/`));
  },
};

/** Fitted to a box with room for the cover and a few tracks: the full player. */
export const FittedTall: Story = {
  args: { fit: true },
  decorators: [room(900)],
  play: async ({ canvasElement }) => {
    await expect(await playerOf(canvasElement, FEATURED_RELEASE)).toHaveAttribute('src', expect.stringContaining('/tracklist=true/'));
  },
};

/** Fitted to a box with no room for the tracks: the cover alone; growing the box brings the track list back, shrinking it takes it away. */
export const FittedShort: Story = {
  args: { fit: true },
  decorators: [room(300)],
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByTestId('room');
    await waitFor(async () => expect(await playerOf(canvasElement, FEATURED_RELEASE)).toHaveAttribute('src', expect.stringContaining('/minimal=true/')));
    box.style.height = '900px';
    await waitFor(async () => expect(await playerOf(canvasElement, FEATURED_RELEASE)).toHaveAttribute('src', expect.stringContaining('/tracklist=true/')));
    box.style.height = '300px';
    await waitFor(async () => expect(await playerOf(canvasElement, FEATURED_RELEASE)).toHaveAttribute('src', expect.stringContaining('/minimal=true/')));
  },
};

/** On a phone the player is stacked with nothing beside it, so even in a short box it keeps the whole track list. */
export const FittedOnAPhone: Story = {
  args: { fit: true },
  decorators: [room(300)],
  globals: { viewport: { value: 'phone' } },
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBe(390);
    await expect(await playerOf(canvasElement, FEATURED_RELEASE)).toHaveAttribute('src', expect.stringContaining('/tracklist=true/'));
  },
};
