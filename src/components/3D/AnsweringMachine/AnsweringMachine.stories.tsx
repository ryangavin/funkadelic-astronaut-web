import type { Meta, StoryObj } from '@storybook/react-vite';
import demoTape from '../../../../assets/audio/demo-tape.mp3';
import { AnsweringMachine, type AnsweringMachineMessage } from './AnsweringMachine';
import { DeskObjectStudy } from '../../../experience/debug/ObjectStudy/DeskObjectStudy';
import { Walkman } from '../Walkman/Walkman';
const MESSAGES: AnsweringMachineMessage[] = [
  { caller: 'Marguerite at the Pond Room', time: 'Tue 9.14am', src: demoTape },
  { caller: 'Dill — sound, Barrier Brewing', time: 'Tue 6.02pm', src: demoTape },
  { caller: 'unknown number', time: 'Wed 1.41am', src: demoTape },
];

const meta = { title: 'Library/Components/3D/Answering Machine', component: AnsweringMachine, parameters: { layout: 'centered' }, tags: ['autodocs'], args: { messages: MESSAGES, sound: false, volume: 0.8 }, decorators: [(Story, context) => context.parameters.composition ? <Story /> : <div style={{width: 540, padding: 40, background: '#5a3a25'}}><Story /></div>] } satisfies Meta<typeof AnsweringMachine>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Ready: Story = {};

/** Nobody has called: the counter reads nought, the lamp is dark and the keys do nothing. */
export const EmptyTape: Story = {
  args: { messages: [] },
};

/** A message whose recording is not there: play it and the machine says so on the LED and stops rather than pretending. */
export const BadRecording: Story = {
  args: {
    messages: [{ caller: 'whoever this was', time: 'Thu 11.20pm', src: '/assets/audio/nothing-here.mp3' }],
  },
};


export const WithWalkman: Story = { parameters: { composition: true }, render: args => <div style={{ display: 'flex', alignItems: 'center', gap: 60, padding: 40, background: '#5a3a25' }}><div style={{ width: 540 }}><AnsweringMachine {...args} /></div><div style={{ width: 336 }}><Walkman /></div></div> };
export const OnDesk: Story = { name: 'On desk', parameters: { composition: true, layout: 'fullscreen' }, render: args => <DeskObjectStudy name="Answering machine" widthMm={180} depthRatio={120/180} heightMm={30} sideColors={['#bbbec4','#a4a7ae','#747780']}><AnsweringMachine {...args} /></DeskObjectStudy> };
