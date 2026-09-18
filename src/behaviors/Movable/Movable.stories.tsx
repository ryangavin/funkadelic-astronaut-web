import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import ryan from '../../../assets/band-13.webp';
import { Mug } from '../../components/3D/Mug/Mug';
import { PaperSheet } from '../../components/2D/PaperSheet/PaperSheet';
import { Pen } from '../../components/3D/Pen/Pen';
import { Polaroid } from '../../components/2D/Polaroid/Polaroid';
import { StickyNote } from '../../components/2D/StickyNote/StickyNote';
import { MOVABLE_KEY_SCALE, MOVABLE_KEY_STEP, MOVABLE_KEY_TURN, Movable, MovableScale, type Place } from './Movable';

const meta = {
  title: 'Foundations/Behaviors/Movable',
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

/** Where the pivot of a thing is drawn, on the screen. */
function pivotOf(thing: HTMLElement) {
  const box = thing.querySelector('.movable__pivot')!.getBoundingClientRect();
  return { x: box.x, y: box.y };
}

/** A point the same distance from the pivot as `from`, swept round it by `degrees`. */
function swept(pivot: { x: number; y: number }, from: { x: number; y: number }, degrees: number) {
  const angle = Math.atan2(from.y - pivot.y, from.x - pivot.x) + (degrees * Math.PI) / 180;
  const reach = Math.hypot(from.x - pivot.x, from.y - pivot.y);
  return { clientX: pivot.x + reach * Math.cos(angle), clientY: pivot.y + reach * Math.sin(angle) };
}

/** Hover to reveal the handles. Take the turn handle round the thing and it follows the pointer. */
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
    const held = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const pivot = pivotOf(pen);
    // The thing turns by however far the handle is taken round the pivot, and by nothing else.
    await user.pointer([
      { keys: '[MouseLeft>]', target: grip, coords: { clientX: held.x, clientY: held.y } },
      { coords: swept(pivot, held, 30) },
      { coords: swept(pivot, held, 90) },
    ]);
    await expect(Number.parseFloat(pen.style.getPropertyValue('--movable-rotation'))).toBeCloseTo(START.pen.rotation! + 90, 1);
    // The handle keeps its place on the box, and the thing has not walked anywhere.
    await expect(grip.getBoundingClientRect().x).toBeCloseTo(box.x, 1);
    await expect(grip.getBoundingClientRect().y).toBeCloseTo(box.y, 1);
    await user.pointer([{ keys: '[/MouseLeft]', coords: swept(pivot, held, 90) }]);
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
    // Alt and a drag on the body turn it the same way, the other way round.
    const mug = canvas.getByRole('group', { name: 'Mug' });
    const centre = pivotOf(mug);
    const grabbed = { x: centre.x + 120, y: centre.y };
    const press = (type: string, at: { clientX: number; clientY: number }) =>
      mug.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'mouse', isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, altKey: true, ...at }));
    press('pointerdown', { clientX: grabbed.x, clientY: grabbed.y });
    press('pointermove', swept(centre, grabbed, -90));
    press('pointerup', swept(centre, grabbed, -90));
    await waitFor(() => expect(Number.parseFloat(mug.style.getPropertyValue('--movable-rotation'))).toBeCloseTo(START.mug.rotation! - 90, 1));
    await expect(mug.style.getPropertyValue('--movable-x')).toBe(String(START.mug.x));
  },
};

/** The size handle: take it out from the thing to enlarge it, in toward it to shrink. */
export const Resizing: Story = {
  render: (args) => <Things {...args} />,
  play: async ({ canvasElement }) => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const canvas = within(canvasElement);
    const note = canvas.getByRole('group', { name: 'Sticky note' });
    const grip = canvas.getByRole('button', { name: 'Resize Sticky note' });
    note.focus();
    await user.hover(note);
    await waitFor(() => expect(getComputedStyle(grip).scale).toBe('1'));
    const pivot = pivotOf(note);
    const box = grip.getBoundingClientRect();
    const held = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const along = (times: number) => ({ clientX: pivot.x + (held.x - pivot.x) * times, clientY: pivot.y + (held.y - pivot.y) * times });
    // Twice as far out from the pivot is twice the size, and the pivot has not budged.
    await user.pointer([
      { keys: '[MouseLeft>]', target: grip, coords: { clientX: held.x, clientY: held.y } },
      { coords: along(1.4) },
      { coords: along(2) },
      { keys: '[/MouseLeft]', coords: along(2) },
    ]);
    await expect(Number(note.style.getPropertyValue('--movable-width').match(/[\d.]+/)![0])).toBeCloseTo(WIDTHS.note * 2, 0);
    await expect(Math.abs(pivotOf(note).x - pivot.x)).toBeLessThan(2);
    await expect(Math.abs(pivotOf(note).y - pivot.y)).toBeLessThan(2);
    // The keyboard resizes it a step at a time from the handle, and with minus and plus anywhere on it.
    grip.focus();
    await user.keyboard('{ArrowDown}');
    await expect(Number(note.style.getPropertyValue('--movable-width').match(/[\d.]+/)![0])).toBeCloseTo(WIDTHS.note * (2 - MOVABLE_KEY_SCALE), 0);
    note.focus();
    await user.keyboard('-');
    await expect(Number(note.style.getPropertyValue('--movable-width').match(/[\d.]+/)![0])).toBeCloseTo(WIDTHS.note * (2 - MOVABLE_KEY_SCALE * 2), 0);
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
    await expect(args.onMove).toHaveBeenCalledWith({ x: 100, y: 100, rotation: 1, scale: 1 });
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
    // It turned by where the pointer went round the card, and it did not move or resize.
    const last = (args.onMove as ReturnType<typeof fn>).mock.calls.at(-1)![0] as Place;
    await expect(last.x).toBe(100);
    await expect(last.y).toBe(100);
    await expect(last.scale).toBe(1);
    await expect(last.rotation).not.toBe(1);
  },
};
