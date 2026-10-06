import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { FEATURED_RELEASE } from '../../content/releases';
import { t } from '../../i18n/copy';
import { PressKitBar } from './PressKitBar';

const meta = {
  title: 'Site/Press Kit Bar',
  component: PressKitBar,
  decorators: [
    Story => (
      <div className="epk">
        <Story />
      </div>
    ),
  ],
  parameters: { a11y: { test: 'error' } },
} satisfies Meta<typeof PressKitBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The record's bar: the featured release's title from src/content, as a section heading. */
export const Record: Story = {
  args: { ink: 'violet', children: FEATURED_RELEASE.title },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('heading', { level: 2, name: FEATURED_RELEASE.title })).toBeVisible();
  },
};

/** The band's bar: its heading from the catalogue, and the id the page's "The band" tab jumps to. */
export const Band: Story = {
  args: { ink: 'pink', id: 'band', children: t('pressKit.band.heading') },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('heading', { level: 2, name: t('pressKit.band.heading') })).toHaveAttribute('id', 'band');
  },
};
