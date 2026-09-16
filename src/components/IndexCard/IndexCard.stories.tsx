import type { Meta, StoryObj } from '@storybook/react-vite';
import { RYAN_SIGNATURE } from '../../sections/BandDossier/signatures';
import { INDEX_CARD_RULINGS, INDEX_CARD_SIZES, IndexCard } from './IndexCard';

const meta = {
  title: 'Components/Index Card',
  component: IndexCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: INDEX_CARD_SIZES },
    ruling: { control: 'inline-radio', options: INDEX_CARD_RULINGS },
    title: { control: 'text' },
    subtitle: { control: 'text' },
    stamp: { control: 'text' },
    rotation: { control: { type: 'range', min: -20, max: 20, step: 0.5 } },
  },
  args: {
    title: 'Ryan Gavin',
    subtitle: 'Keys · since 2012',
    stamp: 'Since 2012',
    stampAt: 'signature',
    signature: { text: 'Ryan Gavin', path: RYAN_SIGNATURE, width: 250 },
    size: '4x6',
    ruling: 'ruled',
    rotation: -1.5,
    notes: [{ text: 'takes chances on keys ✓', x: 8, y: 72, rotation: -3 }],
    children: (
      <>
        <p>Ryan co-founded Funkadelic Astronaut in 2012 with longtime friend Kevin O’Neill.</p>
        <p>Blending music and technology, he brings an adventurous touch to the keys, taking chances and helping steer the trio into unexpected territory.</p>
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ padding: 56, background: '#ead3a7' }}>
        <div style={{ width: 560, maxWidth: '100%' }}>
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof IndexCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A member's card: typed facts, a pen note, a stamp. */
export const Bio: Story = {};

/** The band's own card, as it would sit inside the folder's cover. */
export const Summary: Story = {
  args: {
    title: 'Funkadelic Astronaut',
    subtitle: 'New Jersey · Future rock',
    stamp: 'Booking',
    stampAt: 'top-right',
    signature: undefined,
    notes: [{ text: 'keys / drums / bass / vox', x: 50, y: 78, rotation: -2, size: 30 }],
    children: (
      <>
        <p>Three friends blending funk and electronics with keyboards, drums, bass and vocals.</p>
        <p>Founded in New Jersey in 2012 by Ryan Gavin and Kevin O’Neill, with Sam Luba joining in 2017. Together, they’ve been bringing that sound to stages across the Northeast.</p>
      </>
    ),
  },
};

/** The smaller pack, unruled, with only a pen note. */
export const BlankNote: Story = {
  args: {
    size: '3x5',
    ruling: 'blank',
    title: undefined,
    subtitle: undefined,
    stamp: undefined,
    signature: undefined,
    children: undefined,
    rotation: 2,
    notes: [
      { text: 'Call Sam re: Nyack fest', x: 8, y: 24, rotation: -2, size: 44 },
      { text: 'Sept 26 · doors 7', x: 12, y: 52, rotation: -1.5, size: 36, ink: '#a52837' },
    ],
  },
};

/** Type wraps around a photo clipped over the top-right corner. */
export const WithClearance: Story = {
  args: {
    subtitle: undefined,
    stamp: undefined,
    clearance: { side: 'right', width: 256, height: 150 },
  },
};
