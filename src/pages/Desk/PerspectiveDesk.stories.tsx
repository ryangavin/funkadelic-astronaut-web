import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { PLAN_VIEW, STANDING_VIEW } from '../../behaviors/Perspective/Perspective';
import { DESK_WOODS } from '../../components/Desk/Desk';
import { DESK_DEPTH, DESK_LAYOUT, PerspectiveDesk } from './PerspectiveDesk';

const viewports = {
  laptop: { name: 'Laptop 1280', styles: { width: '1280px', height: '800px' }, type: 'desktop' },
  design: { name: 'Design 1440 x 810', styles: { width: '1440px', height: '810px' }, type: 'desktop' },
  wide: { name: 'Wide 1920', styles: { width: '1920px', height: '1080px' }, type: 'desktop' },
  tablet: { name: 'Tablet 834', styles: { width: '834px', height: '1194px' }, type: 'tablet' },
  phone: { name: 'Phone 390', styles: { width: '390px', height: '844px' }, type: 'mobile' },
} as const;

const meta = {
  title: 'Pages/Perspective Desk',
  component: PerspectiveDesk,
  parameters: { layout: 'fullscreen', viewport: { options: viewports } },
  tags: ['autodocs'],
  argTypes: {
    angle: { control: { type: 'range', min: 25, max: 90, step: 1 }, description: 'Degrees above the desk: 90 is straight down, 60 is standing at it.' },
    depth: { control: { type: 'range', min: 900, max: 8000, step: 100 }, description: 'How far the eye is from the desk, in desk units.' },
    wood: { control: 'inline-radio', options: DESK_WOODS },
    minScale: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    maxScale: { control: { type: 'range', min: 0.5, max: 3, step: 0.05 } },
  },
  args: { angle: STANDING_VIEW, wood: 'walnut', lamp: true, onArrange: fn(), onLamp: fn() },
  decorators: [
    /* The page is the desk in its room; the docs show just the frame, at its own 16 x 9. */
    (Story, context) =>
      context.viewMode === 'docs' ? (
        <Story />
      ) : (
        <div className="perspective-desk-room">
          <Story />
        </div>
      ),
  ],
} satisfies Meta<typeof PerspectiveDesk>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Where a movable thing's corner is, in desk units, read back from its own style. */
const cornerOf = (element: HTMLElement) => ({ x: Number(element.style.getPropertyValue('--movable-x')), y: Number(element.style.getPropertyValue('--movable-y')) });

/**
 * The desk as you would stand at it. The wall shows above the far edge, the
 * desk's own front edge runs along the bottom, and everything on it is the
 * same drawing as ever, foreshortened with the surface it lies on.
 */
export const Standing: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // The frame is 16 x 9 whatever the window.
    const stage = canvasElement.querySelector<HTMLElement>('.stage')!;
    const frame = stage.getBoundingClientRect();
    await expect(frame.width / frame.height).toBeCloseTo(16 / 9, 1);
    // The desktop is deeper than the frame, because depth foreshortens; drawn, it fits inside it.
    const plane = canvasElement.querySelector<HTMLElement>('.perspective__plane')!;
    const perUnit = plane.getBoundingClientRect().width / 1440;
    await expect(DESK_DEPTH).toBeGreaterThan(810);
    await expect(plane.getBoundingClientRect().height).toBeLessThan(DESK_DEPTH * perUnit);
    // The near edge is not foreshortened at all: it is still the desk's full width.
    await expect(plane.getBoundingClientRect().width).toBeCloseTo(canvasElement.querySelector<HTMLElement>('.desk__top')!.getBoundingClientRect().width, 0);

    // A thing dragged follows the pointer across the desk, not across the screen: down the screen buys more desk than it would seen from above.
    const note = canvas.getByRole('group', { name: 'Sticky note' });
    const box = note.getBoundingClientRect();
    const from = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    const travel = 100 * perUnit;
    await userEvent.pointer([
      { keys: '[MouseLeft>]', target: note, coords: { clientX: from.x, clientY: from.y } },
      { coords: { clientX: from.x, clientY: from.y + 20 } },
      { coords: { clientX: from.x, clientY: from.y + travel } },
      { keys: '[/MouseLeft]', coords: { clientX: from.x, clientY: from.y + travel } },
    ]);
    await expect(cornerOf(note).y - DESK_LAYOUT.things.note.y).toBeGreaterThan(100);
    await expect(args.onArrange).toHaveBeenCalled();

    // The lamp still switches, through the tilt.
    await userEvent.click(canvas.getByRole('button', { name: 'Turn the lamp off' }));
    await expect(args.onLamp).toHaveBeenCalledWith(false);
    await expect(canvasElement.querySelector('.perspective-desk__scene')).toHaveAttribute('data-lamp', 'off');
  },
};

/** Straight down, the way every drawing on the desk was made. The same page with the tilt taken out. */
export const FromAbove: Story = {
  args: { angle: PLAN_VIEW },
};

/** Lower still, and closer: nearly across the desk, with the far edge falling away. */
export const LowAndClose: Story = {
  args: { angle: 42, depth: 1800 },
};

/** The office dark but for the lamp. */
export const LampOff: Story = {
  args: { lamp: false },
};
