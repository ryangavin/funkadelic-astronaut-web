import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import ryan from '../../../assets/band-13.webp';
import { Mug } from '../../components/3D/Mug/Mug';
import { PaperSheet } from '../../components/2D/PaperSheet/PaperSheet';
import { Pen } from '../../components/3D/Pen/Pen';
import { Polaroid } from '../../components/2D/Polaroid/Polaroid';
import { StickyNote } from '../../components/2D/StickyNote/StickyNote';
import { Movable, MovableScale, type Place } from './Movable';

const meta = {
  title: 'Library/Foundations/Behaviors/Movable',
  component: Movable,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: {
    grab: { control: 'inline-radio', options: ['body', 'anywhere'] },
    children: { control: false },
    onMove: { control: false },
  },
  args: { x: 0, y: 0, rotation: 0, width: 0, grab: 'body' },
} satisfies Meta<typeof Movable>;

export default meta;
type Story = StoryObj<typeof meta>;

type Id = 'print' | 'note' | 'pen' | 'mug';
const START: Record<Id, Place> = {
  print: { x: 120, y: 120, rotation: -6 },
  note: { x: 520, y: 160, rotation: 4 },
  pen: { x: 700, y: 520, rotation: -20 },
  mug: { x: 1040, y: 100, rotation: 30 },
};
const WIDTHS: Record<Id, number> = { print: 320, note: 220, pen: 400, mug: 300 };
const LABELS: Record<Id, string> = { print: 'Print of Ryan', note: 'Sticky note', pen: 'Pencil', mug: 'Mug' };

/** Four things on a sheet, each dragged in sheet units; the one picked up comes to the top. */
function Things(args: Story['args']) {
  const [places, setPlaces] = useState(START);
  const [stacking, setStacking] = useState<Id[]>(['mug', 'pen', 'note', 'print']);
  const thing = (id: Id) => ({
    ...places[id],
    width: WIDTHS[id],
    z: 1 + stacking.indexOf(id),
    label: LABELS[id],
    resizable: true,
    onMove: (to: Place) => setPlaces((all) => ({ ...all, [id]: { ...all[id], ...to } })),
    onGrab: () => {
      setStacking((order) => [...order.filter((other) => other !== id), id]);
      args?.onGrab?.();
    },
    onDrop: args?.onDrop,
  });
  return (
    <MovableScale.Provider value={() => (document.querySelector('.paper-sheet')?.getBoundingClientRect().width ?? 1440) / 1440}>
      <PaperSheet height={760}>
        <Movable {...thing('print')} grab={args?.grab}>
          <Polaroid src={ryan} alt="Ryan at the keys" caption="Ryan" tape />
        </Movable>
        <Movable {...thing('note')}>
          <StickyNote color="pink" size={78}>
            <p>Drag me</p>
          </StickyNote>
        </Movable>
        <Movable {...thing('pen')}>
          <Pen kind="pencil" />
        </Movable>
        <Movable {...thing('mug')}>
          <Mug />
        </Movable>
      </PaperSheet>
    </MovableScale.Provider>
  );
}

/**
 * Drag anything by its body; the arrow keys move whichever has focus and the
 * bracket keys turn it. Hover to reveal the handles: the turn handle takes it
 * round its pivot, the size handle enlarges or shrinks it.
 */
export const OnASheet: Story = {
  render: (args) => <Things {...args} />,
};

/** Picked up anywhere, even on a control: a press that moves is a drag, one that stays is the control's click. */
export const GrabAnywhere: Story = {
  args: { grab: 'anywhere' },
  render: (args) => <Things {...args} />,
};

/** Controls inside the object keep their clicks and keyboard input. */
export const ChildControls: Story = {
  args: { onMove: () => {} },
  render: (args) => (
    <Movable {...args} x={100} y={100} width={300} unit="1px" label="Control card">
      <div style={{ padding: 24, background: '#fbfaf7', minHeight: 160 }}>
        <button type="button" onClick={args.onDrop}>Child action</button>
        <input aria-label="Card text" defaultValue="Edit me" />
      </div>
    </Movable>
  ),
};
