import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import demoTape from '../../../../assets/audio/demo-tape.mp3';
import festivalSketch from '../../../../assets/festival-scribble-fully-shaded.png';
import { Perspective, STANDING_VIEW, Solid } from '../../../behaviors/Perspective/Perspective';
import { Desk } from '../Desk/Desk';
import { PaperSheet } from '../../2D/PaperSheet/PaperSheet';
import { Pin } from '../../2D/Pin/Pin';
import { DESK_PHONE_FINISHES, DESK_PHONE_FOOT, DESK_PHONE_HEIGHT, DeskPhone, MACHINE_HEIGHT, SET_HEIGHT, type DeskPhoneMessage } from './DeskPhone';
import { DIAL_OFFSET, DIAL_PITCH, DIAL_SPEED, PULSE_RATE, pulsesFor, returnMs, travelFor } from './pulses';

/* Three things off the tape. The band will record their own over these; all the
   machine wants of an entry is a caller, a time and something to play. */
const MESSAGES: DeskPhoneMessage[] = [
  { caller: 'Marguerite at the Pond Room', time: 'Tue 9.14am', src: demoTape },
  { caller: 'Dill — sound, Barrier Brewing', time: 'Tue 6.02pm', src: demoTape },
  { caller: 'unknown number', time: 'Wed 1.41am', src: demoTape },
];

const meta = {
  title: 'Components/3D/DeskPhone',
  component: DeskPhone,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    finish: { control: 'inline-radio', options: DESK_PHONE_FINISHES },
    number: { control: 'text' },
    rotation: { control: { type: 'range', min: -20, max: 20, step: 0.5 } },
    volume: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    offHook: { control: 'boolean' },
    sound: { control: 'boolean' },
    messages: { control: 'object' },
  },
  args: {
    messages: MESSAGES,
    number: '718 555 0164',
    finish: 'black',
    rotation: -2,
    offHook: false,
    volume: 0.8,
    sound: true,
    onPulse: fn(),
    onDigit: fn(),
    onHook: fn(),
    onPlay: fn(),
    onMessageEnded: fn(),
    onStop: fn(),
    onEnded: fn(),
  },
  decorators: [
    (Story, context) =>
      context.parameters.composition ? (
        <Story />
      ) : (
        <div style={{ padding: 56, background: '#ead3a7' }}>
          <div style={{ width: 760, maxWidth: '100%' }}>
            <Story />
          </div>
        </div>
      ),
  ],
} satisfies Meta<typeof DeskPhone>;

export default meta;
type Story = StoryObj<typeof meta>;

const parts = (canvasElement: HTMLElement) => {
  const root = canvasElement.querySelector<HTMLElement>('.desk-phone')!;
  return {
    root,
    set: canvasElement.querySelector<HTMLElement>('.desk-phone__set')!,
    dial: canvasElement.querySelector<HTMLElement>('.desk-phone__dial')!,
    handset: canvasElement.querySelector<HTMLElement>('.desk-phone__handset')!,
    machine: canvasElement.querySelector<HTMLElement>('.desk-phone__machine')!,
    readout: canvasElement.querySelector<HTMLElement>('.desk-phone__readout')!,
    line: root.querySelector<HTMLElement>(':scope > .desk-phone__status')!,
  };
};

/** The booking line as it sits: handset down, three messages waiting, and every part the size it is in millimetres. */
export const BookingLine: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const { root, set, dial, handset, machine } = parts(canvasElement);

    await expect(canvas.getByRole('group', { name: 'Desk phone: 718 555 0164' })).toBeInTheDocument();

    // The whole plan is 560 by 300 millimetres of desk.
    await expect(root.offsetHeight / root.offsetWidth).toBeCloseTo(300 / 560, 2);
    // The 500's housing is 221 across and 229 deep.
    await expect(set.offsetWidth / root.offsetWidth).toBeCloseTo(221 / 560, 2);
    await expect(set.offsetHeight / set.offsetWidth).toBeCloseTo(229 / 221, 2);
    // The handset is 216 cap to cap: it very nearly spans the housing.
    await expect(handset.offsetWidth / set.offsetWidth).toBeCloseTo(216 / 221, 2);
    // The No. 9 dial is drawn in a 118-millimetre square, and is square.
    await expect(dial.offsetWidth / set.offsetWidth).toBeCloseTo(118 / 221, 2);
    await expect(dial.offsetHeight).toBe(dial.offsetWidth);
    // The machine is 230 across and 200 deep.
    await expect(machine.offsetWidth / root.offsetWidth).toBeCloseTo(230 / 560, 2);
    await expect(machine.offsetHeight / machine.offsetWidth).toBeCloseTo(200 / 230, 2);

    // Ten finger holes, and on the cradle none of them does anything.
    await expect(canvas.getAllByRole('button', { name: /^Dial / })).toHaveLength(10);
    await expect(canvas.getByRole('button', { name: 'Dial 5 J K L' })).toBeDisabled();
  },
};

/** Lift the handset and dial a five: the wheel winds to the stop, the governor brings it back, and the line breaks five times. */
export const Dialling: Story = {
  args: { rotation: 0 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const { root, line } = parts(canvasElement);

    // The No. 9's arithmetic: 30 degrees a hole, 10 pulses a second, so 300 a second on the way back.
    await expect(travelFor(5)).toBe(DIAL_OFFSET + DIAL_PITCH * 4);
    await expect(travelFor(0)).toBe(310);
    await expect(DIAL_SPEED).toBe(DIAL_PITCH * PULSE_RATE);
    await expect(Math.round(returnMs(travelFor(0)))).toBe(1033);
    // Pulses are counted out of the arc, so a finger that slips dials short.
    await expect(pulsesFor(travelFor(5))).toBe(5);
    await expect(pulsesFor(travelFor(5) - DIAL_PITCH)).toBe(4);
    await expect(pulsesFor(DIAL_OFFSET - 1)).toBe(0);

    await userEvent.click(canvas.getByRole('button', { name: 'Lift the handset' }));
    await expect(args.onHook).toHaveBeenCalledWith(true);
    await expect(line.textContent).toBe('Dial tone');
    await expect(canvas.getByRole('button', { name: 'Dial 5 J K L' })).toBeEnabled();

    await userEvent.click(canvas.getByRole('button', { name: 'Dial 5 J K L' }));
    await waitFor(() => expect(args.onDigit).toHaveBeenCalledWith(5, '5'), { timeout: 5000 });
    // Five holes past the stop is five breaks of the line.
    await expect(args.onPulse).toHaveBeenCalledTimes(5);
    await expect(args.onPulse).toHaveBeenCalledWith(5, 5);
    await expect(root).toHaveAttribute('data-pulses', '5');
    await expect(root).toHaveAttribute('data-dialled', '5');
    await expect(line.textContent).toBe('Dialled 5');

    // Putting it back drops the call and everything dialled with it.
    await userEvent.click(canvas.getByRole('button', { name: 'Hang up' }));
    await expect(root).not.toHaveAttribute('data-dialled');
    await expect(line.textContent).toBe('Handset on the cradle');
  },
};

/** Play walks the tape and the counter walks with it; skip and back step between messages. */
export const Playback: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const { readout, machine } = parts(canvasElement);
    const status = within(machine).getByRole('status');

    // At rest the LED shows the tally.
    await expect(readout).toHaveAttribute('data-reading', '3');
    await expect(status.textContent).toBe('3 messages waiting');

    await userEvent.click(canvas.getByRole('button', { name: 'Play messages' }));
    await expect(args.onPlay).toHaveBeenCalledWith(MESSAGES[0], 0);
    // The counter stops counting the tape and starts counting through it.
    await waitFor(() => expect(readout.getAttribute('data-reading')).toMatch(/1$/));

    await userEvent.click(canvas.getByRole('button', { name: 'Skip to next message' }));
    await expect(readout).toHaveAttribute('data-reading', '2');
    await userEvent.click(canvas.getByRole('button', { name: 'Back one message' }));
    await expect(readout).toHaveAttribute('data-reading', '1');

    // Stop halts it; stop again winds back to the top and the tally returns.
    await userEvent.click(canvas.getByRole('button', { name: 'Stop' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Stop' }));
    await expect(readout).toHaveAttribute('data-reading', '3');
    await expect(canvas.getByRole('button', { name: 'Play messages' })).toHaveAttribute('aria-pressed', 'false');
  },
};

/** Nobody has called: the counter reads nought, the lamp is dark and the keys do nothing. */
export const EmptyTape: Story = {
  args: { messages: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const { readout, machine } = parts(canvasElement);
    await expect(readout).toHaveAttribute('data-reading', '0');
    await expect(within(machine).getByRole('status').textContent).toBe('No messages');
    await expect(canvas.getByRole('button', { name: 'Play messages' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Skip to next message' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Stop' })).toBeDisabled();
    // The phone is still a phone.
    await expect(canvas.getByRole('button', { name: 'Lift the handset' })).toBeEnabled();
  },
};

/** A message whose recording is not there: the machine says so on the LED and stops rather than pretending. */
export const BadRecording: Story = {
  args: {
    messages: [{ caller: 'whoever this was', time: 'Thu 11.20pm', src: '/assets/audio/nothing-here.mp3' }],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const { readout, machine } = parts(canvasElement);
    const status = within(machine).getByRole('status');
    await expect(readout).toHaveAttribute('data-reading', '1');
    await userEvent.click(canvas.getByRole('button', { name: 'Play messages' }));
    await waitFor(() => expect(status.textContent).toBe('Message 1 would not play'), { timeout: 5000 });
    await expect(readout).toHaveAttribute('data-reading', 'E1');
    // The keys still work: you can walk past it.
    await expect(canvas.getByRole('button', { name: 'Skip to next message' })).toBeEnabled();
  },
};

/** The handset up, the plungers risen, the dial live. */
export const OffHook: Story = {
  args: { offHook: true, rotation: 3 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Hang up' })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', { name: 'Dial 0 O P E R A T O R' })).toBeEnabled();
  },
};

/** What the declared height is worth. The plan never changes; a Solid's two numbers, handed over by hand here, grow the flanks out from under the top faces. */
export const Raised: Story = {
  parameters: { composition: true },
  args: { rotation: 0 },
  render: (args) => (
    <div style={{ display: 'grid', gap: 40, padding: 56, background: '#ead3a7', justifyItems: 'center' }}>
      {[0, 0.08, 0.17].map((rise) => (
        <div key={rise} style={{ width: 620, maxWidth: '100%', '--solid-rise': rise, '--solid-splay': rise * 0.5 } as CSSProperties}>
          <DeskPhone {...args} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    // 137 millimetres against the 560 this drawing is wide.
    await expect(DESK_PHONE_HEIGHT).toBeCloseTo(SET_HEIGHT / 560, 6);

    const sets = [...canvasElement.querySelectorAll<HTMLElement>('.desk-phone')];
    const flank = (root: HTMLElement, part: string) => root.querySelector<HTMLElement>(part)!.getBoundingClientRect().height;
    const [flat, , tipped] = sets;

    // Straight down, a side is worth nothing at all: one millimetre of waist and no more.
    await expect(flank(flat, '.desk-phone__set-wall')).toBeLessThan(2);
    await expect(flank(flat, '.desk-phone__machine-wall')).toBeLessThan(2);
    // Tipped, it grows, and the set's top face has gone up the surface with it.
    await expect(flank(tipped, '.desk-phone__set-wall')).toBeGreaterThan(40);
    await expect(tipped.querySelector('.desk-phone__set')!.getBoundingClientRect().top).toBeLessThan(
      tipped.querySelector('.desk-phone__set-foot')!.getBoundingClientRect().top,
    );
    // The machine is 65 against the set's 137, so its flank is that share of the set's.
    await expect(flank(tipped, '.desk-phone__machine-wall') / flank(tipped, '.desk-phone__set-wall')).toBeCloseTo(MACHINE_HEIGHT / SET_HEIGHT, 1);
  },
};

/** The whole path, not a simulation of it: the desk tipped to a standing view and the drawing stood in a Solid of its real height at its real foot. */
export const OnATiltedDesk: Story = {
  parameters: { composition: true, layout: 'fullscreen' },
  args: { rotation: 0, finish: 'black' },
  render: (args) => (
    <div style={{ background: '#1a1512', padding: '32px 0 56px' }}>
      <Perspective angle={STANDING_VIEW}>
        {/* The top is deeper than the frame because depth foreshortens. */}
        <Desk height={1020} edge={0}>
          {/* Set down at an angle, so the turn Solid hands back is worth something. */}
          <Pin x={400} y={470} width={660} rotation={-7}>
            <Solid height={DESK_PHONE_HEIGHT} foot={DESK_PHONE_FOOT}>
              <DeskPhone {...args} />
            </Solid>
          </Pin>
        </Desk>
      </Perspective>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const solid = canvasElement.querySelector<HTMLElement>('.solid')!;
    // The behaviour measures the lift and hands it over; nothing here is set by hand.
    await waitFor(() => expect(Number(solid.style.getPropertyValue('--solid-rise'))).toBeGreaterThan(0));

    const flank = (part: string) => canvasElement.querySelector<HTMLElement>(part)!.getBoundingClientRect().height;
    await expect(flank('.desk-phone__set-wall')).toBeGreaterThan(6);
    // The machine is less than half the set's height, so its flank is the shallower one.
    await expect(flank('.desk-phone__machine-wall')).toBeLessThan(flank('.desk-phone__set-wall'));

    // Laid at an angle, the top face is turned back on to it and the flank is not:
    // the shear can only be measured the way the surface runs.
    const turn = Number.parseFloat(solid.style.getPropertyValue('--solid-turn'));
    await expect(Math.abs(turn)).toBeGreaterThan(1);
    const set = canvasElement.querySelector<HTMLElement>('.desk-phone__set')!;
    await expect(Number.parseFloat(getComputedStyle(set).rotate)).toBeCloseTo(turn, 1);
    await expect(getComputedStyle(canvasElement.querySelector<HTMLElement>('.desk-phone__set-wall')!).rotate).toBe('none');

    // A tilt is a transform, not layout: the set is still a working phone through it.
    await userEvent.click(canvas.getByRole('button', { name: 'Lift the handset' }));
    await expect(canvas.getByRole('button', { name: 'Hang up' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Dial 5 J K L' })).toBeEnabled();
  },
};

/** The colour range: the 1949 black, then ivory, cherry red, aqua blue and moss green. The machine stays beige. */
export const Finishes: Story = {
  parameters: { composition: true },
  render: (args) => (
    <div style={{ display: 'grid', gap: 40, padding: 56, background: '#ead3a7', justifyItems: 'center' }}>
      {DESK_PHONE_FINISHES.map((finish) => (
        <div key={finish} style={{ width: 640, maxWidth: '100%' }}>
          <DeskPhone {...args} finish={finish} rotation={0} />
        </div>
      ))}
    </div>
  ),
};

/** Pushed to the corner of the desk, on the festival sketch, where the booking line lives. */
export const OnDesk: Story = {
  parameters: { composition: true, layout: 'fullscreen' },
  args: { rotation: -5, finish: 'ivory' },
  render: (args) => (
    <PaperSheet height={0} imageSrc={festivalSketch} imageSize="118% auto" imagePosition="center top" imageOpacity={0.9} imageContrast={1.28}>
      <div style={{ padding: '8% 8%', display: 'flex', justifyContent: 'flex-start' }}>
        <div style={{ width: 720, maxWidth: '100%' }}>
          <DeskPhone {...args} />
        </div>
      </div>
    </PaperSheet>
  ),
};
