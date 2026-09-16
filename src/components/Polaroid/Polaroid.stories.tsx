import type { Meta, StoryObj } from '@storybook/react-vite';
import festivalSketch from '../../../assets/festival-scribble-fully-shaded.png';
import kevin from '../../../assets/band-22.webp';
import ryan from '../../../assets/band-13.webp';
import sam from '../../../assets/band-21.webp';
import { PaperSheet } from '../PaperSheet/PaperSheet';
import { Pin } from '../Pin/Pin';
import { DEFAULT_POLAROID_FADE, POLAROID_FORMATS, Polaroid } from './Polaroid';

const meta = {
  title: 'Components/Polaroid',
  component: Polaroid,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    format: { control: 'inline-radio', options: POLAROID_FORMATS },
    focus: { control: 'text' },
    caption: { control: 'text' },
    note: { control: 'text' },
    rotation: { control: { type: 'range', min: -20, max: 20, step: 0.5 } },
    fade: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
  },
  args: {
    src: ryan,
    alt: 'Ryan Gavin playing keys on stage',
    focus: '33.5% 24%',
    format: 'square',
    caption: 'Ryan Gavin',
    note: 'Keyboard Wizard',
    tape: true,
    rotation: -3,
    fade: DEFAULT_POLAROID_FADE,
  },
  decorators: [
    (Story, context) =>
      context.parameters.composition ? (
        <Story />
      ) : (
        <div style={{ padding: 56, background: '#ead3a7' }}>
          <div style={{ width: 340, maxWidth: '100%' }}>
            <Story />
          </div>
        </div>
      ),
  ],
} satisfies Meta<typeof Polaroid>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The band section's member print. */
export const Member: Story = {};

/** The landscape pack keeps more of a stage-wide photo. */
export const Wide: Story = {
  args: { format: 'wide', focus: '50% 30%', rotation: 2 },
};

/** Straight out of the camera: full colour, true blacks. */
export const Fresh: Story = {
  args: { fade: 0, tape: false, rotation: 0 },
};

/** Decades in a shoebox. */
export const Faded: Story = {
  args: { fade: 1, rotation: 4 },
};

/** No writing, no tape: just the print. */
export const Plain: Story = {
  args: { caption: undefined, note: undefined, tape: false, rotation: 0 },
};

/** The three members, fanned out on ink. */
export const Members: Story = {
  parameters: { composition: true, layout: 'fullscreen' },
  render: (args) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', gap: 32, padding: 64, background: '#121420' }}>
      <div style={{ width: 280, maxWidth: '100%' }}>
        <Polaroid {...args} rotation={-5} />
      </div>
      <div style={{ width: 280, maxWidth: '100%', marginTop: 40 }}>
        <Polaroid {...args} src={kevin} alt="Kevin O’Neill at the drums" focus="66% 15%" caption="Kevin O’Neill" note="Drums" rotation={2} tape={false} />
      </div>
      <div style={{ width: 280, maxWidth: '100%' }}>
        <Polaroid {...args} src={sam} alt="Sam Luba on bass" focus="21% 33%" caption="Sam Luba" note="Bass & vocals" rotation={6} />
      </div>
    </div>
  ),
};

/** Pinned over the festival sketch, the way the band section shows it. */
export const OnSketchedSheet: Story = {
  parameters: { composition: true, layout: 'fullscreen' },
  render: (args) => (
    <PaperSheet height={820} imageSrc={festivalSketch} imageSize="118% auto" imagePosition="center top" imageOpacity={0.9} imageContrast={1.28}>
      <Pin x={490} y={110} width={460} rotation={-2.5}>
        <Polaroid {...args} rotation={0} />
      </Pin>
    </PaperSheet>
  ),
};
