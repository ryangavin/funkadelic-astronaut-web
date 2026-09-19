import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { MeterStick } from './MeterStick';
import { ScaleBench } from '../../../debug/ScaleBench/ScaleBench';

const meta = {
  title: 'Components/3D/Meter Stick',
  component: MeterStick,
  parameters: { layout: 'fullscreen' },
  args: { inches: true, variant: 'meter' },
  argTypes: { variant: { control: 'select', options: ['meter', 'twelveInch', 'tenCentimeter'] } },
  tags: ['autodocs'],
} satisfies Meta<typeof MeterStick>;
export default meta;
type Story = StoryObj<typeof meta>;

/** 1000 individual millimetres, centimetre labels, and optional eighth-inch marks. */
export const OneMeter: Story = {
  render: args => <div style={{ padding: '80px 24px', background: '#493a2a' }}><MeterStick {...args} /></div>,
  play: async ({ canvasElement }) => {
    const svg = within(canvasElement).getByRole('img', { name: /One meter stick/ });
    await expect(svg).toHaveAttribute('viewBox', '0 0 1000 40');
    await expect(svg.querySelector('.meter-stick__ticks')?.getAttribute('d')?.split('M').length).toBe(1002);
    await expect(svg.querySelector('.meter-stick__numbers')?.lastElementChild).toHaveAttribute('x', '1000');
    // Branding and unit labels occupy the clear band between the two scales.
    const brand = svg.querySelector<SVGGraphicsElement>('.meter-stick__brand')!.getBBox();
    const unit = svg.querySelector<SVGGraphicsElement>('.meter-stick__unit')!.getBBox();
    const metric = svg.querySelector<SVGGraphicsElement>('.meter-stick__numbers text')!.getBBox();
    const inch = svg.querySelector<SVGGraphicsElement>('g.meter-stick__inches text')?.getBBox();
    if (inch) {
      await expect(brand.y).toBeGreaterThanOrEqual(metric.y + metric.height);
      await expect(brand.y + brand.height).toBeLessThanOrEqual(inch.y);
      await expect(unit.y + unit.height).toBeLessThanOrEqual(inch.y);
    }
  },
};

/** A 1 m stick spans five sixths of the 1.2 m desktop. Drag or use arrows; brackets rotate. */
export const OnDesk: Story = {
  render: () => <ScaleBench />,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    if (import.meta.env.MODE !== 'test') return;
    const canvas = within(canvasElement);
    const stick = canvas.getByRole('group', { name: 'Meter stick' });
    await expect(stick.style.getPropertyValue('--movable-width')).toBe('calc(1200 * var(--movable-unit))');
    await expect(canvas.queryByRole('button', { name: 'Resize Meter stick' })).not.toBeInTheDocument();
    const before = stick.getAttribute('style');
    stick.focus();
    await userEvent.keyboard('{ArrowRight}]');
    await expect(stick.getAttribute('style')).not.toBe(before);
    await expect(stick.style.getPropertyValue('--movable-rotation')).toBe('1deg');
    await userEvent.keyboard('+');
    await expect(stick.style.getPropertyValue('--movable-width')).toBe('calc(1200 * var(--movable-unit))');
    // Restore the reference after assertions so browsing never leaves a modified scene.
    await userEvent.keyboard('[[{ArrowLeft}');
    await expect(stick.getAttribute('style')).toBe(before);
  },
};

/** The measuring edges are exactly twelve inches (304.8 mm) apart. */
export const TwelveInch: Story = {
  args: { variant: 'twelveInch' },
  render: args => <div style={{ padding: '80px 24px', background: '#493a2a', maxWidth: 900 }}><MeterStick {...args} /></div>,
  play: async ({ canvasElement }) => {
    const svg = within(canvasElement).getByRole('img', { name: /Twelve-inch ruler/ });
    await expect(svg).toHaveAttribute('viewBox', '0 0 304.8 40');
    await expect(svg.querySelector('path.meter-stick__inches')?.getAttribute('d')).toMatch(/M304\.8 40v-8$/);
    await expect(svg.querySelector('g.meter-stick__inches')?.lastElementChild).toHaveAttribute('x', '304.8');
    await expect(svg.querySelector('g.meter-stick__inches')?.lastElementChild).toHaveTextContent('12');
    await checkLabelSpacing(svg);
  },
};

export const TenCentimeter: Story = {
  args: { variant: 'tenCentimeter' },
  render: args => <div style={{ padding: '80px 24px', background: '#493a2a', maxWidth: 400 }}><MeterStick {...args} /></div>,
  play: async ({ canvasElement }) => {
    const svg = within(canvasElement).getByRole('img', { name: /Ten-centimeter stick/ });
    await expect(svg).toHaveAttribute('viewBox', '0 0 100 40');
    await expect(svg.querySelector('.meter-stick__ticks')?.getAttribute('d')).toMatch(/M100 0v10$/);
    await expect(svg.querySelector('.meter-stick__numbers')?.lastElementChild).toHaveTextContent('10');
    await checkLabelSpacing(svg);
  },
};

async function checkLabelSpacing(svg: HTMLElement) {
  for (const group of svg.querySelectorAll('g.meter-stick__numbers')) {
    const boxes = [...group.querySelectorAll<SVGGraphicsElement>('text')].map(text => text.getBBox());
    for (let i = 1; i < boxes.length; i++) await expect(boxes[i].x).toBeGreaterThan(boxes[i - 1].x + boxes[i - 1].width);
  }
  const brand = svg.querySelector<SVGGraphicsElement>('.meter-stick__brand')!.getBBox();
  const unit = svg.querySelector<SVGGraphicsElement>('.meter-stick__unit')!.getBBox();
  await expect(brand.x + brand.width).toBeLessThan(unit.x);
}
