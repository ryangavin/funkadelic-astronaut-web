import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { WallWindow } from '../WallWindow/WallWindow';
import { WALL_BRICK, WALL_COURSE, WALL_FINISHES, WALL_HEIGHT, Wall } from './Wall';

const meta = {
  title: 'Foundations/Layout/Wall',
  component: Wall,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: {
    finish: { control: 'inline-radio', options: WALL_FINISHES },
    width: { control: { type: 'range', min: 720, max: 4320, step: 20 } },
    height: { control: { type: 'range', min: 600, max: 4000, step: 20 } },
    brick: { control: { type: 'range', min: 150, max: 420, step: 6 } },
    course: { control: { type: 'range', min: 48, max: 180, step: 3 } },
    worn: { control: { type: 'range', min: 0, max: 40, step: 1 } },
    light: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
  },
  args: { finish: 'whitewash', width: 1440, height: WALL_HEIGHT, brick: WALL_BRICK, course: WALL_COURSE, worn: 22, light: 1 },
} satisfies Meta<typeof Wall>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Face on: running bond, 215 millimetre stretchers on 65 millimetre courses, under old limewash. */
export const Whitewash: Story = {
  play: async ({ canvasElement }) => {
    const face = canvasElement.querySelector<HTMLElement>('.wall__face')!;
    const box = face.getBoundingClientRect();
    // The height follows the width, in wall units.
    await expect(box.height / box.width).toBeCloseTo(WALL_HEIGHT / 1440, 2);
    // Running bond takes two sets of perpends: one per parity of course.
    await expect(canvasElement.querySelectorAll('.wall__perpends')).toHaveLength(2);
    // Roughly a fifth of the bond is variegated, wherever the wall is cut.
    const bricks = (Math.ceil(1440 / WALL_BRICK) + 1) * Math.ceil(WALL_HEIGHT / WALL_COURSE);
    const odd = canvasElement.querySelectorAll('.wall__brick').length;
    await expect(odd / bricks).toBeGreaterThan(0.12);
    await expect(odd / bricks).toBeLessThan(0.32);
  },
};

/** Painted last week: no brick has worn back through yet. */
export const Fresh: Story = {
  args: { worn: 0 },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('.wall__brick')).toHaveLength(0);
  },
};

/** The four finishes, at the height a wall shows behind a desk. */
export const Finishes: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 20, padding: 24, background: '#15100b' }}>
      {WALL_FINISHES.map((finish) => (
        <Wall key={finish} {...args} finish={finish} height={620} />
      ))}
    </div>
  ),
};

/** Close up, so the bond, the struck joints and the grit under the paint can be read. */
export const Close: Story = {
  args: { width: 620, height: 460 },
};

/** Weathered red stock and open steel casements, with physical window dimensions. */
export const IndustrialWindow: Story = {
  args: { finish: 'red', width: 3000, height: 3000 },
  render: (args) => <div style={{ maxWidth: 900, margin: 'auto', '--desk-room-unit': 'calc(100cqw / 3000)' } as React.CSSProperties}>
    <Wall {...args}><WallWindow /></Wall>
  </div>,
};

/** The room keeps its inexpensive flat surface, with cell-local red-stock weathering. */
export const FlatWeathered: Story = {
  args: { finish: 'red', flat: true, weathered: true, height: 620 },
  play: async ({ canvasElement }) => {
    const grit = canvasElement.querySelector('.wall__grit')!;
    const brush = canvasElement.querySelector('.wall__brush')!;
    await expect(getComputedStyle(grit).display).toBe('none');
    await expect(getComputedStyle(brush).display).toBe('none');
    const brick = canvasElement.querySelector('.wall__brick')!;
    await expect(getComputedStyle(brick).backgroundImage).toContain('gradient');
    await expect(getComputedStyle(brick, '::after').clipPath).toContain('polygon');
  },
};
