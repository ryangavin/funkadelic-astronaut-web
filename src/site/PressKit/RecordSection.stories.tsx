import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { BANDCAMP_HREF, LISTEN_HREFS } from '../../content/links';
import { EARLIER_RELEASES, FEATURED_RELEASE, type BandcampRelease } from '../../content/releases';
import { list, SHARED_STAGES } from '../../content/stages';
import { t } from '../../i18n/copy';
import { RecordSection } from './RecordSection';

const meta = {
  title: 'Site/Record Section',
  component: RecordSection,
  decorators: [
    Story => (
      <div className="epk">
        <Story />
      </div>
    ),
  ],
  parameters: { a11y: { test: 'error' } },
  args: { release: FEATURED_RELEASE },
} satisfies Meta<typeof RecordSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const RECORDS = [FEATURED_RELEASE, ...EARLIER_RELEASES];
const recordName = (record: BandcampRelease) => `${record.title} (${record.year})`;
const squash = (text: string | null | undefined) => (text ?? '').replace(/\s+/g, ' ').trim();

/** Only `playing` is pressed, and it is the record in the player. */
const expectPlaying = async (canvasElement: HTMLElement, playing: BandcampRelease) => {
  const page = within(canvasElement);
  for (const record of RECORDS) {
    await expect(page.getByRole('button', { name: recordName(record) })).toHaveAttribute('aria-pressed', String(record === playing));
  }
  await expect(await page.findByTitle(t('pressKit.bandcamp.title', { title: playing.title }))).toHaveAttribute(
    'src',
    expect.stringContaining(`/album=${playing.albumId}/`),
  );
};

/** The record from src/content: its heading, where to stream it, its story, and every record, newest first, the new one playing. */
export const Featured: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    const section = page.getByRole('region', { name: t('pressKit.record.label') });
    await expect(within(section).getByRole('heading', { level: 2, name: t('pressKit.record.heading') })).toBeVisible();

    for (const link of [...LISTEN_HREFS, BANDCAMP_HREF]) {
      const printed = page.getByRole('link', { name: t(`band.links.${link.platform}`) });
      await expect(printed).toHaveAttribute('href', link.href);
      await expect(printed).toHaveAttribute('target', '_blank');
    }

    await expect(page.getByText(t('pressKit.record.bio.start', { stages: list(SHARED_STAGES) }))).toBeVisible();
    await expect(page.getByText(t('pressKit.record.bio.sound'))).toBeVisible();
    const earlier = list(EARLIER_RELEASES.map(record => t('pressKit.record.earlier', { title: record.title, year: record.year })));
    const records = t('pressKit.record.bio.records', { title: FEATURED_RELEASE.title, year: FEATURED_RELEASE.year, earlier }).replace(/<\/?em>/g, '');
    await expect(
      page.getByText((_, element) => !!element && squash(element.textContent) === records && ![...element.children].some(child => squash(child.textContent) === records)),
    ).toBeVisible();

    const catalog = page.getByRole('list', { name: t('pressKit.record.catalog') });
    await expect(within(catalog).getAllByRole('button').map(button => squash(button.textContent))).toEqual(RECORDS.map(recordName));
    await expectPlaying(canvasElement, FEATURED_RELEASE);
  },
};

/** Pressing each record in turn puts it in the player and marks it pressed. */
export const PickingEachRecord: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    for (const record of [...EARLIER_RELEASES, FEATURED_RELEASE]) {
      await userEvent.click(page.getByRole('button', { name: recordName(record) }));
      await expectPlaying(canvasElement, record);
    }
  },
};

/** From the keyboard: Enter or Space on a record plays it, and focus stays on that record. */
export const PickingByKeyboard: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    const [first, second] = EARLIER_RELEASES;

    const firstButton = page.getByRole('button', { name: recordName(first) });
    firstButton.focus();
    await userEvent.keyboard('{Enter}');
    await expectPlaying(canvasElement, first);
    await expect(firstButton).toHaveFocus();

    const secondButton = page.getByRole('button', { name: recordName(second) });
    secondButton.focus();
    await userEvent.keyboard(' ');
    await expectPlaying(canvasElement, second);
    await expect(secondButton).toHaveFocus();
  },
};
