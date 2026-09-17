import type { Meta, StoryObj } from '@storybook/react-vite';
import { BAND_MEMBER_PACKETS } from '../../../sections/BandDossier/bandMembers';
import { Packet } from './Packet';

const [ryan, kevin, sam] = BAND_MEMBER_PACKETS;

const meta = {
  title: 'Components/2D/Packet',
  component: Packet,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    photoSide: { control: 'inline-radio', options: ['left', 'right'] },
    photoWidth: { control: { type: 'range', min: 160, max: 360, step: 4 } },
    photoTop: { control: { type: 'range', min: -40, max: 160, step: 2 } },
    photoRotation: { control: { type: 'range', min: -15, max: 15, step: 0.5 } },
    rotation: { control: { type: 'range', min: -15, max: 15, step: 0.5 } },
    clipAt: { control: { type: 'range', min: 20, max: 240, step: 2 } },
    clipRotation: { control: { type: 'range', min: -20, max: 20, step: 0.5 } },
  },
  args: { photo: ryan.photo, card: ryan.card, photoSide: 'right', photoWidth: 210, photoTop: 36, photoRotation: 5, clip: true, clipAt: 58, clipRotation: 8, facts: ryan.facts },
  decorators: [
    (Story) => (
      <div style={{ padding: 56, background: '#ead3a7' }}>
        <div style={{ width: 600, maxWidth: '100%' }}>
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof Packet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A member's print clipped over the corner of their card. */
export const Member: Story = {};

/** The print over the other corner. */
export const PhotoLeft: Story = {
  args: { photoSide: 'left', photoRotation: -5 },
};

/** Loose on the card, no clip. */
export const Unclipped: Story = {
  args: { clip: false, photoRotation: -9, photoWidth: 240 },
};

/** All three, as they come out of the folder. */
export const Members: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 40 }}>
      <Packet {...args} photo={ryan.photo} card={ryan.card} />
      <Packet {...args} photo={kevin.photo} card={kevin.card} facts={kevin.facts} photoRotation={-3} clipAt={148} clipRotation={-4} />
      <Packet {...args} photo={sam.photo} card={sam.card} facts={sam.facts} photoRotation={7} clipAt={104} clipRotation={4} />
    </div>
  ),
};
