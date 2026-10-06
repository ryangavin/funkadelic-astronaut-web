import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemberPile } from '../../experience/sections/BandDossier/BandDossier';

const meta = {
  title: 'Library/Foundations/Behaviors/Stack',
  component: MemberPile,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    spread: { control: { type: 'range', min: 0, max: 3, step: 0.1 } },
    spreadX: { control: { type: 'range', min: 0, max: 4, step: 0.1 }, description: 'Sideways lean of the cards, on its own. Follows spread until set.' },
    duration: { control: { type: 'range', min: 200, max: 2400, step: 50 } },
    side: { control: 'inline-radio', options: [1, -1] },
  },
  args: { initial: 0, spread: 1, spreadX: 1, duration: 900, side: 1 },
  decorators: [
    (Story) => (
      <div style={{ padding: '72px 56px', background: '#ead3a7' }}>
        <div style={{ width: 560, maxWidth: '100%' }}>
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof MemberPile>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Click a peeking packet to pull it out and land it on top; click the top one to send it under. */
export const Sift: Story = {};

/** A slower, looser pile, to study the flight. */
export const SlowMotion: Story = {
  args: { duration: 2400, spread: 1.4 },
};
