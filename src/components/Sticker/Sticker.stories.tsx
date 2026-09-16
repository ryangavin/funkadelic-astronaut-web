import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { SOCIAL_ICON_INK_NAMES, SOCIAL_PLATFORM_NAMES } from '../SocialIcon/SocialIcon';
import { PAPER_STOCKS } from '../PaperSheet/PaperSheet';
import { SocialSticker } from './SocialSticker';

const meta = {
  title: 'Components/Sticker',
  component: SocialSticker,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [(Story) => <div style={{ padding: 40 }}><Story /></div>],
  argTypes: {
    platform: { control: 'select', options: SOCIAL_PLATFORM_NAMES },
    ink: { control: 'select', options: ['brand', ...SOCIAL_ICON_INK_NAMES] },
    stock: { control: 'select', options: PAPER_STOCKS },
    size: { control: { type: 'range', min: 28, max: 160, step: 2 } },
    rotation: { control: { type: 'range', min: -20, max: 20, step: 1 } },
    border: { control: { type: 'range', min: 0.3, max: 4, step: 0.1 } },
    peel: { control: { type: 'range', min: 0, max: 6, step: 0.1 }, description: 'Depth of the lifted corner in artwork units; 0 leaves it stuck down.' },
    keyline: { control: { type: 'range', min: 0, max: 1.2, step: 0.05 } },
    backing: { control: 'boolean' },
    print: { control: 'inline-radio', options: ['flat', 'cutout'] },
  },
  args: { platform: 'applemusic', size: 72, rotation: -4, stock: 'white', border: 1.3, keyline: 0.4, backing: false, ink: 'brand', worn: false, print: 'flat', glossy: true, peel: 1.2 },
} satisfies Meta<typeof SocialSticker>;
export default meta;
type Story = StoryObj<typeof meta>;

export const AppleMusic: Story = {};
export const Spotify: Story = { args: { platform: 'spotify', rotation: 5 } };
export const YouTube: Story = { args: { platform: 'youtube', rotation: -3 } };
export const Deezer: Story = { args: { platform: 'deezer', rotation: 4 } };

export const StreamingStickers: Story = {
  render: (args) => <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'center', justifyContent: 'center' }}>
    {(['applemusic', 'spotify', 'youtube', 'deezer'] as const).map((platform, index) =>
      <SocialSticker key={platform} {...args} platform={platform} rotation={index % 2 ? 4 : -4} />)}
  </div>,
};

/** Every platform in its own colours, Instagram in its gradient. */
export const AllPlatforms: Story = {
  render: (args) => <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'center', justifyContent: 'center', maxWidth: 520 }}>
    {SOCIAL_PLATFORM_NAMES.map((platform, index) =>
      <SocialSticker key={platform} {...args} platform={platform} rotation={index % 2 ? 4 : -4} />)}
  </div>,
  play: async ({ canvasElement }) => {
    const gradient = canvasElement.querySelector('.social-icon[data-platform="instagram"] linearGradient');
    await expect(gradient).toBeInTheDocument();
    const facebook = canvasElement.querySelector<HTMLElement>('.social-icon[data-platform="facebook"]')!;
    await expect(facebook.style.getPropertyValue('--social-icon-ink')).toBe('#4a78b8');
  },
};

export const Sizes: Story = {
  args: { platform: 'deezer', rotation: 0 },
  render: (args) => <div style={{ display: 'grid', gap: 32 }}>
    {[32, 72, 128].map(size => <div key={size} style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'center' }}>
      {(['applemusic', 'spotify', 'youtube', 'deezer'] as const).map(platform =>
        <SocialSticker key={platform} {...args} platform={platform} size={size} />)}
    </div>)}
  </div>,
};

/** Peeled well back, to see the underside and how the fold moves. */
export const Peeling: Story = {
  args: { platform: 'youtube', peel: 4, size: 128, rotation: 0 },
};

/** Still on its liner: the sheet of backing paper it came on, lying loose on the desk. */
export const OnLiner: Story = {
  args: { platform: 'spotify', backing: true, rotation: 6, size: 96, peel: 3 },
  play: async ({ canvasElement }) => {
    const sheet = canvasElement.querySelector<HTMLElement>('.sticker__sheet')!;
    await expect(sheet).toBeInTheDocument();
    // The liner keeps its corner: only the vinyl is cut by the peel.
    const win = canvasElement.ownerDocument.defaultView!;
    await expect(win.getComputedStyle(sheet).clipPath).toBe('none');
    await expect(win.getComputedStyle(canvasElement.querySelector('.sticker__vinyl')!).clipPath).toMatch(/^polygon/);
  },
};

/** The poster's worn cutout print on vinyl instead of the clean job. */
export const Cutout: Story = {
  args: { platform: 'instagram', print: 'cutout', worn: true, rotation: 2 },
};

/** Stuck down flat and unlaminated: a matte paper sticker. */
export const Matte: Story = {
  args: { platform: 'spotify', glossy: false, peel: 0, stock: 'pale', rotation: 2 },
};

/** A link: the corner curls further under the pointer, and the focus ring shows on tab. */
export const Linked: Story = {
  args: { platform: 'spotify', href: 'https://open.spotify.com/', label: 'Listen on Spotify', rotation: 3 },
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole('link', { name: 'Listen on Spotify' });
    const vinyl = link.querySelector<HTMLElement>('.sticker__vinyl')!;
    const win = canvasElement.ownerDocument.defaultView!;
    const resting = win.getComputedStyle(vinyl).clipPath;
    await expect(resting).toMatch(/^polygon/);
    await expect(link.querySelector('.sticker__flap')).toBeInTheDocument();
    // Focus lifts the corner the same way the pointer does: the fold moves in and the surface layer is cut further.
    await userEvent.tab();
    await expect(link).toHaveFocus();
    await waitFor(() => expect(win.getComputedStyle(vinyl).clipPath).not.toBe(resting), { timeout: 1500 });
    await userEvent.tab();
    await waitFor(() => expect(win.getComputedStyle(vinyl).clipPath).toBe(resting), { timeout: 1500 });
  },
};
