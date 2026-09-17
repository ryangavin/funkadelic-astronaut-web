import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { PLAN_VIEW, Perspective, Solid, STANDING_VIEW } from '../../../behaviors/Perspective/Perspective';
import { LABEL_BRO_FOOT, LABEL_BRO_HEIGHT, LabelBro, type PrintedStrip } from './LabelBro';
import { PrintedLabel } from './PrintedLabel';
import { TAPE_STOCKS, TAPE_WIDTHS, tapeMm, type TapeStock, type TapeWidth } from './tape';

const DESK = '#ead3a7';

const meta = {
  title: 'Components/3D/Label Bro',
  component: LabelBro,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    width: { control: 'inline-radio', options: TAPE_WIDTHS },
    stock: { control: 'inline-radio', options: TAPE_STOCKS },
    margin: { control: 'inline-radio', options: ['full', 'small'] },
    text: { control: 'text' },
    defaultText: { control: 'text' },
    limit: { control: { type: 'range', min: 8, max: 48, step: 1 } },
    rotation: { control: { type: 'range', min: -20, max: 20, step: 0.5 } },
  },
  args: {
    width: 12,
    stock: 'black-on-white',
    margin: 'full',
    defaultText: 'BACKLINE',
    limit: 32,
    rotation: -2,
    defaultOn: true,
    onPrint: fn(),
    onTextChange: fn(),
  },
  decorators: [
    (Story, context) =>
      context.parameters.composition ? (
        <Story />
      ) : (
        // Room at the left for the tape standing out of the slot, which is
        // outside the machine's own box and would otherwise be clipped.
        <div style={{ padding: '48px 40px 48px 90px', background: DESK }}>
          <div style={{ width: 460, maxWidth: '100%' }}>
            <Story />
          </div>
        </div>
      ),
  ],
} satisfies Meta<typeof LabelBro>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The machine on the desk with a label queued on the screen. Type on it, or press Print. */
export const OnTheDesk: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const machine = canvas.getByRole('group', { name: /^Label printer, 12 millimetre black on white tape, the screen reads BACKLINE$/ });

    // 183 by 193 millimetres of moulded plastic. Measured off the layout rather
    // than the painted box, which the machine's tilt would otherwise widen.
    await expect(machine.offsetHeight / machine.offsetWidth).toBeCloseTo(772 / 732, 2);

    // A whole QWERTY is a whole QWERTY: every letter is a key you can press.
    for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      await expect(canvas.getByRole('button', { name: letter })).toBeInTheDocument();
    }

    // Nothing has been printed, so the slot holds a blank run of leader.
    await expect(canvas.getByRole('img', { name: 'A blank strip of 12 mm black on white tape' })).toBeInTheDocument();
  },
};

/** Type on it and the screen counts the label up as you go; press Print and the cutter drops it. */
export const TypeAndPrint: Story = {
  args: { defaultText: '', stock: 'black-on-yellow' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button', { name: 'A' }).focus();
    await userEvent.keyboard('BACKLINE');

    await expect(canvas.getByRole('group', { name: /the screen reads BACKLINE$/ })).toBeInTheDocument();
    await expect(args.onTextChange).toHaveBeenLastCalledWith('BACKLINE');

    await userEvent.click(canvas.getByRole('button', { name: 'Print' }));
    await expect(canvas.getByRole('img', { name: 'Printed label, black on yellow, 12 mm: BACKLINE' })).toBeInTheDocument();

    // What came off the machine knows its own length, which is what anyone
    // laying it on a desk beside the others needs.
    await expect(args.onPrint).toHaveBeenCalledWith(expect.objectContaining({ text: 'BACKLINE', width: 12, stock: 'black-on-yellow', lengthMm: tapeMm('BACKLINE', 12) }));
  },
};

/** Backspace takes one off, Clear takes the lot, and Caps latches where Shift does not. */
export const TakeItBack: Story = {
  args: { defaultText: 'LOAD IN' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Backspace' }));
    await expect(canvas.getByRole('group', { name: /the screen reads LOAD I$/ })).toBeInTheDocument();

    // Caps is a latch: it stays down until it is pressed again.
    const caps = canvas.getByRole('button', { name: 'Caps' });
    await expect(caps).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(caps);
    await expect(caps).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(canvas.getByRole('button', { name: 'Clear the label' }));
    await expect(canvas.getByRole('group', { name: /^Label printer, 12 millimetre black on white tape$/ })).toBeInTheDocument();
  },
};

/** Off, the panel holds nothing at all — no bias on the crystal, no characters. */
export const SwitchedOff: Story = {
  args: { defaultOn: false, defaultText: 'GUEST LIST' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const glass = canvasElement.querySelector<HTMLElement>('.label-bro__glass')!;
    await expect(getComputedStyle(glass).visibility).toBe('hidden');

    // The power key is the only one that does anything while it is off.
    await userEvent.click(canvas.getByRole('button', { name: 'Power' }));
    await waitFor(() => expect(getComputedStyle(glass).visibility).toBe('visible'));
  },
};

/** The five cassettes a working desk keeps, each with the same words on it. */
export const Cassettes: Story = {
  parameters: { composition: true },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, alignItems: 'flex-start', padding: 56, background: DESK }}>
      {TAPE_STOCKS.map((stock: TapeStock) => (
        // Four pixels to the millimetre keeps every strip at one scale.
        <div key={stock} style={{ width: tapeMm('STAGE LEFT', 12) * 4 }}>
          <PrintedLabel text="STAGE LEFT" stock={stock} width={12} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('img')).toHaveLength(TAPE_STOCKS.length);
  },
};

/**
 * Every cassette the machine takes, with the same label on each. The print band
 * is three quarters of the tape whatever the tape is, so a wider cassette buys
 * taller type and a longer label, not more margin.
 */
export const Widths: Story = {
  parameters: { composition: true },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'flex-start', padding: 56, background: DESK }}>
      {TAPE_WIDTHS.map((width: TapeWidth) => (
        <div key={width} style={{ width: tapeMm('MERCH', width) * 4 }}>
          <PrintedLabel text="MERCH" width={width} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const strips = canvas.getAllByRole('img');
    await expect(strips).toHaveLength(TAPE_WIDTHS.length);
    // Every strip is as many millimetres across as its cassette, and at four
    // pixels to the millimetre that is four times the number on the box.
    strips.forEach((strip, index) => expect(Math.abs(strip.offsetHeight - TAPE_WIDTHS[index] * 4)).toBeLessThanOrEqual(1));
  },
};

/** Yesterday's labels, printed and cut and left lying about. Each one is what `onPrint` handed over. */
export const PrintedAndLoose: Story = {
  parameters: { composition: true },
  render: () => {
    const loose: (PrintedStrip & { rotation: number })[] = [
      { id: '1', text: 'LOAD IN 4PM', width: 12, stock: 'black-on-white', margin: 'full', lengthMm: tapeMm('LOAD IN 4PM', 12), rotation: -4 },
      { id: '2', text: 'GUEST LIST', width: 18, stock: 'black-on-yellow', margin: 'full', lengthMm: tapeMm('GUEST LIST', 18), rotation: 3 },
      { id: '3', text: 'DO NOT MOVE', width: 12, stock: 'white-on-red', margin: 'full', lengthMm: tapeMm('DO NOT MOVE', 12), rotation: -1.5 },
      { id: '4', text: 'DRESSING RM 2', width: 9, stock: 'white-on-black', margin: 'small', lengthMm: tapeMm('DRESSING RM 2', 9, 'small'), rotation: 6 },
      { id: '5', text: 'SPARE FUSES', width: 6, stock: 'black-on-white', margin: 'full', lengthMm: tapeMm('SPARE FUSES', 6), rotation: -8 },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 26, alignItems: 'flex-start', padding: 64, background: DESK }}>
        {loose.map((strip) => (
          <div key={strip.id} style={{ width: strip.lengthMm * 4 }}>
            <PrintedLabel {...strip} />
          </div>
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('img')).toHaveLength(5);
  },
};

function Bench({ width, stock }: { width: TapeWidth; stock: TapeStock }) {
  const [printed, setPrinted] = useState<PrintedStrip[]>([]);
  return (
    <div style={{ display: 'flex', gap: 48, padding: 64, background: DESK, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ width: 440 }}>
        <LabelBro width={width} stock={stock} rotation={-2} defaultText="" onPrint={(strip) => setPrinted((made) => [strip, ...made])} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingTop: 40, minWidth: 220 }}>
        {printed.map((strip, index) => (
          <div key={strip.id} style={{ width: strip.lengthMm * 4 }}>
            <PrintedLabel {...strip} rotation={index % 2 ? 2.5 : -3} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Make some: type a label, press Print, and it lands on the pile beside the machine. */
export const KeepPrinting: Story = {
  parameters: { composition: true },
  render: (args) => <Bench width={args.width ?? 12} stock={args.stock ?? 'black-on-white'} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button', { name: 'A' }).focus();
    await userEvent.keyboard('AMP2');
    await userEvent.click(canvas.getByRole('button', { name: 'Print' }));
    // One on the pile, and the same one still sitting in the exit slot.
    await expect(canvas.getAllByRole('img', { name: 'Printed label, black on white, 12 mm: AMP2' })).toHaveLength(2);
  },
};

/**
 * The same drawing, on a plane tilted to the angle someone standing at the desk
 * sees it from. Nothing here is redrawn: the machine's 78 mm are declared, not
 * drawn, and a `Solid` of that height lifts the whole top face and slides the
 * side out from under it. The tape has no height to speak of and stays flat.
 */
export const OnATiltedDesk: Story = {
  parameters: { composition: true, layout: 'fullscreen' },
  args: { rotation: -4, defaultText: 'LOAD IN 4PM' },
  render: (args) => (
    <div style={{ background: '#241c15', padding: '32px 0 56px' }}>
      <Perspective angle={STANDING_VIEW}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '1440 / 1020', background: DESK }}>
          <div style={{ position: 'absolute', left: '32%', top: '22%', width: '42%' }}>
            <Solid localCoordinates height={LABEL_BRO_HEIGHT} foot={LABEL_BRO_FOOT}>
              <LabelBro {...args} />
            </Solid>
          </div>
        </div>
      </Perspective>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const body = canvasElement.querySelector<HTMLElement>('.solid')!;
    // Tilted, the top face has somewhere to go; in plan it has none, which is
    // the whole of the rule: the drawing never changes, only the plane does.
    await waitFor(() => expect(Number(body.style.getPropertyValue('--solid-rise'))).toBeGreaterThan(0));
    await expect(STANDING_VIEW).toBeLessThan(PLAN_VIEW);
  },
};
