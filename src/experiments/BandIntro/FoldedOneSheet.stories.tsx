import type { Meta, StoryObj } from '@storybook/react-vite';
import { FoldedOneSheet } from './FoldedOneSheet';

const meta = {
  title: 'Experiments/Band Introduction/Folded One-Sheet',
  component: FoldedOneSheet,
  parameters: { layout: 'fullscreen' },
  args: { initialOpen: false },
  decorators: [(Story) => <div style={{ minHeight: '100vh', boxSizing: 'border-box', padding: '64px 28px', background: '#b9ad90', backgroundImage: 'url(/assets/paper-flecks.svg)' }}><Story /></div>],
} satisfies Meta<typeof FoldedOneSheet>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Folded: Story = {};
export const Unfolded: Story = { args: { initialOpen: true } };
