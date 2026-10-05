import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Nameplate } from './Nameplate';
import './Epk.css';

/** The drawn nameplate: a lowercase geometric alphabet in the spirit of Bauhaus 93, styled from CSS like type. */
const meta = {
  title: 'Pages/EPK/Nameplate',
  component: Nameplate,
  parameters: { layout: 'padded', backgrounds: { default: 'newsprint', values: [{ name: 'newsprint', value: '#ece1c6' }] } },
  decorators: [Story => <div className="epk" style={{ minHeight: 0, background: '#ece1c6', padding: 24 }}>{Story()}</div>],
} satisfies Meta<typeof Nameplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoLines: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('img', { name: 'funkadelic astronaut' })).toBeVisible();
  },
};

/** Every letter the alphabet has, for checking shapes and spacing. */
export const Alphabet: Story = { args: { lines: ['acdefik', 'lnorstu'] } };
