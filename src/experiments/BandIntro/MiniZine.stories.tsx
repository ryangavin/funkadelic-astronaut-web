import type { Meta, StoryObj } from '@storybook/react-vite';
import { MiniZine } from './MiniZine';

const meta = {
  title: 'Experiments/Band Introduction/Mini Zine',
  component: MiniZine,
  parameters: { layout: 'fullscreen' },
  args: { initialOpen: false },
  decorators: [(Story) => <div style={{ minHeight: '100vh', boxSizing: 'border-box', padding: '64px 28px', background: '#b9ad90', backgroundImage: 'url(/assets/paper-flecks.svg)' }}><Story /></div>],
} satisfies Meta<typeof MiniZine>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Cover: Story = {};
export const InsideSpread: Story = { args: { initialOpen: true } };
