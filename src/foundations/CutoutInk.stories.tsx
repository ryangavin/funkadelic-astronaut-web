import type React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SocialIcon } from '../components/2D/SocialIcon/SocialIcon';
import '../styles/cutout-ink.css';

type CutoutInkDemoProps = {
  /** Horizontal offset of the hard black shadow, in px. */
  shadowX: number;
  /** Vertical offset of the hard black shadow, in px. */
  shadowY: number;
  /** Width of the black stroke tucked under the fill, in px. */
  stroke: number;
};

/**
 * The wordmark's ink treatment as one shared stylesheet, `src/styles/cutout-ink.css`.
 * Fill, then a black stroke under the fill, then a hard offset shadow of the same
 * black. Text does it with text properties; SVG does it with a drop-shadow on the
 * graphic and a stroke on the fill layer. Both read the same custom properties.
 *
 * The sliders drive the type sample. The marks beneath use the same stylesheet at
 * their own small-mark defaults, which is what the Social Icon component ships with.
 */
function CutoutInkDemo({ shadowX, shadowY, stroke }: CutoutInkDemoProps) {
  return (
    <div style={{ display: 'grid', gap: 40, justifyItems: 'center' }}>
      <div
        className="cutout-ink"
        style={
          {
            '--cutout-shadow-x': `${shadowX}px`,
            '--cutout-shadow-y': `${shadowY}px`,
            '--cutout-stroke': `${stroke}px`,
            display: 'grid',
            gap: 8,
            justifyItems: 'center',
          } as React.CSSProperties
        }
      >
        <p className="cutout-ink--text" style={{ margin: 0, fontSize: 96, lineHeight: 1, color: '#9275b2' }}>
          Funkadelic
        </p>
        <p className="cutout-ink--text" style={{ margin: 0, fontSize: 96, lineHeight: 1, color: '#639ec8' }}>
          Astronaut
        </p>
      </div>
      <div style={{ display: 'flex', gap: 28 }}>
        <SocialIcon platform="applemusic" ink="red" size={64} />
        <SocialIcon platform="spotify" ink="green" size={64} />
        <SocialIcon platform="youtube" ink="red" size={64} />
        <SocialIcon platform="deezer" ink="purple" size={64} />
      </div>
    </div>
  );
}

const meta = {
  title: 'Foundations/Styles/Cutout Ink',
  component: CutoutInkDemo,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: 48, background: '#ead3a7' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    shadowX: { control: { type: 'range', min: 0, max: 8, step: 0.5 } },
    shadowY: { control: { type: 'range', min: 0, max: 10, step: 0.5 } },
    stroke: { control: { type: 'range', min: 0, max: 6, step: 0.2 } },
  },
  args: { shadowX: 4, shadowY: 5, stroke: 4 },
} satisfies Meta<typeof CutoutInkDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Wordmark: Story = {};
export const SmallMarks: Story = { args: { shadowX: 2, shadowY: 3, stroke: 1.2 } };
