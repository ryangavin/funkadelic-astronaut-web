import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import festivalSketch from '../../../../assets/festival-scribble-fully-shaded.png';
import { FOLDER_STOCKS } from '../../../components/2D/Folder/Folder';
import { PaperSheet } from '../../../components/2D/PaperSheet/PaperSheet';
import { BandDossier, DOSSIER_PLACEMENT } from './BandDossier';

const percent = (category: string, min = 0, max = 100) => (({
  control: { type: 'range', min, max, step: 0.5 },
  table: { category }
}) as const);
const degrees = (category: string) => (({
  control: { type: 'range', min: -20, max: 20, step: 0.5 },
  table: { category }
}) as const);

const meta = {
  title: 'Experience/Sections/Band Dossier',
  component: BandDossier,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: {
    stock: { control: 'inline-radio', options: FOLDER_STOCKS },
    label: { control: 'text' },
    rotation: { control: { type: 'range', min: -6, max: 6, step: 0.5 } },
    initial: { control: { type: 'range', min: 0, max: 2, step: 1 } },
    spread: { control: { type: 'range', min: 0.5, max: 1.4, step: 0.05 } },
    spreadX: { control: { type: 'range', min: 0, max: 4, step: 0.1 }, description: 'Sideways lean of the cards, on its own. Follows spread until set.' },
    duration: { control: { type: 'range', min: 200, max: 2400, step: 50 } },
    proofWidth: percent('Print', 40, 120),
    proofX: percent('Print', -20, 40),
    proofY: percent('Print', -20, 40),
    proofRotation: degrees('Print'),
    deckWidth: percent('Player', 30, 100),
    deckX: percent('Player', -20, 60),
    deckY: percent('Player', -20, 60),
    deckRotation: degrees('Player'),
    wellWidth: percent('Well', 40, 125),
    wellX: percent('Well', -10, 40),
    wellGap: percent('Well', 0, 20),
    pileX: percent('Well', -25, 25),
    pileRotation: degrees('Well'),
    bandRotation: degrees('Well'),
  },
  args: { open: true, rotation: -1, initial: 0, spread: 1.1, spreadX: 1.1, duration: 900, ...DOSSIER_PLACEMENT },
} satisfies Meta<typeof BandDossier>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The section as it will sit on the site: the package open on the sketched desk. */
export const OnDesk: Story = {
  args: {
    spreadX: 2,
    wellX: -2,
    pileX: -6,
    pileRotation: 3,
    bandRotation: -3
  },

  render: (args) => (
    <PaperSheet height={0} imageSrc={festivalSketch} imageSize="118% auto" imagePosition="center top" imageOpacity={0.9} imageContrast={1.28}>
      <div style={{ padding: '10% 13% 23% 8%' }}>
        <BandDossier {...args} />
      </div>
    </PaperSheet>
  ),
};

/** The folder alone, on plain paper. */
export const Folder: Story = {
  render: (args) => (
    <div style={{ padding: '72px 64px', background: '#ead3a7' }}>
      <div style={{ width: 1100, maxWidth: '100%', margin: 'auto' }}>
        <BandDossier {...args} />
      </div>
    </div>
  ),
};

/** Closed on the desk, sticker up. */
export const Closed: Story = {
  args: { open: false },
  render: (args) => (
    <div style={{ padding: '72px 64px', background: '#ead3a7' }}>
      <div style={{ width: 1100, maxWidth: '100%', margin: 'auto' }}>
        <BandDossier {...args} />
      </div>
    </div>
  ),
};

/** Starts closed and opens and closes by hand, so the package can be packed away and taken out again. */
export const LazyContents: Story = {
  render: function Lifecycle(args) {
    const [open, setOpen] = useState(false);
    return <div style={{ width: 1100, maxWidth: '100%', padding: 40 }}>
      <BandDossier {...args} open={open} onOpen={() => setOpen(true)} onClose={() => setOpen(false)} />
    </div>;
  },
};
