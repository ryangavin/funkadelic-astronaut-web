import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import ryan from '../../../assets/band-13.webp';
import { Mug } from '../../components/Mug/Mug';
import { PaperSheet } from '../../components/PaperSheet/PaperSheet';
import { Pen } from '../../components/Pen/Pen';
import { Polaroid } from '../../components/Polaroid/Polaroid';
import { StickyNote } from '../../components/StickyNote/StickyNote';
import { MOVABLE_KEY_STEP, MOVABLE_KEY_TURN, Movable, MovableScale, type Place } from './Movable';

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
    // The bracket keys turn it, five degrees at a time with shift.
    await userEvent.keyboard(']]');
    await userEvent.keyboard('{Shift>}[[{/Shift}');
    await expect(note.style.getPropertyValue('--movable-rotation')).toBe(`${START.note.rotation! + MOVABLE_KEY_TURN * 2 - MOVABLE_KEY_TURN * 5}deg`);
  },
};

/** Turning: drag the grip at the corner, or the body with Alt held, and the thing turns to face the pointer. */
export const Turning: Story = {
  render: (args) => <Things {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const pen = canvas.getByRole('group', { name: 'Pencil' });
    const box = pen.getBoundingClientRect();
    const centre = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    // A quarter turn of the pointer round the centre is a quarter turn of the thing.
    const grip = pen.querySelector<HTMLElement>('.movable__grip')!;
    pen.focus();
    const at = (angle: number) => ({ clientX: centre.x + 160 * Math.cos(angle), clientY: centre.y + 160 * Math.sin(angle) });
    await userEvent.pointer([
      { keys: '[MouseLeft>]', target: grip, coords: at(0) },
      { coords: at(Math.PI / 8) },
      { coords: at(Math.PI / 4) },
      { coords: at(Math.PI / 2) },
      { keys: '[/MouseLeft]', coords: at(Math.PI / 2) },
    ]);
    await expect(Number.parseFloat(pen.style.getPropertyValue('--movable-rotation'))).toBeCloseTo(START.pen.rotation! + 90, 0);
    await expect(pen.style.getPropertyValue('--movable-x')).toBe(String(START.pen.x));
    await expect(args.onDrop).toHaveBeenCalled();
    // With Alt held, the body turns instead of moving. The pointer is made up here, with Alt on every event.
    const mug = canvas.getByRole('group', { name: 'Mug' });
    const mugBox = mug.getBoundingClientRect();
    const mugCentre = { x: mugBox.left + mugBox.width / 2, y: mugBox.top + mugBox.height / 2 };
    const around = (angle: number) => ({ x: mugCentre.x + 120 * Math.cos(angle), y: mugCentre.y + 120 * Math.sin(angle) });
    const press = (type: string, at: { x: number; y: number }) =>
      mug.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'mouse', isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: at.x, clientY: at.y, altKey: true }));
    press('pointerdown', around(Math.PI / 2));
    press('pointermove', around(Math.PI / 2 + 0.3));
    press('pointermove', around(Math.PI));
    press('pointerup', around(Math.PI));
    await waitFor(() => expect(Number.parseFloat(mug.style.getPropertyValue('--movable-rotation'))).toBeCloseTo(START.mug.rotation! + 90, 0));
    await expect(mug.style.getPropertyValue('--movable-x')).toBe(String(START.mug.x));
  },
};

/** Picked up anywhere, even on a control: a press that moves is a drag, one that stays is the control's click. */
export const GrabAnywhere: Story = {
  args: { grab: 'anywhere' },
  render: (args) => <Things {...args} />,
};
