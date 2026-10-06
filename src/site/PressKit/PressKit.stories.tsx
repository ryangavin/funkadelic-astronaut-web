import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { BANDCAMP_HREF, BOOKING_HREF, LISTEN_HREFS, SOCIAL_HREFS } from '../../content/links';
import { NYACK_SET } from '../../content/liveSet';
import { MEMBERS } from '../../content/members';
import { EARLIER_RELEASES, FEATURED_RELEASE } from '../../content/releases';
import { list, SHARED_STAGES } from '../../content/stages';
import { t } from '../../i18n/copy';
import { PressKit } from './PressKit';

/* The breakpoints either side: the poster from 1080, stacked columns from 680, one column below. */
const viewports = {
  design: { name: 'Design 1440', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
  laptop: { name: 'Laptop 1080', styles: { width: '1080px', height: '800px' }, type: 'desktop' },
  tablet: { name: 'Tablet 834', styles: { width: '834px', height: '1194px' }, type: 'tablet' },
  phone: { name: 'Phone 390', styles: { width: '390px', height: '844px' }, type: 'mobile' },
} as const;

const meta = {
  title: 'Site/Press Kit',
  component: PressKit,
  parameters: { layout: 'fullscreen', viewport: { options: viewports }, a11y: { test: 'error' } },
} satisfies Meta<typeof PressKit>;

export default meta;
type Story = StoryObj<typeof meta>;

const live = { song: NYACK_SET.song, event: NYACK_SET.event };

/** A catalogue entry as a reader sees it: its inline markup printed, not shown. */
const plain = (text: string) => text.replace(/<\/?(span|strong|em)>/g, '');
const squash = (text: string | null | undefined) => (text ?? '').replace(/\s+/g, ' ').trim();

/** The innermost element whose whole text, across any inline markup, is `expected`. */
const wholeText = (expected: string) => (_: string, element: Element | null) =>
  !!element && squash(element.textContent) === expected && ![...element.children].some(child => squash(child.textContent) === expected);

/**
 * Every link and button on the page, in document order: what the keyboard must reach. An iframe's
 * fallback content is never shown by a browser, so it is not on the page.
 */
const controls = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')].filter(element => !element.parentElement?.closest('iframe'));
const describe = (element: Element | null) => `${element?.tagName.toLowerCase()} "${element?.getAttribute('aria-label') ?? squash(element?.textContent)}"`;

/**
 * The keyboard reaches every control, in document order, and each shows where focus is.
 * No positive tabindex anywhere means Tab follows document order; no control is taken out of it;
 * each one takes focus, matches :focus-visible, and is visible on screen. (Testing Library's simulated
 * Tab can't be used here: it tries to focus the fallback link React puts inside the Bandcamp iframe,
 * which no browser shows, and sticks there.)
 */
const tabThroughEverything = async (root: HTMLElement) => {
  for (const element of root.querySelectorAll('[tabindex]')) await expect(Number(element.getAttribute('tabindex')), describe(element)).toBeLessThanOrEqual(0);
  const expected = controls(root);
  await expect(expected.length).toBeGreaterThan(0);
  (document.activeElement as HTMLElement | null)?.blur();
  for (const control of expected) {
    await expect(control.tabIndex, `${describe(control)} is out of the tab order`).toBe(0);
    control.focus({ focusVisible: true } as FocusOptions);
    await expect(document.activeElement, describe(control)).toBe(control);
    await expect(control.matches(':focus-visible'), `${describe(control)} is not :focus-visible`).toBe(true);
    await expect(control, describe(control)).toBeVisible();
    await waitFor(() => {
      const box = control.getBoundingClientRect();
      expect(box.width * box.height, `${describe(control)} has no size`).toBeGreaterThan(0);
      expect(box.bottom > 0 && box.right > 0 && box.top < window.innerHeight && box.left < window.innerWidth, `${describe(control)} is off screen`).toBe(true);
    });
  }
};

/** Nothing is wider than the window. */
const expectNoSidewaysScroll = async () =>
  waitFor(() => expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth));

/** The content every width must still show: the nameplate, the section heads, the members and their first words. */
const expectEverythingReadable = async (canvasElement: HTMLElement) => {
  const page = within(canvasElement);
  await expect(page.getByRole('heading', { level: 1, name: t('pressKit.wordmark') })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: FEATURED_RELEASE.title })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: t('pressKit.record.heading') })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: t('pressKit.band.heading') })).toBeVisible();
  for (const member of MEMBERS) {
    await expect(page.getByRole('heading', { level: 3, name: new RegExp(`^${member.name}`) })).toBeVisible();
    await expect(page.getByText(t(`band.members.${member.id}.bio`)[0])).toBeVisible();
  }
  for (const control of controls(canvasElement)) await expect(control, describe(control)).toBeVisible();
};

/** The live site: the press kit as one printed poster, every word from the copy catalogue and src/content. */
export const Poster: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await expect(page.getByRole('heading', { level: 1, name: t('pressKit.wordmark') })).toBeVisible();
    for (const part of [t('pressKit.dateline.issue'), t('pressKit.dateline.place'), t('pressKit.dateline.since')]) await expect(page.getByText(part)).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: FEATURED_RELEASE.title })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: t('pressKit.band.heading') })).toBeVisible();
    for (const member of MEMBERS) {
      await expect(page.getByRole('heading', { level: 3, name: new RegExp(`^${member.name}\\s*${t(`band.members.${member.id}.part`)}$`) })).toBeVisible();
      await expect(page.getByRole('img', { name: t(`band.members.${member.id}.photoAlt`) })).toBeVisible();
      for (const paragraph of t(`band.members.${member.id}.bio`)) await expect(page.getByText(paragraph)).toBeVisible();
    }
    await expect(page.getByTitle(t('pressKit.bandcamp.title', { title: FEATURED_RELEASE.title }))).toHaveAttribute(
      'src',
      expect.stringContaining(`album=${FEATURED_RELEASE.albumId}/`),
    );

    // The catalogue's inline markup and placeholders print as words: no tags or braces reach the reader.
    await expect(page.getByText(wholeText(plain(t('pressKit.lede'))))).toBeVisible();
    await expect(page.getByText(wholeText(plain(t('pressKit.live.caption', live))))).toBeVisible();
    await expect(page.getByText(wholeText(plain(t('pressKit.live.label', live))))).toBeVisible();
    await expect(page.getByText(t('pressKit.record.bio.start', { stages: list(SHARED_STAGES) }))).toBeVisible();
    await expect(page.getByText(t('pressKit.record.bio.sound'))).toBeVisible();
    const earlier = list(EARLIER_RELEASES.map(record => t('pressKit.record.earlier', { title: record.title, year: record.year })));
    await expect(
      page.getByText(wholeText(plain(t('pressKit.record.bio.records', { title: FEATURED_RELEASE.title, year: FEATURED_RELEASE.year, earlier })))),
    ).toBeVisible();
    await expect(canvasElement.textContent).not.toMatch(/\{\{|<\/?\w+>/);
  },
};

/** Every link goes where src/content says; the ones off the site open in a new tab without handing it this page. */
export const Links: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await expect(page.getByRole('link', { name: t('pressKit.foot.book') })).toHaveAttribute('href', BOOKING_HREF);
    // Every link in src/content is on the page, under its name, going where it says.
    for (const link of [...LISTEN_HREFS, BANDCAMP_HREF, ...SOCIAL_HREFS]) {
      const printed = page.getAllByRole('link', { name: t(`band.links.${link.platform}`) });
      for (const each of printed) await expect(each).toHaveAttribute('href', link.href);
    }

    const external = controls(canvasElement).filter(link => /^https?:/.test(link.getAttribute('href') ?? ''));
    for (const link of external) {
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link.getAttribute('rel')?.split(/\s+/)).toEqual(expect.arrayContaining(['noreferrer']));
    }

    // The bar's tabs each jump to a part of this page that exists.
    const nav = page.getByRole('navigation', { name: t('pressKit.nav.label') });
    const tabs = within(nav).getAllByRole('link');
    await expect(tabs.map(tab => tab.textContent)).toEqual((['music', 'live', 'band', 'book'] as const).map(id => t(`pressKit.nav.${id}`)));
    for (const tab of tabs) {
      const id = tab.getAttribute('href')?.replace(/^#/, '') ?? '';
      await expect(tab.getAttribute('href')).toMatch(/^#\w/);
      await expect(canvasElement.querySelector(`[id="${id}"]`), `${tab.getAttribute('href')} has no target`).not.toBeNull();
    }
  },
};

/** The keyboard reaches every link and button, top to bottom, and each shows where focus is. */
export const Keyboard: Story = {
  play: async ({ canvasElement }) => {
    await tabThroughEverything(canvasElement);
  },
};

/** The hero plays muted; one press swaps in the whole set, from the site, with sound and controls. */
export const PlayingTheVideo: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    await userEvent.click(page.getByRole('button', { name: new RegExp(`^(${t('pressKit.live.watch')}|${t('pressKit.live.play')}) `) }));
    const player = await page.findByLabelText(t('pressKit.live.title', live));
    await expect(player.tagName).toBe('VIDEO');
    await expect(player).toHaveAttribute('src', NYACK_SET.video);
    await expect(player).toHaveAttribute('controls');
    await expect((player as HTMLVideoElement).muted).toBe(false);
  },
};

/** Pressing an earlier record puts it in the Bandcamp player; pressing the new one puts it back. */
export const PickingARecord: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    const [earlier] = EARLIER_RELEASES;
    const button = page.getByRole('button', { name: `${earlier.title} (${earlier.year})` });
    await userEvent.click(button);
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(await page.findByTitle(t('pressKit.bandcamp.title', { title: earlier.title }))).toHaveAttribute(
      'src',
      expect.stringContaining(`album=${earlier.albumId}/`),
    );
    await userEvent.click(page.getByRole('button', { name: `${FEATURED_RELEASE.title} (${FEATURED_RELEASE.year})` }));
    await expect(await page.findByTitle(t('pressKit.bandcamp.title', { title: FEATURED_RELEASE.title }))).toHaveAttribute(
      'src',
      expect.stringContaining(`album=${FEATURED_RELEASE.albumId}/`),
    );
  },
};

/** Wide, from 1080 up: everything shows, nothing scrolls sideways, and the keyboard reaches every control. */
export const Desktop: Story = {
  globals: { viewport: { value: 'design' } },
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBe(1440);
    await expectEverythingReadable(canvasElement);
    for (const member of MEMBERS) for (const paragraph of t(`band.members.${member.id}.bio`)) await expect(within(canvasElement).getByText(paragraph)).toBeVisible();
    await expectNoSidewaysScroll();
    await tabThroughEverything(canvasElement);
  },
};

/** Medium, 680 to 1079: the same, with every member's whole bio. */
export const Tablet: Story = {
  globals: { viewport: { value: 'tablet' } },
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBe(834);
    await expectEverythingReadable(canvasElement);
    for (const member of MEMBERS) for (const paragraph of t(`band.members.${member.id}.bio`)) await expect(within(canvasElement).getByText(paragraph)).toBeVisible();
    await expectNoSidewaysScroll();
    await tabThroughEverything(canvasElement);
  },
};

/** Narrow, below 680: each member is trimmed to the first paragraph of their bio; nothing else is lost. */
export const Phone: Story = {
  globals: { viewport: { value: 'phone' } },
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBe(390);
    await expectEverythingReadable(canvasElement);
    for (const member of MEMBERS) {
      const [first, ...rest] = t(`band.members.${member.id}.bio`);
      await expect(within(canvasElement).getByText(first)).toBeVisible();
      for (const paragraph of rest) await expect(within(canvasElement).getByText(paragraph)).not.toBeVisible();
    }
    await expectNoSidewaysScroll();
    await tabThroughEverything(canvasElement);
  },
};
