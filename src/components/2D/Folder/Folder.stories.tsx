import type { Meta, StoryObj } from '@storybook/react-vite';
import { BAND_PACKET, LIVE_SET } from '../../../sections/BandDossier/bandMembers';
import { Polaroid } from '../Polaroid/Polaroid';
import { Packet } from '../Packet/Packet';
import { FOLDER_STOCKS, FOLDER_TABS, Folder } from './Folder';

const meta = {
  title: 'Components/2D/Folder',
  component: Folder,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: {
    stock: { control: 'inline-radio', options: FOLDER_STOCKS },
    tab: { control: 'inline-radio', options: FOLDER_TABS },
    label: { control: 'text' },
    sticker: { control: 'text' },
    rotation: { control: { type: 'range', min: -10, max: 10, step: 0.5 } },
  },
  args: {
    label: 'Press Package – Funkadelic Astronaut',
    tab: 'side',
    stock: 'manila',
    open: true,
    stamps: ['Booking', 'Received'],
    stampsAt: 'bottom',
    sticker: 'Funkadelic Astronaut',
    rotation: 0,
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '72px 64px', background: '#ead3a7' }}>
        <div style={{ width: 1100, maxWidth: '100%', margin: 'auto' }}>
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof Folder>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The live clip printed inside the cover, stamps beneath it. */
const cover = (
  <div style={{ width: '90%', marginLeft: '4%' }}>
    <Polaroid video={LIVE_SET.video} plain format="wide" alt={LIVE_SET.alt} caption={LIVE_SET.caption} note={LIVE_SET.note} tape rotation={1.5} />
  </div>
);

/** Open on the desk: the clip inside the cover, the band's packet in the well. */
export const Open: Story = {
  render: (args) => (
    <Folder {...args} cover={cover}>
      <Packet {...BAND_PACKET} />
    </Folder>
  ),
};

/** The tab along the top edge instead. */
export const TopTab: Story = {
  args: { tab: 'top' },
  render: (args) => (
    <Folder {...args} cover={cover}>
      <Packet {...BAND_PACKET} />
    </Folder>
  ),
};

/** Closed: the cover lies over the well, sticker up. Toggle `open` to swing it. */
export const Closed: Story = {
  args: { open: false },
  render: (args) => (
    <Folder {...args} cover={cover}>
      <Packet {...BAND_PACKET} />
    </Folder>
  ),
};

/** The three stocks, empty. */
export const Stocks: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 48 }}>
      {FOLDER_STOCKS.map((stock) => (
        <Folder key={stock} {...args} stock={stock} stamps={[stock]} />
      ))}
    </div>
  ),
};
