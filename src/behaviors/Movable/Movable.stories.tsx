import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import ryan from '../../../assets/band-13.webp';
import { Mug } from '../../components/Mug/Mug';
import { PaperSheet } from '../../components/PaperSheet/PaperSheet';
import { Pen } from '../../components/Pen/Pen';
import { Polaroid } from '../../components/Polaroid/Polaroid';
import { StickyNote } from '../../components/StickyNote/StickyNote';
import { MOVABLE_KEY_STEP, Movable, MovableScale, type Place } from './Movable';

const meta = {
  title: 'Behaviors/Movable',
  component: Movable,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: {
    grab: { control: 'inline-radio', options: ['body', 'anywhere'] },
    children: { control: false },
    onMove: { control: false },
  },
  args: { x: 0, y: 0, rotation: 0, width: 0, grab: 'body', onGrab: fn(), onDrop: fn() },
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
    onMove: (to: { x: number; y: number }) => setPlaces((all) => ({ ...all, [id]: { ...all[id], ...to } })),
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
          <Mug rotation={0} />
        </Movable>
      </PaperSheet>
    </MovableScale.Provider>
  );
}

/** Drag anything by its body; the arrow keys move whichever has focus. */
export const OnASheet: Story = {
  render: (args) => <Things {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const note = canvas.getByRole('group', { name: 'Sticky note' });
    const scale = canvasElement.querySelector<HTMLElement>('.paper-sheet')!.getBoundingClientRect().width / 1440;
    const box = note.getBoundingClientRect();
    const start = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    // A press that does not travel is not a drag.
    await userEvent.pointer([{ keys: '[MouseLeft>]', target: note, coords: { clientX: start.x, clientY: start.y } }, { keys: '[/MouseLeft]' }]);
    await expect(note.style.getPropertyValue('--movable-x')).toBe(String(START.note.x));
    await expect(args.onDrop).not.toHaveBeenCalled();
    // One that does moves the thing by the pointer's travel, in sheet units.
    await userEvent.pointer([
      { keys: '[MouseLeft>]', target: note, coords: { clientX: start.x, clientY: start.y } },
      { coords: { clientX: start.x + 40 * scale, clientY: start.y + 10 * scale } },
      { coords: { clientX: start.x + 200 * scale, clientY: start.y + 80 * scale } },
      { keys: '[/MouseLeft]', coords: { clientX: start.x + 200 * scale, clientY: start.y + 80 * scale } },
    ]);
    await expect(note.style.getPropertyValue('--movable-x')).toBe(String(START.note.x + 200));
    await expect(note.style.getPropertyValue('--movable-y')).toBe(String(START.note.y + 80));
    await expect(args.onGrab).toHaveBeenCalled();
    await expect(args.onDrop).toHaveBeenCalledTimes(1);
    await expect(note).not.toHaveAttribute('data-dragging');
    // Picked up, it is on top of the mug, which started above it.
    const mug = canvas.getByRole('group', { name: 'Mug' });
    await expect(Number(getComputedStyle(note).zIndex)).toBeGreaterThan(Number(getComputedStyle(mug).zIndex));
    // The keyboard moves it a step at a time, five with shift.
    note.focus();
    await userEvent.keyboard('{ArrowLeft}{Shift>}{ArrowDown}{/Shift}');
    await expect(note.style.getPropertyValue('--movable-x')).toBe(String(START.note.x + 200 - MOVABLE_KEY_STEP));
    await expect(note.style.getPropertyValue('--movable-y')).toBe(String(START.note.y + 80 + MOVABLE_KEY_STEP * 5));
  },
};

/** Picked up anywhere, even on a control: a press that moves is a drag, one that stays is the control's click. */
export const GrabAnywhere: Story = {
  args: { grab: 'anywhere' },
  render: (args) => <Things {...args} />,
};
