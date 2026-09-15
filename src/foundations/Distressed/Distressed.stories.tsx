import type { Meta, StoryObj } from '@storybook/react-vite';
import { SocialIcon } from '../../components/SocialIcon/SocialIcon';
import { Distressed } from './Distressed';
import '../../styles/cutout-ink.css';

/**
 * Ink on paper. The worn letterpress finish used by the wordmark, the nav, the
 * ticket and the social marks, extracted so it can be applied to anything.
 * Wrap content in `Distressed`; inside an SVG use `PrintInkFilter` directly.
 */
const meta = {
  title: 'Foundations/Distressed',
  component: Distressed,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: 48, background: '#ead3a7', color: '#121420' }}>
        <Story />
      </div>
    ),
  ],
  args: { enabled: true },
} satisfies Meta<typeof Distressed>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DisplayType: Story = {
  args: {
    children: (
      <p className="cutout-ink cutout-ink--text" style={{ margin: 0, fontSize: 96, lineHeight: 1, color: '#9275b2', '--cutout-shadow-x': '4px', '--cutout-shadow-y': '5px', '--cutout-stroke': '4px' } as React.CSSProperties}>
        Funkadelic
      </p>
    ),
  },
};

export const BodyCopy: Story = {
  args: {
    children: (
      <p style={{ margin: 0, maxWidth: 420, font: '700 22px/1.35 "Balsamiq Sans", "Comic Sans MS", cursive' }}>
        Three-day festival run through the Northeast, one verified date and two design samples. Doors and set
        times to be announced.
      </p>
    ),
  },
};

export const SolidBlock: Story = {
  args: {
    children: (
      <div style={{ width: 240, height: 120, background: '#dc5127', borderRadius: 4 }} />
    ),
  },
};

/** Compare on and off side by side. */
export const Comparison: Story = {
  args: { children: null },
  render: () => (
    <div style={{ display: 'flex', gap: 48, alignItems: 'center' }}>
      {[false, true].map((enabled) => (
        <div key={String(enabled)} style={{ display: 'grid', gap: 16, justifyItems: 'center' }}>
          <Distressed enabled={enabled}>
            <div style={{ width: 160, height: 80, background: '#121420' }} />
          </Distressed>
          <Distressed enabled={enabled}>
            <p style={{ margin: 0, font: '700 40px/1 "Balsamiq Sans", cursive' }}>Tour</p>
          </Distressed>
          <span style={{ font: '14px "Balsamiq Sans", cursive' }}>{enabled ? 'distressed' : 'clean'}</span>
        </div>
      ))}
    </div>
  ),
};

/** The social marks apply the same filter inside their own SVG. */
export const OnMarks: Story = {
  args: { children: null },
  render: () => (
    <div style={{ display: 'flex', gap: 24 }}>
      <SocialIcon platform="instagram" ink="purple" size={64} />
      <SocialIcon platform="spotify" ink="green" size={64} />
      <SocialIcon platform="applemusic" ink="red" size={64} />
    </div>
  ),
};
