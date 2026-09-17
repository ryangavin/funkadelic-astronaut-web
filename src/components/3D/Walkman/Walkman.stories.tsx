import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, within } from 'storybook/test';
import demoTape from '../../../../assets/audio/demo-tape.mp3';
import festivalSketch from '../../../../assets/festival-scribble-fully-shaded.png';
import { PaperSheet } from '../../2D/PaperSheet/PaperSheet';
import { WALKMAN_FINISHES, WALKMAN_SIDES, Walkman } from './Walkman';

const meta = {
  title: 'Components/3D/Walkman',
  component: Walkman,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    finish: { control: 'inline-radio', options: WALKMAN_FINISHES },
    side: { control: 'inline-radio', options: WALKMAN_SIDES },
    title: { control: 'text' },
    label: { control: 'text' },
    rotation: { control: { type: 'range', min: -20, max: 20, step: 0.5 } },
    volume: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
  },
  args: {
    src: demoTape,
    title: 'Funkadelic Astronaut – Spacewalk (demo)',
    label: 'spacewalk demo',
    side: 'A',
    finish: 'silver',
    rotation: -2,
    volume: 0.8,
    loop: false,
    onPlay: fn(),
    onStop: fn(),
    onEnded: fn(),
  },
  decorators: [
    (Story, context) =>
      context.parameters.composition ? (
        <Story />
      ) : (
        <div style={{ padding: 56, background: '#ead3a7' }}>
          <div style={{ width: 520, maxWidth: '100%' }}>
            <Story />
          </div>
        </div>
      ),
  ],
} satisfies Meta<typeof Walkman>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A tape in the deck, stopped at the top. Press PLAY. Hold REW or FF to wind. */
export const Tape: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('group', { name: 'Cassette player: Funkadelic Astronaut – Spacewalk (demo)' })).toBeInTheDocument();
    await expect(canvas.getByRole('status').textContent).toBe('Stopped');
    await expect(canvas.getByRole('button', { name: 'Play' })).toHaveAttribute('aria-pressed', 'false');
    await expect(canvas.getByRole('slider', { name: 'Volume' })).toHaveValue('0.8');
  },
};

/** Nothing in the deck: the display says so and the keys do nothing. */
export const NoTape: Story = {
  args: { src: undefined, title: undefined, label: 'blank' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status').textContent).toBe('No tape');
    await expect(canvas.getByRole('button', { name: 'Play' })).toBeDisabled();
  },
};

/** Side B, blue. */
export const SideB: Story = {
  args: { side: 'B', finish: 'blue', label: 'live at the pond', title: 'Live at the pond', rotation: 3 },
};

/** The three finishes. */
export const Finishes: Story = {
  parameters: { composition: true },
  render: (args) => (
    <div style={{ display: 'flex', gap: 40, padding: 56, background: '#ead3a7', flexWrap: 'wrap', justifyContent: 'center' }}>
      {WALKMAN_FINISHES.map((finish) => (
        <div key={finish} style={{ width: 360 }}>
          <Walkman {...args} finish={finish} rotation={0} />
        </div>
      ))}
    </div>
  ),
};

/** Left on the desk beside the dossier, on the festival sketch. */
export const OnDesk: Story = {
  parameters: { composition: true, layout: 'fullscreen' },
  args: { rotation: -4 },
  render: (args) => (
    <PaperSheet height={0} imageSrc={festivalSketch} imageSize="118% auto" imagePosition="center top" imageOpacity={0.9} imageContrast={1.28}>
      <div style={{ padding: '8% 10%', display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ width: 460, maxWidth: '100%' }}>
          <Walkman {...args} />
        </div>
      </div>
    </PaperSheet>
  ),
};
