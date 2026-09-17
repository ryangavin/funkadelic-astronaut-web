import type { Meta, StoryObj } from '@storybook/react-vite';
import { Astronaut } from '../../components/2D/Astronaut/Astronaut';
import { Jitter } from './Jitter';

const meta = {
  title: 'Foundations/Behaviors/Jitter',
  component: Jitter,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    preset: { control: 'inline-radio', options: ['cutout', 'print'] },
    activation: { control: 'inline-radio', options: ['continuous', 'hover-focus'] },
    x: { control: { type: 'range', min: 0, max: 8, step: .1 } },
    y: { control: { type: 'range', min: 0, max: 8, step: .1 } },
    rotation: { control: { type: 'range', min: 0, max: 5, step: .05 } },
    cadenceMs: { control: { type: 'range', min: 16, max: 1000, step: 1 } },
    children: { control: false },
  },
  args: { preset: 'cutout', activation: 'continuous', cadenceMs: 150, enabled: true },
} satisfies Meta<typeof Jitter>;
export default meta;
type Story = StoryObj<typeof meta>;

const labelStyle = { padding: '24px 32px', background: '#ead3a7', color: '#121420', fontSize: 24, border: '1px solid #121420', fontFamily: 'var(--font-body)' };
export const Continuous: Story = {
  render: (args) => <Jitter {...args} style={{ rotate: '-4deg' }}><div style={labelStyle}>Funkadelic Astronaut</div></Jitter>,
};
export const HoverOrKeyboardFocus: Story = {
  args: { preset: 'print', activation: 'hover-focus' },
  render: (args) => <Jitter {...args}><button style={labelStyle}>Hover or Tab to this label</button></Jitter>,
};
export const AnimatedAstronaut: Story = {
  render: (args) => <Jitter {...args} tabIndex={0} role="img" aria-label="Animated astronaut cutout" style={{ width: 'min(288px, 65vw)', transformOrigin: '50% 85%' }}>
    <Astronaut rotation={-6} />
  </Jitter>,
};
export const IndependentInstances: Story = {
  render: (args) => <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48, padding: 32 }}>
    <Jitter {...args} style={{ rotate: '-5deg' }}><div style={labelStyle}>Continuous cutout</div></Jitter>
    <Jitter {...args} preset="print" activation="hover-focus" style={{ translate: '0 20px', rotate: '4deg' }}>
      <button style={labelStyle}>Hover or focus this print</button>
    </Jitter>
  </div>,
};
