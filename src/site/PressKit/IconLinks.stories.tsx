import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { BANDCAMP_HREF, LISTEN_HREFS, SOCIAL_HREFS } from '../../content/links';
import { t } from '../../i18n/copy';
import { IconLinks } from './IconLinks';

const EVERY_LINK = [...SOCIAL_HREFS, ...LISTEN_HREFS, BANDCAMP_HREF];

const meta = {
  title: 'Site/Icon Links',
  component: IconLinks,
  decorators: [
    Story => (
      <div className="epk">
        <Story />
      </div>
    ),
  ],
  parameters: { a11y: { test: 'error' } },
  args: { links: EVERY_LINK },
} satisfies Meta<typeof IconLinks>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every platform in src/content/links: named from the catalogue, going to its href, in a new tab without a referrer. */
export const EveryPlatform: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    const links = page.getAllByRole('link');
    await expect(links.map(link => link.getAttribute('aria-label'))).toEqual(EVERY_LINK.map(link => t(`band.links.${link.platform}`)));
    for (const link of EVERY_LINK) {
      const printed = page.getByRole('link', { name: t(`band.links.${link.platform}`) });
      await expect(printed).toHaveAttribute('href', link.href);
      await expect(printed).toHaveAttribute('target', '_blank');
      await expect(printed.getAttribute('rel')?.split(/\s+/)).toEqual(expect.arrayContaining(['noreferrer']));
      await expect(printed).toBeVisible();
    }
  },
};

/** Tab visits each mark in order, and each shows it has focus. */
export const Keyboard: Story = {
  args: { links: LISTEN_HREFS },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement);
    for (const link of LISTEN_HREFS) {
      await userEvent.tab();
      const printed = page.getByRole('link', { name: t(`band.links.${link.platform}`) });
      await expect(printed).toHaveFocus();
      await expect(printed.matches(':focus-visible')).toBe(true);
    }
  },
};
