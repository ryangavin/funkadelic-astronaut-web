import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import festivalSketch from '../../../assets/festival-scribble-fully-shaded.png';
import performance from '../../../assets/performance.webp';
import { Folder } from '../../components/Folder/Folder';
import { IndexCard } from '../../components/IndexCard/IndexCard';
import { BAND_MEMBER_PACKETS } from '../../components/Packet/bandMembers';
import { Packet } from '../../components/Packet/Packet';
import { PaperSheet } from '../../components/PaperSheet/PaperSheet';
import { Polaroid } from '../../components/Polaroid/Polaroid';
import { Stack, type StackProps } from './Stack';

type SifterProps = Omit<StackProps, 'index' | 'children'> & { initial?: number };

const arrow = (flip: boolean) => (
  <svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true" style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
    <path d="M8 24h28M24 12l12 12-12 12" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const buttonStyle: React.CSSProperties = {
  display: 'inline-grid',
  placeItems: 'center',
  width: 40,
  height: 40,
  padding: 0,
  border: '2.5px solid #121420',
  borderRadius: 999,
  background: '#ead3a7',
  color: '#121420',
  boxShadow: '2px 3px 0 #121420',
  cursor: 'pointer',
};

/** Arrow-driven sifting: the state, the controls and the announcement live here.
    The arrows sit on the top card's bottom corner; the count is announced, not shown. */
function Sifter({ initial = 0, ...stack }: SifterProps) {
  const [index, setIndex] = useState(initial);
  const count = BAND_MEMBER_PACKETS.length;
  const step = (by: number) => setIndex((current) => (current + by + count) % count);
  return (
    <div role="region" aria-roledescription="carousel" aria-label="Meet the band" style={{ position: 'relative' }}>
      <Stack index={index} {...stack}>
        {BAND_MEMBER_PACKETS.map(({ name, ...packet }) => (
          <Packet key={name} {...packet} />
        ))}
      </Stack>
      <div style={{ position: 'absolute', zIndex: 10, right: '5%', bottom: '5.5%', display: 'flex', gap: 10, alignItems: 'center' }}>
        <span role="status" aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap' }}>
          {BAND_MEMBER_PACKETS[index].name} · {index + 1} of {count}
        </span>
        <button type="button" style={buttonStyle} aria-label="Previous member" onClick={() => step(-1)}>{arrow(true)}</button>
        <button type="button" style={buttonStyle} aria-label="Next member" onClick={() => step(1)}>{arrow(false)}</button>
      </div>
    </div>
  );
}

const meta = {
  title: 'Behaviors/Stack',
  component: Sifter,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    spread: { control: { type: 'range', min: 0, max: 3, step: 0.1 } },
    duration: { control: { type: 'range', min: 200, max: 2400, step: 50 } },
    side: { control: 'inline-radio', options: [1, -1] },
  },
  args: { initial: 0, spread: 1, duration: 900, side: 1 },
  decorators: [
    (Story, context) =>
      context.parameters.composition ? (
        <Story />
      ) : (
        <div style={{ padding: '72px 56px', background: '#ead3a7' }}>
          <div style={{ width: 560, maxWidth: '100%' }}>
            <Story />
          </div>
        </div>
      ),
  ],
} satisfies Meta<typeof Sifter>;

export default meta;
type Story = StoryObj<typeof meta>;

const topItem = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>('.stack__item')].reduce((top, item) => (Number(item.style.zIndex) > Number(top.style.zIndex) ? item : top));

/** Next lifts the top packet and drops it under the pile; previous pulls the bottom one back out. */
export const Sift: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(topItem(canvasElement).textContent).toContain('Ryan Gavin');
    await userEvent.click(canvas.getByRole('button', { name: 'Next member' }));
    await waitFor(() => expect(topItem(canvasElement).textContent).toContain('Kevin O’Neill'));
    await userEvent.click(canvas.getByRole('button', { name: 'Next member' }));
    await waitFor(() => expect(topItem(canvasElement).textContent).toContain('Sam Luba'));
    await userEvent.click(canvas.getByRole('button', { name: 'Previous member' }));
    await waitFor(() => expect(topItem(canvasElement).textContent).toContain('Kevin O’Neill'), { timeout: 2000 });
    await expect(canvas.getByRole('status').textContent).toBe('Kevin O’Neill · 2 of 3');
  },
};

/** A slower, wider-handled pile, to study the flight. */
export const SlowMotion: Story = {
  args: { duration: 2400, spread: 2 },
};

/** The pile in the folder's well, on the sketched desk: the dossier as the agent left it. */
export const InFolder: Story = {
  parameters: { composition: true, layout: 'fullscreen' },
  render: (args) => (
    <PaperSheet height={0} imageSrc={festivalSketch} imageSize="118% auto" imagePosition="center top" imageOpacity={0.9} imageContrast={1.28}>
      <div style={{ padding: '6% 5%' }}>
        <Folder
          label="Tour dossier · 2012—now"
          stamps={['Booking', 'Received']}
          sticker="Funkadelic Astronaut"
          rotation={-1}
          cover={
            <div style={{ display: 'grid', gap: '5%', alignContent: 'start' }}>
              <div style={{ width: '58%', marginLeft: '36%' }}>
                <Polaroid src={performance} alt="Funkadelic Astronaut performing live" format="wide" focus="50% 40%" caption="Live set" note="contact proof" tape rotation={2} fade={0.4} />
              </div>
              <div style={{ width: '92%' }}>
                <IndexCard title="Funkadelic Astronaut" subtitle="NJ · Future rock" rotation={-1.5} notes={[{ text: 'keys / drums / bass / vox', x: 52, y: 78, rotation: -2, size: 28 }]}>
                  <p>Three friends blending funk and electronics with keyboards, drums, bass and vocals.</p>
                  <p>Founded in New Jersey in 2012, bringing that sound to stages across the Northeast.</p>
                </IndexCard>
              </div>
            </div>
          }
        >
          <Sifter {...args} />
        </Folder>
      </div>
    </PaperSheet>
  ),
};
