import type { Meta, StoryObj } from '@storybook/react-vite';
import { SOCIAL_ICON_INK_NAMES, SOCIAL_PLATFORM_NAMES, SocialIcon } from './SocialIcon';

const meta = {
  title: 'Components/Social Icon',
  component: SocialIcon,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: 40, background: '#ead3a7' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    platform: { control: 'select', options: SOCIAL_PLATFORM_NAMES },
    ink: { control: 'select', options: SOCIAL_ICON_INK_NAMES },
    size: { control: { type: 'range', min: 16, max: 160, step: 2 } },
  },
  args: { platform: 'spotify', ink: 'green', size: 72, worn: true },
} satisfies Meta<typeof SocialIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Spotify: Story = {};

export const AllPlatforms: Story = {
  args: { size: 56 },
  render: (args) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, maxWidth: 480, justifyContent: 'center' }}>
      {SOCIAL_PLATFORM_NAMES.map((platform) => (
        <SocialIcon key={platform} {...args} platform={platform} />
      ))}
    </div>
  ),
};

/** The hero's listen row: each service in its own ink. */
export const ListenRow: Story = {
  args: { size: 50 },
  render: (args) => (
    <div style={{ display: 'flex', gap: 24 }}>
      <SocialIcon {...args} platform="applemusic" ink="red" />
      <SocialIcon {...args} platform="spotify" ink="green" />
      <SocialIcon {...args} platform="youtube" ink="red" />
      <SocialIcon {...args} platform="deezer" ink="purple" />
    </div>
  ),
};

export const Inks: Story = {
  args: { platform: 'applemusic', size: 56 },
  render: (args) => (
    <div style={{ display: 'flex', gap: 24 }}>
      {SOCIAL_ICON_INK_NAMES.map((ink) => (
        <SocialIcon key={ink} {...args} ink={ink} />
      ))}
    </div>
  ),
};

/** Footer size, without the worn texture, which is invisible this small. */
export const Small: Story = {
  args: { size: 25, worn: false, ink: 'red' },
  render: (args) => (
    <div style={{ display: 'flex', gap: 8 }}>
      {SOCIAL_PLATFORM_NAMES.map((platform) => (
        <SocialIcon key={platform} {...args} platform={platform} />
      ))}
    </div>
  ),
};

/** Custom ink: any CSS colour works. */
export const CustomInk: Story = {
  args: { ink: '#e54b1e', platform: 'youtube' },
};
