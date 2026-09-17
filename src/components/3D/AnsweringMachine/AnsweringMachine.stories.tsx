import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import demoTape from '../../../../assets/audio/demo-tape.mp3';
import { AnsweringMachine, type DeskPhoneMessage } from './AnsweringMachine';
import { DeskObjectStudy } from '../../../behaviors/Perspective/DeskObjectStudy';
import { checkDeskStudy } from '../../../behaviors/Perspective/DeskObjectStudy.check';
import { Walkman } from '../Walkman/Walkman';
const MESSAGES: DeskPhoneMessage[] = [
  { caller: 'Marguerite at the Pond Room', time: 'Tue 9.14am', src: demoTape },
  { caller: 'Dill — sound, Barrier Brewing', time: 'Tue 6.02pm', src: demoTape },
  { caller: 'unknown number', time: 'Wed 1.41am', src: demoTape },
];

const meta = { title: 'Components/3D/Answering Machine', component: AnsweringMachine, parameters: { layout: 'centered' }, tags: ['autodocs'], args: { messages: MESSAGES, sound: false, volume: 0.8, onPlay: fn(), onStop: fn(), onMessageEnded: fn(), onEnded: fn() }, decorators: [(Story, context) => context.parameters.composition ? <Story /> : <div style={{width: 540, padding: 40, background: '#5a3a25'}}><Story /></div>] } satisfies Meta<typeof AnsweringMachine>;
export default meta;
type Story = StoryObj<typeof meta>;
const parts = (element: HTMLElement) => ({ machine: element.querySelector<HTMLElement>('.answering-machine')!, readout: element.querySelector<HTMLElement>('.desk-phone__readout')! });
export const Ready: Story = {};
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


export const WithWalkman: Story = { play: async ({canvasElement}) => {
  const tapes = canvasElement.querySelectorAll('.cassette');
  await expect(tapes).toHaveLength(2);
  await expect(Math.abs(tapes[0].getBoundingClientRect().width - tapes[1].getBoundingClientRect().width)).toBeLessThan(1);
}, parameters: { composition: true }, render: args => <div style={{ display: 'flex', alignItems: 'center', gap: 60, padding: 40, background: '#5a3a25' }}><div style={{ width: 540 }}><AnsweringMachine {...args} /></div><div style={{ width: 336 }}><Walkman /></div></div> };
export const OnDesk: Story = { name: 'On desk', parameters: { composition: true, layout: 'fullscreen' }, play: checkDeskStudy, render: args => <DeskObjectStudy name="Answering machine" widthMm={180} depthRatio={120/180} heightMm={30} sideColors={['#bbbec4','#a4a7ae','#747780']}><AnsweringMachine {...args} /></DeskObjectStudy> };
