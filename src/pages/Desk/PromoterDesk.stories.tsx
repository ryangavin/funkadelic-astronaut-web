import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { DESK_WOODS } from '../../components/Desk/Desk';
import { DESK_LAYOUT, PromoterDesk, REAL_WIDTHS, SIZES } from './PromoterDesk';

const viewports = {
  laptop: { name: 'Laptop 1280', styles: { width: '1280px', height: '800px' }, type: 'desktop' },
  design: { name: 'Design 1440', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
  wide: { name: 'Wide 1920', styles: { width: '1920px', height: '1080px' }, type: 'desktop' },
  tablet: { name: 'Tablet 834', styles: { width: '834px', height: '1194px' }, type: 'tablet' },
  phone: { name: 'Phone 390', styles: { width: '390px', height: '844px' }, type: 'mobile' },
} as const;

const meta = {
  title: 'Pages/Desk',
  component: PromoterDesk,
  parameters: { layout: 'fullscreen', viewport: { options: viewports } },
  tags: ['autodocs'],
  argTypes: {
    wood: { control: 'inline-radio', options: DESK_WOODS },
    minScale: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    maxScale: { control: { type: 'range', min: 0.5, max: 3, step: 0.05 } },
  },
  args: { wood: 'walnut', open: false, onToggle: fn(), onArrange: fn() },
} satisfies Meta<typeof PromoterDesk>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Where a movable thing's corner is, in desk units, read back from its own style. */
const cornerOf = (element: HTMLElement) => ({ x: Number(element.style.getPropertyValue('--movable-x')), y: Number(element.style.getPropertyValue('--movable-y')) });

/** As a visitor lands on it: the package closed with the promoter's things on and around it, the band's name across the cover. Click it. */
export const Closed: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Open the Funkadelic Astronaut press package' })).toHaveAttribute('aria-expanded', 'false');
    // The promoter's things are already out, the Walkman lying on the folder.
    await expect(canvas.getByRole('group', { name: 'Cassette player: Spacewalk (demo)' })).toBeInTheDocument();
    await expect(canvas.getByRole('group', { name: 'Handheld player: What to Do · live at Barrier Brewing Co.' })).toBeInTheDocument();
    await expect(cornerOf(canvas.getByRole('group', { name: 'Walkman' }))).toEqual({ x: DESK_LAYOUT.things.walkman.closed.x, y: DESK_LAYOUT.things.walkman.closed.y });
    // Everything is its real size against the Walkman: a letter folder is four and a third Walkmans across.
    const folder = canvasElement.querySelector<HTMLElement>('.folder')!;
    const walkman = canvasElement.querySelector<HTMLElement>('.walkman')!;
    await expect(folder.offsetWidth / walkman.offsetWidth).toBeCloseTo(REAL_WIDTHS.folder / REAL_WIDTHS.walkman, 1);
    await expect(SIZES.walkman).toBe(300);
    // The streaming stickers on the cover are links, reachable through the folder.
    await expect(canvas.getByRole('link', { name: 'Funkadelic Astronaut on Spotify' })).toBeInTheDocument();
    // The loose things are packed away, out of sight.
    const spilled = canvasElement.querySelectorAll<HTMLElement>('.spilled');
    await expect(spilled).toHaveLength(10);
    for (const item of spilled) await expect(getComputedStyle(item).visibility).toBe('hidden');
    await expect(canvas.getByRole('status', { name: 'Press package' }).textContent).toContain('closed');
  },
};

/** The click: the folder swings open, the things on it are shoved aside, what was inside comes out, and the tab closes it again. */
export const Opening: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const spilled = canvasElement.querySelectorAll<HTMLElement>('.spilled');
    const walkman = canvas.getByRole('group', { name: 'Walkman' });
    await userEvent.click(canvas.getByRole('button', { name: 'Open the Funkadelic Astronaut press package' }));
    await expect(args.onToggle).toHaveBeenCalledWith(true);
    const close = canvas.getByRole('button', { name: 'Close the press package' });
    await expect(close).toHaveAttribute('aria-expanded', 'true');
    // Shoved aside: the Walkman is given its open place at once and slides there.
    await expect(cornerOf(walkman)).toEqual({ x: DESK_LAYOUT.things.walkman.open.x, y: DESK_LAYOUT.things.walkman.open.y });
    await waitFor(() => expect(canvasElement.querySelector('.folder')?.getAttribute('data-open')).toBe('true'));
    await waitFor(() => {
      for (const item of spilled) expect(getComputedStyle(item).visibility).toBe('visible');
    }, { timeout: 2000 });
    await expect(canvas.getByRole('status', { name: 'Press package' }).textContent).toContain('out on the desk');
    // Closing draws everything back in and hides it once it has settled, and the Walkman goes back on the folder.
    await userEvent.click(close);
    await expect(args.onToggle).toHaveBeenCalledWith(false);
    await expect(cornerOf(walkman)).toEqual({ x: DESK_LAYOUT.things.walkman.closed.x, y: DESK_LAYOUT.things.walkman.closed.y });
    await waitFor(() => expect(getComputedStyle(spilled[9]).visibility).toBe('hidden'), { timeout: 3000 });
    // Open it again and leave it that way, so the story shows what the click does.
    await userEvent.click(canvas.getByRole('button', { name: 'Open the Funkadelic Astronaut press package' }));
  },
};

/** Everything out on the desk, the way it looks once the package has been opened. Drag things about. */
export const Spilled: Story = {
  args: { open: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Close the press package' })).toHaveAttribute('aria-expanded', 'true');
    const handbill = canvas.getByRole('group', { name: 'Handbill' });
    await expect(cornerOf(handbill)).toEqual({ x: DESK_LAYOUT.spilled.handbill.x, y: DESK_LAYOUT.spilled.handbill.y });
    // Dragged by the pointer, it follows in desk units: the pointer's travel over the desk's scale.
    const desk = canvasElement.querySelector<HTMLElement>('.desk__top')!;
    const scale = desk.getBoundingClientRect().width / 1440;
    const box = handbill.getBoundingClientRect();
    const start = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    await userEvent.pointer([
      { keys: '[MouseLeft>]', target: handbill, coords: { clientX: start.x, clientY: start.y } },
      { coords: { clientX: start.x + 60 * scale, clientY: start.y + 30 * scale } },
      { coords: { clientX: start.x + 120 * scale, clientY: start.y + 40 * scale } },
      { keys: '[/MouseLeft]', coords: { clientX: start.x + 120 * scale, clientY: start.y + 40 * scale } },
    ]);
    await expect(cornerOf(handbill)).toEqual({ x: DESK_LAYOUT.spilled.handbill.x + 120, y: DESK_LAYOUT.spilled.handbill.y + 40 });
    await expect(args.onArrange).toHaveBeenCalled();
    // The drag was not a click: the handbill is still front up.
    await expect(canvas.getByRole('button', { name: 'Turn the handbill over' })).toBeInTheDocument();
    // Picked up, it came to the top of everything.
    const zs = [...canvasElement.querySelectorAll<HTMLElement>('.movable')].map((item) => Number(getComputedStyle(item).zIndex));
    await expect(Number(getComputedStyle(handbill).zIndex)).toBe(Math.max(...zs));
    // From the keyboard, the arrow keys move it.
    handbill.focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowUp}');
    await expect(cornerOf(handbill)).toEqual({ x: DESK_LAYOUT.spilled.handbill.x + 140, y: DESK_LAYOUT.spilled.handbill.y + 30 });
    // A plain click on it still turns it over.
    await userEvent.click(canvas.getByRole('button', { name: 'Turn the handbill over' }));
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Turn the handbill back' })).toBeInTheDocument(), { timeout: 2000 });
  },
};

/** At the design width itself: one desk unit is one screen pixel. */
export const AtDesignWidth: Story = {
  globals: { viewport: { value: 'design' } },
};

/** A common laptop, a little under the design width. */
export const Laptop: Story = {
  globals: { viewport: { value: 'laptop' } },
};

/** A big monitor. */
export const Wide: Story = {
  globals: { viewport: { value: 'wide' } },
};

/** A phone, with no floor: the whole desk at about a quarter size. */
export const Phone: Story = {
  globals: { viewport: { value: 'phone' } },
};

/** The lighter timber. */
export const Oak: Story = {
  args: { wood: 'oak', open: true },
};
