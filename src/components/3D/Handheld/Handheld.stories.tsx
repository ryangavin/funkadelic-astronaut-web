import { HANDHELD_SILHOUETTE } from './silhouette';
import { checkDeskStudy } from '../../../debug/ObjectStudy/DeskObjectStudy.check';
import { DeskObjectStudy } from '../../../debug/ObjectStudy/DeskObjectStudy';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import festivalSketch from '../../../../assets/festival-scribble-fully-shaded.png';
import { PaperSheet } from '../../2D/PaperSheet/PaperSheet';
import { HANDHELD_FINISHES, Handheld } from './Handheld';

const LIVE_SET = 'https://www.youtube.com/watch?v=iVZmXA27KfA';

const meta = {
  title: 'Components/3D/Handheld',
  component: Handheld,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    finish: { control: 'inline-radio', options: HANDHELD_FINISHES },
    title: { control: 'text' },
    rotation: { control: { type: 'range', min: -20, max: 20, step: 0.5 } },
    volume: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
  },
  args: {
    video: LIVE_SET,
    title: 'What to Do · live at Barrier Brewing Co.',
    finish: 'black',
    rotation: -2,
    volume: 0.8,
    muted: true,
    loop: true,
    onPlay: fn(),
    onPause: fn(),
    onEnded: fn(),
  },
  decorators: [
    (Story, context) =>
      context.parameters.composition ? (
        <Story />
      ) : (
        <div style={{ padding: 56, background: '#ead3a7' }}>
          <div style={{ width: 640, maxWidth: '100%' }}>
            <Story />
          </div>
        </div>
      ),
  ],
} satisfies Meta<typeof Handheld>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The live set on the disc, starting muted like a preview. Cross or Start plays and pauses; Sound turns the volume on. */
export const Disc: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const console = canvas.getByRole('group', { name: 'Handheld player: What to Do · live at Barrier Brewing Co.' });
    await expect(console).toBeInTheDocument();
    await expect(console.querySelector('iframe')).toHaveAttribute('src', expect.stringContaining('enablejsapi=1'));
    // The readout and the display key work before the disc has answered.
    const readout = console.querySelector('.handheld__osd')!;
    await userEvent.click(canvas.getByRole('button', { name: 'Select: show readout' }));
    await expect(canvas.getByRole('button', { name: 'Select: show readout' })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', { name: 'Triangle: show readout' })).toHaveAttribute('aria-pressed', 'true');
    await expect(readout.textContent).toContain('What to Do');
    // Display steps the screen down and round to full again.
    await expect(console.style.getPropertyValue('--handheld-brightness')).toBe('1.12');
    await userEvent.click(canvas.getByRole('button', { name: 'Display brightness' }));
    await expect(console.style.getPropertyValue('--handheld-brightness')).toBe('0.85');
    await userEvent.click(canvas.getByRole('button', { name: 'Display brightness' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Display brightness' }));
    await expect(console.style.getPropertyValue('--handheld-brightness')).toBe('1.12');
  },
};

/** Nothing in the drive: the screen idles on its wave and the keys wait. */
export const NoDisc: Story = {
  args: { video: undefined, title: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('group', { name: 'Handheld player' })).toBeInTheDocument();
    await expect(canvas.getByRole('status').textContent).toBe('No disc');
    await expect(canvas.getByRole('button', { name: 'Start: play' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Cross: play' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Display brightness' })).toBeEnabled();
  },
};

/** The silver one, tilted the other way. */
export const Silver: Story = {
  args: { finish: 'silver', rotation: 3 },
};

/** The three finishes. */
export const Finishes: Story = {
  parameters: { composition: true },
  render: (args) => (
    <div style={{ display: 'grid', gap: 40, padding: 56, background: '#ead3a7', justifyItems: 'center' }}>
      {HANDHELD_FINISHES.map((finish) => (
        <div key={finish} style={{ width: 560, maxWidth: '100%' }}>
          <Handheld {...args} finish={finish} rotation={0} />
        </div>
      ))}
    </div>
  ),
};

/** Left on the desk on the festival sketch, where the print used to lie. */
export const OnFestivalPaper: Story = {
  parameters: { composition: true, layout: 'fullscreen' },
  args: { rotation: -4 },
  render: (args) => (
    <PaperSheet height={0} imageSrc={festivalSketch} imageSize="118% auto" imagePosition="center top" imageOpacity={0.9} imageContrast={1.28}>
      <div style={{ padding: '8% 10%', display: 'flex', justifyContent: 'flex-start' }}>
        <div style={{ width: 620, maxWidth: '100%' }}>
          <Handheld {...args} />
        </div>
      </div>
    </PaperSheet>
  ),
};

export const OnDesk: Story = {
  play: checkDeskStudy,
  name: 'On desk',
  parameters: { layout: 'fullscreen', composition: true },
  render: (args) => <DeskObjectStudy name="Handheld" widthMm={170} depthRatio={327/720} heightMm={23} sideColors={args.finish === 'silver' ? ['#bbbec4', '#a4a7ae', '#747780'] : args.finish === 'white' ? ['#d8d4cb', '#bbb6ac', '#898277'] : ['#17181b', '#141519', '#090a0d']} shapes={[{ path: HANDHELD_SILHOUETTE }]} note="Estimated height; depth and shadow follow the rounded shell and both shoulder buttons."><Handheld {...args} rotation={0} /></DeskObjectStudy>,
};
