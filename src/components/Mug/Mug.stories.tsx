import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { CoffeeRing } from './CoffeeRing';
import { Mug } from './Mug';

const meta = {
  title: 'Components/Mug',
  component: Mug,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    glaze: { control: 'color' },
    drink: { control: 'color' },
    coffee: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    rotation: { control: { type: 'range', min: -180, max: 180, step: 5 } },
  },
  args: { glaze: '#e8dfcc', drink: '#3a2113', coffee: 0.7, rotation: 30 },
  decorators: [
    (Story) => (
      <div style={{ padding: 56, background: '#5a3a25' }}>
        <div style={{ width: 220 }}>
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof Mug>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Most of a coffee, handle out to the right. */
export const Coffee: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.mug__drink')).toBeInTheDocument();
    await expect(canvasElement.querySelector('.mug__bottom')).toBeNull();
  },
};

/** Drunk: the bottom of the mug, and what dried on it. */
export const Empty: Story = {
  args: { coffee: 0 },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.mug__bottom')).toBeInTheDocument();
  },
};

/** A dark glaze, tea in it. */
export const Tea: Story = {
  args: { glaze: '#2d4a3e', drink: '#a5561e', coffee: 0.9, rotation: -40 },
};

/** The ring a mug leaves, on paper. */
export const Ring: Story = {
  render: () => (
    <div style={{ width: 220, padding: 20, background: '#fbfaf5' }}>
      <CoffeeRing strength={0.5} rotation={15} />
    </div>
  ),
};
