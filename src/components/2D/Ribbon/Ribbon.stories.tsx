import type { Meta, StoryObj } from '@storybook/react-vite';
import festivalSketch from '../../../../assets/festival-scribble-fully-shaded.png';
import { PaperSheet } from '../PaperSheet/PaperSheet';
import { SocialIcon, type SocialPlatform } from '../SocialIcon/SocialIcon';
import { FOOTER_RIBBON_HEIGHT, FOOTER_RIBBON_WAVE, RIBBON_COLOR_NAMES, Ribbon } from './Ribbon';

const meta = {
  title: 'Foundations/Layout/Ribbon',
  component: Ribbon,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: {
    color: { control: 'select', options: RIBBON_COLOR_NAMES },
    height: { control: { type: 'range', min: 24, max: 240, step: 2 } },
    frequency: { control: { type: 'range', min: 0.25, max: 4, step: 0.01 } },
    amplitude: { control: { type: 'range', min: 0, max: 80, step: 0.1 } },
    rotation: { control: { type: 'range', min: -20, max: 20, step: 0.1 } },
    x: { control: { type: 'range', min: -100, max: 100, step: 0.1 } },
    y: { control: { type: 'range', min: -100, max: 100, step: 0.1 } },
    background: { control: 'color' },
  },
  args: { color: 'purple', height: FOOTER_RIBBON_HEIGHT, ...FOOTER_RIBBON_WAVE, background: '#121420', worn: true },
  // The wave needs something above it to cut into: a strip of the site's paper.
  decorators: [
    (Story) => (
      <div style={{ background: '#ead3a7', paddingTop: 120 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Ribbon>;

export default meta;
type Story = StoryObj<typeof meta>;

const socials: SocialPlatform[] = ['instagram', 'facebook', 'bandsintown'];
const music: SocialPlatform[] = ['applemusic', 'spotify', 'youtube', 'deezer', 'bandcamp'];
const stamp = (platform: SocialPlatform) => (
  <a key={platform} href="#" aria-label={platform} style={{ display: 'grid', placeItems: 'center', width: 44, height: 44, color: 'inherit' }}>
    <SocialIcon platform={platform} ink="#ead3a7" size={25} worn={false} label="" />
  </a>
);

/** The home page footer's link row, printed in paper ink on the block. */
function FooterLinks() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '12px 24px', padding: '8px 53px 16px', fontFamily: 'var(--font-body)' }}>
      <a href="#" style={{ justifySelf: 'start', display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 44, color: 'inherit', textDecoration: 'none', font: '400 18px/1.15 Modak, Georgia, serif' }}>
        <SocialIcon platform="github" ink="#ead3a7" size={22} worn={false} label="" />
        <span>See how this site was made</span>
      </a>
      <nav aria-label="Socials" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{socials.map(stamp)}</nav>
      <nav aria-label="Music" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>{music.map(stamp)}</nav>
    </div>
  );
}

/** The footer ribbon with its link row, as on the home page. */
export const Footer: Story = {
  render: (args) => (
    <Ribbon {...args}>
      <FooterLinks />
    </Ribbon>
  ),
};

/** The seam alone: nothing below the wave, nothing on the block. */
export const SeamOnly: Story = {
  args: { background: 'transparent' },
};

/** Each of the site's inks as the outer band. */
export const Inks: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 40 }}>
      {RIBBON_COLOR_NAMES.map((color) => (
        <Ribbon key={color} {...args} color={color}>
          <div style={{ padding: '8px 24px 24px', font: '400 18px/1.15 Modak, Georgia, serif' }}>{color}</div>
        </Ribbon>
      ))}
    </div>
  ),
};

/** A taller, busier wave, like the seams between the main sections. */
export const TallWave: Story = {
  args: { color: 'amber', height: 140, frequency: 2.28, amplitude: 17.2, y: -15.6 },
  render: (args) => (
    <Ribbon {...args}>
      <div style={{ padding: '8px 24px 48px', font: '400 18px/1.15 Modak, Georgia, serif' }}>Tour</div>
    </Ribbon>
  ),
};

/** Across the foot of a sketched sheet, the way the home page ends. The band is
    sized in pixels, so it hugs the sheet's bottom edge rather than pinning by y. */
export const OnPaperSheet: Story = {
  decorators: [(Story) => <Story />],
  render: (args) => (
    <PaperSheet height={700} imageSrc={festivalSketch} imagePosition="center 66%">
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <Ribbon {...args}>
          <FooterLinks />
        </Ribbon>
      </div>
    </PaperSheet>
  ),
};
