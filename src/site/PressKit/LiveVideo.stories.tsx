import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { NYACK_SET } from '../../content/liveSet';
import { Copy, t } from '../../i18n/copy';
import { LiveVideo } from './LiveVideo';

const live = { event: NYACK_SET.event };
const title = t('pressKit.live.title', live);

/** A YouTube link for the player's other path. The live set itself is served from the site, so this id is made up: only the URL built from it is checked. */
const YOUTUBE_ID = 'FAlive20260';

const meta = {
  title: 'Site/Live Video',
  component: LiveVideo,
  decorators: [
    Story => (
      <div className="epk" style={{ maxWidth: 960 }}>
        <Story />
      </div>
    ),
  ],
  parameters: { a11y: { test: 'error' } },
  args: {
    video: NYACK_SET.video,
    loop: NYACK_SET.loop,
    poster: NYACK_SET.poster,
    title,
    label: <Copy k="pressKit.live.label" values={live} />,
  },
} satisfies Meta<typeof LiveVideo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Answers every prefers-reduced-motion query with "reduce" while the story is open. */
const reduceMotion = () => {
  const original = window.matchMedia;
  window.matchMedia = query => original.call(window, query.includes('prefers-reduced-motion') ? 'all' : query);
  return () => {
    window.matchMedia = original;
  };
};

/** Before anyone asks: the silent cut from src/content/liveSet loops behind one button, and no player is mounted. */
export const Hero: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await expect(page.getByRole('button', { name: `${t('pressKit.live.watch')} ${title}` })).toBeVisible();
    // The label prints its inline markup as words.
    const label = t('pressKit.live.label', live).replace(/<\/?span>/g, '');
    const squash = (text: string | null | undefined) => (text ?? '').replace(/\s+/g, ' ').trim();
    await expect(
      page.getByText((_, element) => !!element && squash(element.textContent) === label && ![...element.children].some(child => squash(child.textContent) === label)),
    ).toBeVisible();
    const loop = canvasElement.querySelector('video');
    await expect(loop).toHaveAttribute('src', NYACK_SET.loop);
    await expect(loop).toHaveAttribute('poster', NYACK_SET.poster);
    await expect(loop).toHaveAttribute('aria-hidden', 'true');
    await expect(page.queryByLabelText(title)).toBeNull();
    await expect(canvasElement.querySelector('iframe')).toBeNull();
  },
};

/** A click swaps in the whole set from src/content/liveSet, with sound and controls, and keeps focus on it. */
export const ClickToWatch: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await userEvent.click(page.getByRole('button', { name: new RegExp(`^${t('pressKit.live.watch')}`) }));
    const player = await page.findByLabelText(title);
    await expect(player.tagName).toBe('VIDEO');
    await expect(player).toHaveAttribute('src', NYACK_SET.video);
    await expect(player).toHaveAttribute('controls');
    await expect((player as HTMLVideoElement).muted).toBe(false);
    await expect(player).toHaveFocus();
    await expect(page.queryByRole('button')).toBeNull();
  },
};

/** From the keyboard: Tab reaches the button, Enter starts the set, and focus lands on the player. */
export const EnterToWatch: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await userEvent.tab();
    await expect(page.getByRole('button')).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    const player = await page.findByLabelText(title);
    await expect(player).toHaveAttribute('src', NYACK_SET.video);
    await expect(player).toHaveFocus();
  },
};

/** Space presses the button too. */
export const SpaceToWatch: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    page.getByRole('button').focus();
    await userEvent.keyboard(' ');
    await expect(await page.findByLabelText(title)).toHaveAttribute('src', NYACK_SET.video);
  },
};

/** Anyone who asks for reduced motion gets the still and a Play button: nothing moves until they press it. */
export const ReducedMotion: Story = {
  beforeEach: reduceMotion,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await expect(canvasElement.querySelector('video')).toBeNull();
    await expect(canvasElement.querySelector('img')).toHaveAttribute('src', NYACK_SET.poster);
    await userEvent.click(page.getByRole('button', { name: `${t('pressKit.live.play')} ${title}` }));
    await expect(await page.findByLabelText(title)).toHaveAttribute('src', NYACK_SET.video);
  },
};

/** Given a YouTube link instead of a file, the press mounts YouTube's privacy-enhanced player for that video, starting at once. */
export const YouTubeLink: Story = {
  args: { video: `https://www.youtube.com/watch?v=${YOUTUBE_ID}` },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await expect(canvasElement.querySelector('iframe')).toBeNull();
    await userEvent.click(page.getByRole('button'));
    const player = await page.findByTitle(title);
    await expect(player.tagName).toBe('IFRAME');
    await expect(player).toHaveAttribute('src', `https://www.youtube-nocookie.com/embed/${YOUTUBE_ID}?autoplay=1&playsinline=1&rel=0`);
    await expect(player).toHaveFocus();
  },
};
