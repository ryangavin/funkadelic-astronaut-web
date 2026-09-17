import type { Meta, StoryObj } from '@storybook/react-vite';
import type React from 'react';
import { expect } from 'storybook/test';
import festivalMap from '../../../assets/festival-map.webp';
import { Weathered } from '../../behaviors/Weathered/Weathered';
import { Inkjet } from './Inkjet';

const meta = {
  title: 'Foundations/Styles/Inkjet',
  component: Inkjet,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: {
    gamut: { control: { type: 'range', min: 0, max: 1, step: 0.02 } },
    spread: { control: { type: 'range', min: 0, max: 1.5, step: 0.05 } },
    dots: { control: { type: 'range', min: 0.1, max: 2, step: 0.05 } },
    dither: { control: { type: 'range', min: 0, max: 0.6, step: 0.01 } },
    banding: { control: { type: 'range', min: 0, max: 0.4, step: 0.01 } },
    seed: { control: { type: 'range', min: 0, max: 40, step: 1 } },
    children: { control: false },
  },
  args: { gamut: 0.55, spread: 0.6, dots: 0.55, dither: 0.22, banding: 0.13, seed: 3, enabled: true },
} satisfies Meta<typeof Inkjet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A letter sheet of plain copy paper, the thing that comes out of the machine. */
function Sheet({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <figure style={{ margin: 0, width: 420 }}>
      <Weathered grain wear={0.2} style={{ display: 'block', background: '#fbfaf5', padding: 18, boxShadow: '1px 2px 0 rgb(18 20 32 / 0.2), 5px 8px 10px rgb(18 20 32 / 0.3)' }}>
        {children}
      </Weathered>
      <figcaption style={{ marginTop: 10, color: '#e8dfcc', font: '600 13px/1.4 ui-sans-serif, system-ui', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</figcaption>
    </figure>
  );
}

const Map = () => <img src={festivalMap} alt="The festival site plan" style={{ display: 'block', width: '100%' }} />;

/** The file as it was sent, beside the same file run off on the machine: the ink cannot reach the screen's colours, it spreads into the fibre, the tone is dithered, and the head leaves its bands. */
export const Printed: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 40, padding: 48, background: '#5a3a25' }}>
      <Sheet label="The file">
        <Inkjet {...args} enabled={false}>
          <Map />
        </Inkjet>
      </Sheet>
      <Sheet label="Off the printer">
        <Inkjet {...args}>
          <Map />
        </Inkjet>
      </Sheet>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [file, print] = Array.from(canvasElement.querySelectorAll<HTMLElement>('.inkjet'));
    // The file is left alone; the print goes through the machine and is laid on the paper as ink.
    await expect(file.style.filter).toBe('');
    await expect(getComputedStyle(file).mixBlendMode).toBe('normal');
    await expect(print.style.filter).toMatch(/^url\("?#inkjet-/);
    await expect(getComputedStyle(print).mixBlendMode).toBe('multiply');
    // Every step of the machine is in the filter: its gamut, the spread into the fibre, the dither and the head's bands.
    const press = print.querySelector('filter')!;
    await expect(press.querySelector('feColorMatrix[type="saturate"]')).toBeInTheDocument();
    await expect(press.querySelector('feGaussianBlur')).toBeInTheDocument();
    await expect(press.querySelectorAll('feTurbulence')).toHaveLength(2);
    // The dots and the bands fall away as the ink does, so bare paper is left alone.
    for (const step of Array.from(press.querySelectorAll('feComposite[operator="arithmetic"]'))) {
      await expect(Number(step.getAttribute('k2'))).toBe(1);
      await expect(Number(step.getAttribute('k3'))).toBe(-Number(step.getAttribute('k1')));
    }
  },
};

/** Turned up far past what a printer does, so each step can be seen for what it is. */
export const HeavyHanded: Story = {
  args: { gamut: 0.5, spread: 0.8, dots: 0.4, dither: 0.3, banding: 0.22 },
  render: Printed.render,
};
