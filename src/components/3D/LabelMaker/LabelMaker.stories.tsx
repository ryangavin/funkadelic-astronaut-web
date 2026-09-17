import { checkDeskStudy } from '../../../behaviors/Perspective/DeskObjectStudy.check';
import { DeskObjectStudy } from '../../../behaviors/Perspective/DeskObjectStudy';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { LABEL_WIDTH_MM, Label } from './Label';
import { PLAN_VIEW, Perspective, Solid, STANDING_VIEW } from '../../../behaviors/Perspective/Perspective';
import { LABEL_COLORS, LABEL_CUTS, LABEL_MAKER_FOOT, LABEL_MAKER_HEIGHT, LabelMaker, type EmittedLabel } from './LabelMaker';
import { TAPE_WIDTH, tapeMm, tapeUnits } from './tape';

const DESK = '#ead3a7';

const meta = {
  title: 'Components/3D/Label Maker',
  component: LabelMaker,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    color: { control: 'inline-radio', options: LABEL_COLORS },
    cutter: { control: 'inline-radio', options: LABEL_CUTS },
    text: { control: 'text' },
    defaultText: { control: 'text' },
    limit: { control: { type: 'range', min: 4, max: 40, step: 1 } },
    rotation: { control: { type: 'range', min: -20, max: 20, step: 0.5 } },
  },
  args: {
    color: 'red',
    cutter: 'straight',
    defaultText: 'TOUR VAN',
    limit: 28,
    rotation: -3,
    onEmit: fn(),
    onTextChange: fn(),
  },
  decorators: [
    (Story, context) =>
      context.parameters.composition ? (
        <Story />
      ) : (
        <div style={{ padding: '64px 48px 64px 240px', background: DESK }}>
          <div style={{ width: 560, maxWidth: '100%' }}>
            <Story />
          </div>
        </div>
      ),
  ],
} satisfies Meta<typeof LabelMaker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The machine on the desk with a strip already run out of it. Type, or turn the wheel and squeeze. */
export const OnTheDesk: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const machine = canvas.getByRole('group', { name: /^Label maker, red tape, the tape reads TOUR VAN$/ });

    // 180 by 150 millimetres of moulded plastic. Measured off the layout rather
    // than the painted box, which the machine's tilt would otherwise widen.
    await expect(machine.offsetHeight / machine.offsetWidth).toBeCloseTo(600 / 720, 2);

    // The strip is 3/8 of an inch across and a character's pitch longer for
    // every character, both measured against the machine that made it.
    const strip = canvas.getByRole('img', { name: 'Embossed red label: TOUR VAN' });
    await expect(strip.offsetHeight / machine.offsetWidth).toBeCloseTo(TAPE_WIDTH / 720, 2);
    await expect(strip.offsetWidth / machine.offsetWidth).toBeCloseTo(tapeUnits('TOUR VAN') / 720, 2);
    await expect(tapeMm('TOUR VAN')).toBe(50);

    // The wheel carries 45 dies and stands at A until it is turned.
    await expect(within(canvas.getByRole('group', { name: 'Character wheel' })).getAllByRole('button')).toHaveLength(45);
    await expect(canvas.getByRole('button', { name: 'A' })).toHaveAttribute('aria-pressed', 'true');
  },
};

/** Typing a label, then cutting it off: the strip grows, then drops off the machine. */
export const TypeAndCut: Story = {
  args: { defaultText: '', color: 'blue', rotation: 0 },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button', { name: 'A' }).focus();
    await userEvent.keyboard('RIDER');

    await expect(args.onTextChange).toHaveBeenLastCalledWith('RIDER');
    await expect(canvas.getByRole('status').textContent).toContain('the tape reads RIDER');
    await expect(canvas.getByRole('button', { name: 'R' })).toHaveAttribute('aria-pressed', 'true');

    // Five characters out of the slot, plus a character's blank at each end,
    // once the tape has finished pushing out of the machine.
    const machine = canvas.getByRole('group', { name: /^Label maker, blue tape/ });
    const strip = canvas.getByRole('img', { name: 'Embossed blue label: RIDER' });
    await waitFor(() => expect(strip.offsetWidth / machine.offsetWidth).toBeCloseTo(tapeUnits('RIDER') / 720, 2));
    await expect(strip.offsetHeight / machine.offsetWidth).toBeCloseTo(TAPE_WIDTH / 720, 2);

    await userEvent.click(canvas.getByRole('button', { name: 'Cut off the label reading RIDER' }));
    await expect(args.onEmit).toHaveBeenCalledTimes(1);
    await expect(args.onEmit).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'RIDER', color: 'blue', cut: 'straight', lengthMm: 35 }),
    );

    // What is left in the machine is a fresh leader with nothing on it.
    await expect(canvas.getByRole('img', { name: 'A blank strip of blue tape' })).toBeInTheDocument();
  },
};

/** Turning the wheel by hand and squeezing the handle, the way it was meant to be used. */
export const WheelAndTrigger: Story = {
  args: { defaultText: '', color: 'green', rotation: 0 },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'V' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Squeeze: emboss V' }));
    await userEvent.click(canvas.getByRole('button', { name: 'I' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Squeeze: emboss I' }));
    await expect(args.onTextChange).toHaveBeenLastCalledWith('VI');

    // Arrow keys walk the wheel round a die at a time, as a thumb on the rim does.
    canvas.getByRole('button', { name: 'I' }).focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    await expect(canvas.getByRole('button', { name: 'K' })).toHaveAttribute('aria-pressed', 'true');

    // Backspace winds the last character back off, which no real one will do.
    await userEvent.keyboard('{Backspace}');
    await expect(args.onTextChange).toHaveBeenLastCalledWith('V');
  },
};

/** The blade that leaves a wavy end. Two labels cut in a row nest into each other. */
export const ScallopedCut: Story = {
  args: { cutter: 'scalloped', color: 'green', defaultText: 'BACKLINE' },
};

/** The four colours the tape came in. */
export const Rolls: Story = {
  parameters: { composition: true },
  render: (args) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48, padding: 64, background: DESK, justifyContent: 'center' }}>
      {LABEL_COLORS.map((color) => (
        <div key={color} style={{ width: 340 }}>
          <LabelMaker {...args} color={color} defaultText={color.toUpperCase()} rotation={0} />
        </div>
      ))}
    </div>
  ),
};

/** Yesterday's labels, cut off and left lying about. Each one is what `onEmit` handed over. */
export const CutAndLoose: Story = {
  parameters: { composition: true },
  render: () => {
    const loose: (EmittedLabel & { rotation: number })[] = [
      { id: '1', text: 'LOAD IN 4PM', color: 'red', cut: 'straight', lengthMm: tapeMm('LOAD IN 4PM'), rotation: -4 },
      { id: '2', text: 'GUEST LIST', color: 'black', cut: 'scalloped', lengthMm: tapeMm('GUEST LIST'), rotation: 3 },
      { id: '3', text: 'DO NOT MOVE', color: 'blue', cut: 'straight', lengthMm: tapeMm('DO NOT MOVE'), rotation: -1.5 },
      { id: '4', text: "RIDER'S BIN", color: 'green', cut: 'scalloped', lengthMm: tapeMm("RIDER'S BIN"), rotation: 6 },
      { id: '5', text: 'SPARE FUSES', color: 'red', cut: 'scalloped', lengthMm: tapeMm('SPARE FUSES'), rotation: -8 },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 26, alignItems: 'flex-start', padding: 64, background: DESK }}>
        {loose.map((strip) => (
          // Three pixels to the millimetre keeps them all at one scale.
          <div key={strip.id} style={{ width: strip.lengthMm * 3 }}>
            <Label {...strip} />
          </div>
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const strips = canvas.getAllByRole('img');
    await expect(strips).toHaveLength(5);
    // Every strip is the same 9.5 millimetres across whatever is on it, and at
    // three pixels to the millimetre that is the same 28 and a half pixels.
    for (const strip of strips) await expect(Math.abs(strip.offsetHeight - LABEL_WIDTH_MM * 3)).toBeLessThanOrEqual(1);
  },
};

function Bench({ color, cutter }: { color: EmittedLabel['color']; cutter: EmittedLabel['cut'] }) {
  const [cut, setCut] = useState<EmittedLabel[]>([]);
  return (
    <div style={{ display: 'flex', gap: 48, padding: 64, background: DESK, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ width: 460 }}>
        <LabelMaker color={color} cutter={cutter} rotation={-2} onEmit={(strip) => setCut((made) => [strip, ...made])} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 40, minWidth: 220 }}>
        {cut.map((strip, index) => (
          <div key={strip.id} style={{ width: strip.lengthMm * 3 }}>
            <Label {...strip} rotation={index % 2 ? 2.5 : -3} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Make some: type a label, drop the cut lever, and it lands on the pile beside the machine. */
export const KeepCutting: Story = {
  parameters: { composition: true },
  render: (args) => <Bench color={args.color ?? 'red'} cutter={args.cutter ?? 'straight'} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button', { name: 'A' }).focus();
    await userEvent.keyboard('AMP 2');
    await userEvent.click(canvas.getByRole('button', { name: 'Cut off the label reading AMP 2' }));
    await expect(canvas.getByRole('img', { name: 'Embossed red label: AMP 2' })).toBeInTheDocument();
    await expect(canvas.getByRole('img', { name: 'A blank strip of red tape' })).toBeInTheDocument();
  },
};

/**
 * The same drawing, on a plane tilted to the angle someone standing at the desk
 * sees it from. Nothing here is redrawn: the machine's 32 mm are declared, not
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
          <div style={{ position: 'absolute', left: '34%', top: '30%', width: '44%' }}>
            <Solid height={LABEL_MAKER_HEIGHT} foot={LABEL_MAKER_FOOT}>
              <LabelMaker {...args} />
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

export const OnDesk: Story = {
  play: checkDeskStudy,
  name: 'On desk',
  parameters: { layout: 'fullscreen', composition: true },
  render: (args) => <DeskObjectStudy name="Label maker" widthMm={180} depthRatio={600/720} heightMm={32} solid={{ height: LABEL_MAKER_HEIGHT, foot: LABEL_MAKER_FOOT }} shapes={[{ path: "M34 0C64 -2 77 20 69 42L91 76Q99 98 73 100L46 62Q20 66 15 42C6 20 13 3 34 0Z" }]}><LabelMaker {...args} rotation={0} /></DeskObjectStudy>,
};
