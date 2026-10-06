import type { Meta, StoryObj } from '@storybook/react-vite';
import { PAPER_STOCKS, PaperSheet } from '../PaperSheet/PaperSheet';
import { Pin } from '../Pin/Pin';
import { Astronaut } from './Astronaut';

const meta = {
  title: 'Library/Components/2D/Astronaut Cutout',
  component: Astronaut,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    stock: { control: 'inline-radio', options: PAPER_STOCKS },
    rotation: { control: { type: 'range', min: -20, max: 20, step: .5 } },
  },
  args: { stock: 'wheat', rotation: 0, alt: '' },
  decorators: [(Story, context) => context.parameters.composition ? <Story /> :
    <div style={{ padding: '48px', background: '#ead3a7' }}>
      <div style={{ width: 'min(100%, 288px)', margin: 'auto' }}><Story /></div>
    </div>],
} satisfies Meta<typeof Astronaut>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OriginalCutout: Story = {};
export const Tilted: Story = { args: { rotation: -8, alt: 'Astronaut wearing headphones' } };
export const WhiteStock: Story = { args: { stock: 'white' } };

export const MultipleCutouts: Story = {
  parameters: { composition: true },
  render: (args) => <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 64, padding: 48, background: '#121420' }}>
    <div style={{ width: 'min(100%, 288px)' }}><Astronaut {...args} /></div>
    <div style={{ width: 'min(100%, 200px)' }}><Astronaut {...args} stock="white" rotation={6} /></div>
  </div>,
};

export const OnPaperSheet: Story = {
  parameters: { composition: true },
  render: (args) => <PaperSheet height={1100}>
    <Pin x={380} y={120} width={560} rotation={-3}><Astronaut {...args} /></Pin>
  </PaperSheet>,
};
