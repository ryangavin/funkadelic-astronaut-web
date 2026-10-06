import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { MEMBERS } from '../../content/members';
import { t } from '../../i18n/copy';
import { MemberColumn } from './MemberColumn';

const viewports = {
  desktop: { name: 'Desktop 1200', styles: { width: '1200px', height: '900px' }, type: 'desktop' },
  phone: { name: 'Phone 390', styles: { width: '390px', height: '844px' }, type: 'mobile' },
} as const;

const [ryan, kevin, sam] = MEMBERS;

const meta = {
  title: 'Site/Member Column',
  component: MemberColumn,
  decorators: [
    Story => (
      <div className="epk" style={{ maxWidth: 420 }}>
        <Story />
      </div>
    ),
  ],
  parameters: { viewport: { options: viewports }, a11y: { test: 'error' } },
  args: { id: ryan.id, name: ryan.name },
  // The member's name, part, portrait and every paragraph of their bio, all from src/content.
  play: async ({ canvasElement, args }) => {
    const page = within(canvasElement);
    await expect(page.getByRole('heading', { level: 3, name: new RegExp(`^${args.name}\\s*${t(`band.members.${args.id}.part`)}$`) })).toBeVisible();
    const portrait = page.getByRole('img', { name: t(`band.members.${args.id}.photoAlt`) });
    await expect(portrait).toBeVisible();
    // Offered at three sizes, so a narrow column fetches a smaller file; the box stays 4:3 across the column.
    await expect(portrait).toHaveAttribute('srcset', expect.stringMatching(/-portrait-450[^,]* 450w, [^,]*-portrait-675[^,]* 675w, [^,]*-portrait-900[^,]* 900w$/));
    await expect(portrait).toHaveAttribute('sizes', expect.stringContaining('(max-width: 679px)'));
    await expect(portrait).toHaveAttribute('loading', 'lazy');
    const box = portrait.getBoundingClientRect();
    await expect(box.width / box.height).toBeCloseTo(4 / 3, 1);
    for (const paragraph of t(`band.members.${args.id}.bio`)) await expect(page.getByText(paragraph)).toBeVisible();
  },
} satisfies Meta<typeof MemberColumn>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ryan: Story = {};
export const Kevin: Story = { args: { id: kevin.id, name: kevin.name } };
export const Sam: Story = { args: { id: sam.id, name: sam.name } };

/** On a phone a reader gets the first paragraph of the bio only. */
export const OnAPhone: Story = {
  globals: { viewport: { value: 'phone' } },
  play: async ({ canvasElement, args }) => {
    const page = within(canvasElement);
    await expect(window.innerWidth).toBe(390);
    await expect(page.getByRole('heading', { level: 3, name: new RegExp(`^${args.name}`) })).toBeVisible();
    await expect(page.getByRole('img', { name: t(`band.members.${args.id}.photoAlt`) })).toBeVisible();
    const [first, ...rest] = t(`band.members.${args.id}.bio`);
    await expect(page.getByText(first)).toBeVisible();
    for (const paragraph of rest) await expect(page.getByText(paragraph)).not.toBeVisible();
  },
};
