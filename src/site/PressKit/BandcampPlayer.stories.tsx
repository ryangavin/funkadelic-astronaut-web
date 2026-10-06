import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { renderToString } from 'react-dom/server';
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

/** The frames in the story and the placeholder that holds their place: once mounted, one frame and no placeholder. */
const expectOneFrame = async (canvasElement: HTMLElement) => {
  await expect(canvasElement.querySelectorAll('iframe')).toHaveLength(1);
  await expect(canvasElement.querySelector('.bandcamp-player__placeholder')).toBeNull();
};

/** On its own: the featured release from src/content/releases, with its whole track list. */
export const Featured: Story = {
  play: async ({ canvasElement }) => {
    const player = await playerOf(canvasElement, FEATURED_RELEASE);
    await expectOneFrame(canvasElement);
    await expect(player).toHaveAttribute('src', expect.stringContaining(`/album=${FEATURED_RELEASE.albumId}/`));
    await expect(player).toHaveAttribute('src', expect.stringContaining('/tracklist=true/'));
  },
};

/**
 * As pre-rendered, before any script has run: a placeholder of the player's size and, for a visitor without
 * JavaScript, the full player inside <noscript>; no frame outside it, so Bandcamp is only asked once the embed is decided.
 */
export const PreRendered: Story = {
  args: { fit: true },
  decorators: [room(300)],
  play: async ({ canvasElement }) => {
    const html = renderToString(<BandcampPlayer fit />);
    const parsed = document.createElement('div');
    parsed.innerHTML = html;
    await expect(parsed.querySelector('.bandcamp-player__placeholder')).not.toBeNull();
    const noscript = parsed.querySelector('noscript');
    await expect(noscript).not.toBeNull();
    // A <noscript> parsed with scripting on holds its markup as text.
    await expect(noscript?.textContent).toContain(`src="https://bandcamp.com/EmbeddedPlayer/album=${FEATURED_RELEASE.albumId}/`);
    await expect(noscript?.textContent).toContain('/tracklist=true/');
    await expect(noscript?.textContent).toContain(`title="${t('pressKit.bandcamp.title', { title: FEATURED_RELEASE.title })}"`);
    await expect(parsed.querySelectorAll('iframe')).toHaveLength(0);
    // Mounted, the fitted player in a short box is the cover alone from its first frame: one frame, one load.
    await expectOneFrame(canvasElement);
    await expect(await playerOf(canvasElement, FEATURED_RELEASE)).toHaveAttribute('src', expect.stringContaining('/minimal=true/'));
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

/**
 * Fitted to a box with room for the cover and a few tracks: the full player. A visual reference only:
 * here the fitted player behaves as an unfitted one, so FittedShort is the story that tests fitting.
 */
export const FittedTall: Story = {
  args: { fit: true },
  decorators: [room(900)],
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
