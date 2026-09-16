import type { Meta, StoryObj } from '@storybook/react-vite';
import { IndexCard } from '../../components/IndexCard/IndexCard';
import { Polaroid } from '../../components/Polaroid/Polaroid';
import ryan from '../../../assets/band-13.webp';
import { Weathered } from './Weathered';

const meta = {
  title: 'Behaviors/Weathered',
  component: Weathered,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    tone: { control: 'inline-radio', options: ['dark', 'light'] },
    patina: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    flecks: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    grain: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    wear: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
  },
  args: { patina: 0.8, flecks: 0.8, grain: 0, wear: 0.5, tone: 'dark' },
} satisfies Meta<typeof Weathered>;

export default meta;
type Story = StoryObj<typeof meta>;

const stock: React.CSSProperties = { width: 560, maxWidth: '100%', padding: 40, borderRadius: 6, background: '#ead3a7', boxSizing: 'border-box' };

/** The site's wheat stock, weathered. */
export const Stock: Story = {
  render: (args) => <Weathered {...args} style={stock} />,
};

/** Ink stock takes light flecks, screened. */
export const InkStock: Story = {
  args: { tone: 'light', patina: 0, wear: 0 },
  render: (args) => <Weathered {...args} style={{ ...stock, background: '#121420' }} />,
};

/** What lies on a weathered surface is not weathered by it: the card keeps its own
    grain, the print stays glossy and clean. */
export const LayeredOnTop: Story = {
  render: (args) => (
    <Weathered {...args} style={{ ...stock, display: 'grid', gap: 32, gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
      <IndexCard title="On the stock" rotation={-2}>
        <p>Grain of its own, none of the sheet's wear.</p>
      </IndexCard>
      <Polaroid src={ryan} focus="33.5% 24%" caption="Keyboard Wizard" plain rotation={3} />
    </Weathered>
  ),
};

/** Each texture on its own. */
export const Textures: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 24, gridTemplateColumns: '1fr 1fr' }}>
      {(['patina', 'flecks', 'grain', 'wear'] as const).map((texture) => (
        <Weathered key={texture} {...{ [texture]: true }} style={{ ...stock, width: 260, padding: 24, font: '14px sans-serif', color: '#3b2f22' }}>
          {texture}
        </Weathered>
      ))}
    </div>
  ),
};
