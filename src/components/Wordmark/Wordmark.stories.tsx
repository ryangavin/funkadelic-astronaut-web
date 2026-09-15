import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Jitter } from '../../behaviors/Jitter/Jitter';
import { PAPER_STOCKS } from '../PaperSheet/PaperSheet';
import { Wordmark } from './Wordmark';

const meta = {
  title: 'Brand/Wordmark', component: Wordmark, tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    children: { control: 'text' },
    letterSpacing: { control: 'text' },
    inkColor: { control: 'color' },
    stock: { control: 'inline-radio', options: PAPER_STOCKS },
    fontSize: { control: { type: 'range', min: 16, max: 160, step: 1 } },
    outlineWidth: { control: { type: 'range', min: 0, max: 5, step: .25 } },
    rotation: { control: { type: 'range', min: -10, max: 10, step: .5 } },
  },
  args: { children: 'GOOD MUSIC', inkColor: '#9275b2', fontSize: 64, outlineWidth: 2,
    letterSpacing: '.02em', shadowX: 2, shadowY: 3, rotation: 0, stock: 'pale', paddingX: 16, paddingY: 8 },
  decorators: [(Story) => <div style={{ padding: '32px', background: '#ead3a7' }}><Story /></div>],
} satisfies Meta<typeof Wordmark>;
export default meta;
type Story = StoryObj<typeof meta>;
export const CustomContent: Story = {};
export const MixedContent: Story = {
  argTypes: { children: { control: false } },
  args: { fontSize: 40, inkColor: '#639ec8' },
  render: (args) => <Wordmark {...args}>
    <span style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
      <span>LIVE TONIGHT</span>
    </span>
  </Wordmark>,
};
export const WithJitter: Story = {
  render: (args) => <Jitter preset="print"><Wordmark {...args} /></Jitter>,
};

// The band-specific words and two-line arrangement belong only to this example.
function HeroComposition() {
  return <div style={{ position: 'relative', width: '100%', aspectRatio: '1000 / 275' }} role="img" aria-label="Funkadelic Astronaut">
    <div style={{ position: 'absolute', left: '1.8%', top: '2%', width: '95.8%' }}>
      <Wordmark paddingX={0} paddingY={0} fontSize={176} letterSpacing=".06em" outlineWidth={4} shadowX={4} shadowY={5} style={{ display: 'block', width: '100%' }}>
        <svg viewBox="18 120.5 958 130.625" aria-hidden="true" focusable="false">
          <text x="25" y="240" textLength="940" lengthAdjust="spacingAndGlyphs">FUNK<tspan dx="7">A</tspan>DELIC</text>
        </svg>
      </Wordmark>
    </div>
    <div style={{ position: 'absolute', left: '1.8%', top: '54.5%', width: '77.8%' }}>
      <Wordmark paddingX={0} paddingY={0} fontSize={136} inkColor="#639ec8" letterSpacing=".06em" outlineWidth={4} shadowX={4} shadowY={5} style={{ display: 'block', width: '100%' }}>
        <svg viewBox="18 264.875 778 112.75" aria-hidden="true" focusable="false">
          <text x="25" y="360" textLength="755" lengthAdjust="spacingAndGlyphs">ASTRONAUT</text>
        </svg>
      </Wordmark>
    </div>
  </div>;
}
export const HeroReference: Story = {
  parameters: { controls: { disable: true } },
  render: () => <HeroComposition />,
};
export const MultipleWidths: Story = {
  args: { children: 'SPACE TO DANCE', fontSize: 56 },
  render: (args) => <div style={{ display: 'grid', justifyItems: 'start', gap: 40 }}>
    {[240, 480, 800].map(width => <div key={width} style={{ width, maxWidth: '100%' }}><Wordmark {...args} /></div>)}
  </div>,
  play: async ({ canvasElement, args }) => {
    await canvasElement.ownerDocument.fonts.load('56px "Wordmark Modak"');
    const marks = canvasElement.querySelectorAll('.printed-wordmark');
    await expect(marks.length).toBe(3);
    const ids = [...canvasElement.querySelectorAll('[id]')].map(element => element.id);
    await expect(new Set(ids).size).toBe(ids.length);
    for (const mark of marks) {
      await expect(mark.textContent).toBe(args.children);
      const ownIds = new Set([...mark.querySelectorAll('[id]')].map(element => element.id));
      await expect((mark as HTMLElement).offsetWidth).toBeLessThanOrEqual(mark.parentElement!.clientWidth + 1);
      for (const element of mark.querySelectorAll('*')) {
        for (const attribute of element.attributes) {
          for (const match of attribute.value.matchAll(/url\(#([^)]*)\)/g)) await expect(ownIds.has(match[1])).toBe(true);
          if (attribute.name === 'href' && attribute.value.startsWith('#')) await expect(ownIds.has(attribute.value.slice(1))).toBe(true);
        }
      }
    }
  },
};

export const VariedLettering: Story = {
  render: (args) => <div style={{ display: 'grid', justifyItems: 'start', gap: 32 }}>
    <Wordmark {...args}>GOOD MUSIC</Wordmark>
    <Wordmark {...args}>Funkadelic</Wordmark>
    <Wordmark {...args}>Play all day</Wordmark>
  </div>,
};
