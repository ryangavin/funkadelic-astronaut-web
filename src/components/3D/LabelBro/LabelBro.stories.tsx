import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Perspective, Solid, STANDING_VIEW } from '../../../behaviors/Perspective/Perspective';
import { LABEL_BRO_FOOT, LABEL_BRO_HEIGHT, LabelBro, type PrintedStrip } from './LabelBro';
import { PrintedLabel } from './PrintedLabel';
import { TAPE_STOCKS, TAPE_WIDTHS, tapeMm, type TapeStock, type TapeWidth } from './tape';

const DESK = '#ead3a7';

const meta = {
  title: 'Library/Components/3D/Label Bro',
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
export const OnTheDesk: Story = {};

/** Blank yellow tape and an empty screen: type on it and the screen counts the label up; press Print and the cutter drops it. */
export const TypeAndPrint: Story = {
  args: { defaultText: '', stock: 'black-on-yellow' },
};

/** A label part-typed on the screen: Backspace takes one off, Clear takes the lot, and Caps latches where Shift does not. */
export const TakeItBack: Story = {
  args: { defaultText: 'LOAD IN' },
};

/** Off, the panel holds nothing at all — no bias on the crystal, no characters. Power is the only key that works. */
export const SwitchedOff: Story = {
  args: { defaultOn: false, defaultText: 'GUEST LIST' },
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
};
