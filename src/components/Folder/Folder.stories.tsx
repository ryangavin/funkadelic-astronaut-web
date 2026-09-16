import type { Meta, StoryObj } from '@storybook/react-vite';
import performance from '../../../assets/performance.webp';
import { IndexCard } from '../IndexCard/IndexCard';
import { Polaroid } from '../Polaroid/Polaroid';
import { FOLDER_STOCKS, Folder } from './Folder';

const meta = {
  title: 'Components/Folder',
  component: Folder,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: {
    stock: { control: 'inline-radio', options: FOLDER_STOCKS },
    label: { control: 'text' },
    sticker: { control: 'text' },
    rotation: { control: { type: 'range', min: -10, max: 10, step: 0.5 } },
  },
  args: {
    label: 'Tour dossier · 2012—now',
    stock: 'manila',
    open: true,
    stamps: ['Booking', 'Received'],
    sticker: 'Funkadelic Astronaut',
    rotation: 0,
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '72px 48px', background: '#ead3a7' }}>
        <div style={{ width: 1100, maxWidth: '100%', margin: 'auto' }}>
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof Folder>;

export default meta;
type Story = StoryObj<typeof meta>;

/** What the agent keeps inside the cover: the contact proof and the band's own card. */
function CoverContents() {
  return (
    <div style={{ display: 'grid', gap: '4%', alignContent: 'start' }}>
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
  );
}

/** Open on the desk, with the contents stapled inside the cover and an empty well. */
export const Open: Story = {
  render: (args) => <Folder {...args} cover={<CoverContents />} />,
};

/** Closed: the cover lies over the well, sticker up. Toggle `open` to swing it. */
export const Closed: Story = {
  args: { open: false },
  render: (args) => <Folder {...args} cover={<CoverContents />} />,
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
