import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import ryan from '../../../assets/band-13.webp';
import { Mug } from '../../components/3D/Mug/Mug';
import { PaperSheet } from '../../components/2D/PaperSheet/PaperSheet';
import { Pen } from '../../components/3D/Pen/Pen';
import { Polaroid } from '../../components/2D/Polaroid/Polaroid';
import { StickyNote } from '../../components/2D/StickyNote/StickyNote';
import { MOVABLE_KEY_STEP, MOVABLE_KEY_TURN, MOVABLE_SCRUB_TURN, Movable, MovableScale, type Place } from './Movable';

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

/** Hover to reveal the fixed upper-right grip. Scrub horizontally, release, then leave and hover again. */
export const Turning: Story = {
  render: (args) => <Things {...args} />,
  play: async ({ canvasElement, args }) => {
    // Real pointers can leave a handle after it becomes non-interactive on release.
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const canvas = within(canvasElement);
    const pen = canvas.getByRole('group', { name: 'Pencil' });
    const grip = canvas.getByRole('button', { name: 'Rotate Pencil' });
    pen.focus();
    await user.hover(pen);
    // Let the hover reveal finish before measuring the fixed handle.
    await waitFor(() => expect(getComputedStyle(grip).scale).toBe('1'));
    const box = grip.getBoundingClientRect();
    const at = (dx: number, dy = 0) => ({ clientX: box.x + box.width / 2 + dx, clientY: box.y + box.height / 2 + dy });
    await user.pointer([
      { keys: '[MouseLeft>]', target: grip, coords: at(0) },
      { coords: at(40, 70) },
      { coords: at(180, 70) },
    ]);
    await expect(Number.parseFloat(pen.style.getPropertyValue('--movable-rotation'))).toBe(START.pen.rotation! + 180 * MOVABLE_SCRUB_TURN);
    await expect(grip.getBoundingClientRect().x).toBeCloseTo(box.x, 1);
    await expect(grip.getBoundingClientRect().y).toBeCloseTo(box.y, 1);
    await user.pointer([{ keys: '[/MouseLeft]', coords: at(180, 70) }]);
    await expect(pen.style.getPropertyValue('--movable-x')).toBe(String(START.pen.x));
    await expect(pen.style.getPropertyValue('--movable-y')).toBe(String(START.pen.y));
    await expect(args.onDrop).toHaveBeenCalledTimes(1);
    await expect(getComputedStyle(grip).opacity).toBe('0');
    await expect(pen).toHaveAttribute('data-grip-dismissed');
    await user.unhover(pen);
    await user.hover(pen);
    await expect(pen).not.toHaveAttribute('data-grip-dismissed');
    grip.focus();
    await user.keyboard('{ArrowLeft}{Shift>}{ArrowRight}{/Shift}');
    await expect(Number.parseFloat(pen.style.getPropertyValue('--movable-rotation'))).toBe(START.pen.rotation! + 90 + 4);
    await expect(pen.style.getPropertyValue('--movable-x')).toBe(String(START.pen.x));
    // Alt-drag uses the same horizontal scrub, including leftward travel.
    const mug = canvas.getByRole('group', { name: 'Mug' });
    const press = (type: string, dx: number) =>
      mug.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'mouse', isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: 900 + dx, clientY: 200, altKey: true }));
    press('pointerdown', 0);
    press('pointermove', -180);
    press('pointerup', -180);
    await waitFor(() => expect(Number.parseFloat(mug.style.getPropertyValue('--movable-rotation'))).toBe(START.mug.rotation! - 90));
    await expect(mug.style.getPropertyValue('--movable-x')).toBe(String(START.mug.x));
  },
};

/** Picked up anywhere, even on a control: a press that moves is a drag, one that stays is the control's click. */
export const GrabAnywhere: Story = {
  args: { grab: 'anywhere' },
  render: (args) => <Things {...args} />,
};

/** Controls inside the object keep their clicks and keyboard input. */
export const ChildControls: Story = {
  args: { onMove: fn() },
  render: (args) => (
    <Movable {...args} x={100} y={100} width={300} unit="1px" label="Control card">
      <div style={{ padding: 24, background: '#fbfaf7', minHeight: 160 }}>
        <button type="button" onClick={args.onDrop}>Child action</button>
        <input aria-label="Card text" defaultValue="Edit me" />
      </div>
    </Movable>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Child action' }));
    await expect(args.onDrop).toHaveBeenCalledTimes(1);
    const input = canvas.getByRole('textbox', { name: 'Card text' });
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowLeft}[[]');
    await expect(args.onMove).not.toHaveBeenCalled();
    const grip = canvas.getByRole('button', { name: 'Rotate Control card' });
    grip.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(args.onMove).toHaveBeenCalledWith({ x: 100, y: 100, rotation: 1 });
    // A cancelled rotation settles and dismisses its handle without moving the card.
    const card = canvas.getByRole('group', { name: 'Control card' });
    const pointer = (type: string, clientX: number) => grip.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, pointerId: 17, pointerType: 'mouse', button: 0, clientX, clientY: 100,
    }));
    pointer('pointerdown', 100);
    pointer('pointermove', 140);
    pointer('pointercancel', 140);
    await waitFor(() => expect(card).not.toHaveAttribute('data-dragging'));
    await expect(card).toHaveAttribute('data-grip-dismissed');
    await expect(args.onMove).toHaveBeenLastCalledWith({ x: 100, y: 100, rotation: 20 });
  },
};
