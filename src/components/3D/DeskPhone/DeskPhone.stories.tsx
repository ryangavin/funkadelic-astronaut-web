import { checkDeskStudy } from '../../../behaviors/Perspective/DeskObjectStudy.check';
import { DeskObjectStudy } from '../../../behaviors/Perspective/DeskObjectStudy';
import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import demoTape from '../../../../assets/audio/demo-tape.mp3';
import festivalSketch from '../../../../assets/festival-scribble-fully-shaded.png';
import { Perspective, STANDING_VIEW, Solid } from '../../../behaviors/Perspective/Perspective';
import { Desk } from '../Desk/Desk';
import { PaperSheet } from '../../2D/PaperSheet/PaperSheet';
import { Pin } from '../../2D/Pin/Pin';
import { DESK_PHONE_FINISHES, DESK_PHONE_FOOT, DESK_PHONE_HEIGHT, DeskPhone, SET_BODY_HEIGHT } from './DeskPhone';
import { DIAL_OFFSET, DIAL_PITCH, DIAL_SPEED, PULSE_RATE, pulsesFor, returnMs, travelFor } from './pulses';

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
  },
  args: {
    number: '718 555 0164',
    finish: 'black',
    rotation: -2,
    offHook: false,
    volume: 0.8,
    sound: true,
    onPulse: fn(),
    onDigit: fn(),
    onHook: fn(),
  },
  decorators: [
    (Story, context) =>
      context.parameters.composition ? (
        <Story />
      ) : (
        <div style={{ padding: 56, background: '#ead3a7' }}>
          <div style={{ width: 360, maxWidth: '100%' }}>
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

/** The booking line as it sits: handset down, and every part the size it is in millimetres. */
export const BookingLine: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const { root, set, dial, handset, machine } = parts(canvasElement);

    await expect(canvas.getByRole('group', { name: 'Desk phone: 718 555 0164' })).toBeInTheDocument();

    // The phone-only plan is 320 by 300 millimetres of desk.
    await expect(root.offsetHeight / root.offsetWidth).toBeCloseTo(300 / 320, 2);
    // The 500's housing is 221 across and 229 deep.
    await expect(set.offsetWidth / root.offsetWidth).toBeCloseTo(221 / 320, 2);
    await expect(set.offsetHeight / set.offsetWidth).toBeCloseTo(229 / 221, 2);
    // The handset is 216 cap to cap: it very nearly spans the housing.
    await expect(handset.offsetWidth / set.offsetWidth).toBeCloseTo(216 / 221, 2);
    // The No. 9 dial is drawn in a 118-millimetre square, and is square.
    await expect(dial.offsetWidth / set.offsetWidth).toBeCloseTo(118 / 221, 2);
    await expect(dial.offsetHeight).toBe(dial.offsetWidth);
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
        <div key={rise} style={{ width: 465, maxWidth: '100%', '--solid-rise': rise, '--solid-splay': rise * 0.5 } as CSSProperties}>
          <DeskPhone {...args} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    // 137 millimetres against the 320 this drawing is wide.
    await expect(DESK_PHONE_HEIGHT).toBeCloseTo(SET_BODY_HEIGHT / 320, 6);

    const sets = [...canvasElement.querySelectorAll<HTMLElement>('.desk-phone')];
    const flank = (root: HTMLElement, part: string) => root.querySelector<HTMLElement>(part)!.getBoundingClientRect().height;
    const [flat, , tipped] = sets;

    // Straight down, a side is worth nothing at all: one millimetre of waist and no more.
    await expect(flank(flat, '.desk-phone__set-wall')).toBeLessThan(2);
    // Tipped, it grows, and the set's top face has gone up the surface with it.
    await expect(flank(tipped, '.desk-phone__set-wall')).toBeGreaterThan(40);
    await expect(tipped.querySelector('.desk-phone__set')!.getBoundingClientRect().top).toBeLessThan(
      tipped.querySelector('.desk-phone__set-foot')!.getBoundingClientRect().top,
    );
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
          <Pin x={400} y={470} width={495} rotation={-7}>
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

/** The colour range: the 1949 black, then ivory, cherry red, aqua blue and moss green.  */
export const Finishes: Story = {
  parameters: { composition: true },
  render: (args) => (
    <div style={{ display: 'grid', gap: 40, padding: 56, background: '#ead3a7', justifyItems: 'center' }}>
      {DESK_PHONE_FINISHES.map((finish) => (
        <div key={finish} style={{ width: 480, maxWidth: '100%' }}>
          <DeskPhone {...args} finish={finish} rotation={0} />
        </div>
      ))}
    </div>
  ),
};

/** Pushed to the corner of the desk, on the festival sketch, where the booking line lives. */
export const OnFestivalPaper: Story = {
  parameters: { composition: true, layout: 'fullscreen' },
  args: { rotation: -5, finish: 'ivory' },
  render: (args) => (
    <PaperSheet height={0} imageSrc={festivalSketch} imageSize="118% auto" imagePosition="center top" imageOpacity={0.9} imageContrast={1.28}>
      <div style={{ padding: '8% 8%', display: 'flex', justifyContent: 'flex-start' }}>
        <div style={{ width: 540, maxWidth: '100%' }}>
          <DeskPhone {...args} />
        </div>
      </div>
    </PaperSheet>
  ),
};

export const OnDesk: Story = {
  play: checkDeskStudy,
  name: 'On desk',
  parameters: { layout: 'fullscreen', composition: true },
  render: (args) => <DeskObjectStudy name="Desk phone" widthMm={240} depthRatio={300/320} heightMm={SET_BODY_HEIGHT * 0.75} solid={{ height: DESK_PHONE_HEIGHT, foot: DESK_PHONE_FOOT }} shapes={[{ path: "M32 12H81Q92 12 92 25V80Q92 88 81 88H32Q23 88 23 80V25Q23 12 32 12Z" }]} note="Phone shown at 75% scale. What stands up is the moulding, not the handset lying on it; handset and cord remain attached when lifted."><DeskPhone {...args} rotation={0} sound={false} /></DeskObjectStudy>,
};
