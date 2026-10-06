import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import kevin from '../../../assets/band-22.webp';
import ryan from '../../../assets/band-13.webp';
import sam from '../../../assets/band-21.webp';
import { Folder } from '../../components/2D/Folder/Folder';
import { Polaroid } from '../../components/2D/Polaroid/Polaroid';
import { StickyNote } from '../../components/2D/StickyNote/StickyNote';
import { SPILL_FLIGHT_MS, SPILL_STAGGER_MS, Spill, Spilled } from './Spill';

const meta = {
  title: 'Library/Foundations/Behaviors/Spill',
  component: Spill,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: {
    scatter: { control: { type: 'range', min: 0, max: 60, step: 1 } },
    duration: { control: { type: 'range', min: 200, max: 3000, step: 50 } },
    stagger: { control: { type: 'range', min: 0, max: 600, step: 10 } },
    children: { control: false },
    from: { control: false },
    unit: { control: false },
  },
  args: { open: false, scatter: 12, duration: SPILL_FLIGHT_MS, stagger: SPILL_STAGGER_MS },
} satisfies Meta<typeof Spill>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Three prints and a note kept loose in a folder. The folder is 1440 folder
 * units across, so the spill is placed in those: the well's corner is the
 * origin, 720 units in from the folder's left edge.
 */
function LooseInAFolder(args: Story['args']) {
  const [open, setOpen] = useState(args?.open ?? false);
  return (
    <div style={{ padding: '72px 64px 260px', background: '#5a3a25' }}>
      <div style={{ width: 1000, maxWidth: '100%', margin: 'auto' }}>
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} style={{ marginBottom: 24, font: 'inherit', padding: '8px 16px' }}>
          {open ? 'Close the folder' : 'Open the folder'}
        </button>
        <Folder label="Prints" tab="side" open={open} stamps={['Loose']} sticker="Do not bend">
          <Spill {...args} open={open} from={{ x: 360, y: 458 }} unit="var(--folder-unit)">
            <Spilled x={-560} y={620} width={360} rotation={-9} order={0}>
              <Polaroid src={ryan} alt="Ryan at the keys" caption="Ryan" tape />
            </Spilled>
            <Spilled x={-120} y={760} width={360} rotation={4} order={1}>
              <Polaroid src={kevin} alt="Kevin at the kit" caption="Kevin" />
            </Spilled>
            <Spilled x={340} y={640} width={360} rotation={11} order={2}>
              <Polaroid src={sam} alt="Sam on bass" caption="Sam" tape />
            </Spilled>
            <Spilled x={520} y={120} width={220} rotation={-14} order={3}>
              <StickyNote color="pink" size={84}>
                <p>Send these back!</p>
              </StickyNote>
            </Spilled>
          </Spill>
        </Folder>
      </div>
    </div>
  );
}

/** Closed: everything is packed on the pile's point, out of sight. Open the folder. */
export const Packed: Story = {
  render: (args) => <LooseInAFolder {...args} />,
};

/** Open: everything out where it landed. */
export const Out: Story = {
  args: { open: true },
  render: (args) => <LooseInAFolder {...args} />,
};

/** Slower, further apart, and turned harder on the pile. */
export const Slow: Story = {
  args: { duration: 2400, stagger: 400, scatter: 40 },
  render: (args) => <LooseInAFolder {...args} />,
};
