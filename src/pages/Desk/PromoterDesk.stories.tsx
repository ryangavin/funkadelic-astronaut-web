import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { DESK_WOODS, DESK_WIDTH } from '../../components/Desk/Desk';
import { DESK_HEIGHT, DESK_LAYOUT, PromoterDesk } from './PromoterDesk';

const viewports = {
  laptop: { name: 'Laptop 1280', styles: { width: '1280px', height: '800px' }, type: 'desktop' },
  design: { name: 'Design 1440', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
  wide: { name: 'Wide 1920', styles: { width: '1920px', height: '1080px' }, type: 'desktop' },
  tablet: { name: 'Tablet 834', styles: { width: '834px', height: '1194px' }, type: 'tablet' },
  phone: { name: 'Phone 390', styles: { width: '390px', height: '844px' }, type: 'mobile' },
} as const;

/* One slider per coordinate, grouped by the thing it moves. */
const GROUPS: Record<string, string> = {
  dossier: 'Press package',
  walkman: 'Walkman',
  tape: 'Spare tape',
  handheld: 'Handheld',
  mug: 'Mug',
  ring: 'Coffee ring',
  sheet: 'Running order',
  ballpoint: 'Ballpoint',
  marker: 'Marker',
  pick: 'Pick',
  socials: 'Social stickers',
  handbill: 'Spill: handbill',
  zine: 'Spill: zine',
  ticket: 'Spill: tour ticket',
  pass: 'Spill: festival pass',
  print: 'Spill: print',
};
const range = (key: string) =>
  key.endsWith('Rotation')
    ? { min: -45, max: 45, step: 0.5 }
    : key.endsWith('Width')
      ? { min: 20, max: DESK_WIDTH, step: 5 }
      : key.endsWith('Y')
        ? { min: -200, max: DESK_HEIGHT, step: 2 }
        : { min: -200, max: DESK_WIDTH, step: 2 };
const layoutControls = Object.fromEntries(
  Object.keys(DESK_LAYOUT).map((key) => [key, { control: { type: 'range', ...range(key) }, table: { category: GROUPS[key.replace(/(X|Y|Width|Rotation)$/, '')] } }]),
);

const meta = {
  title: 'Pages/Desk',
  component: PromoterDesk,
  parameters: { layout: 'fullscreen', viewport: { options: viewports } },
  tags: ['autodocs'],
  argTypes: {
    ...layoutControls,
    wood: { control: 'inline-radio', options: DESK_WOODS, table: { category: 'Desk' } },
    open: { table: { category: 'Desk' } },
    minScale: { control: { type: 'range', min: 0, max: 1, step: 0.05 }, table: { category: 'Desk' } },
    maxScale: { control: { type: 'range', min: 0.5, max: 3, step: 0.05 }, table: { category: 'Desk' } },
  },
  args: { ...DESK_LAYOUT, wood: 'walnut', open: false, onToggle: fn() },
} satisfies Meta<typeof PromoterDesk>;

export default meta;
type Story = StoryObj<typeof meta>;

/** As a visitor lands on it: the package closed, the band's name across the cover. Click it. */
export const Closed: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Open the Funkadelic Astronaut press package' })).toHaveAttribute('aria-expanded', 'false');
    // The promoter's things are already out.
    await expect(canvas.getByRole('group', { name: 'Cassette player: Spacewalk (demo)' })).toBeInTheDocument();
    await expect(canvas.getByRole('group', { name: 'Handheld player: What to Do · live at Barrier Brewing Co.' })).toBeInTheDocument();
    // The streaming stickers on the cover are links, reachable through the folder.
    await expect(canvas.getByRole('link', { name: 'Funkadelic Astronaut on Spotify' })).toBeInTheDocument();
    // The loose things are packed away, out of sight.
    const spilled = canvasElement.querySelectorAll<HTMLElement>('.spilled');
    await expect(spilled).toHaveLength(5);
    for (const item of spilled) await expect(getComputedStyle(item).visibility).toBe('hidden');
    await expect(canvas.getByRole('status', { name: 'Press package' }).textContent).toContain('closed');
  },
};

/** The click: the folder swings open, the things come out, and the tab closes it again. */
export const Opening: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const spilled = canvasElement.querySelectorAll<HTMLElement>('.spilled');
    await userEvent.click(canvas.getByRole('button', { name: 'Open the Funkadelic Astronaut press package' }));
    await expect(args.onToggle).toHaveBeenCalledWith(true);
    const close = canvas.getByRole('button', { name: 'Close the press package' });
    await expect(close).toHaveAttribute('aria-expanded', 'true');
    for (const item of spilled) await expect(getComputedStyle(item).visibility).toBe('visible');
    await waitFor(() => expect(canvasElement.querySelector('.folder')?.getAttribute('data-open')).toBe('true'));
    await expect(canvas.getByRole('region', { name: 'Meet the band' })).toBeInTheDocument();
    await expect(canvas.getByRole('status', { name: 'Press package' }).textContent).toContain('out on the desk');
    // Closing draws everything back in and hides it once it has settled.
    await userEvent.click(close);
    await expect(args.onToggle).toHaveBeenCalledWith(false);
    await waitFor(() => expect(getComputedStyle(spilled[4]).visibility).toBe('hidden'), { timeout: 3000 });
    // Open it again and leave it that way, so the story shows what the click does.
    await userEvent.click(canvas.getByRole('button', { name: 'Open the Funkadelic Astronaut press package' }));
  },
};

/** Everything out on the desk, the way it looks once the package has been opened. */
export const Spilled: Story = {
  args: { open: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Close the press package' })).toHaveAttribute('aria-expanded', 'true');
    // Each spilled thing has landed where the layout puts it, in desk units from the desk's corner.
    const desk = canvasElement.querySelector<HTMLElement>('.desk')!;
    const stage = canvasElement.querySelector<HTMLElement>('.stage__sheet')!;
    await waitFor(
      () => {
        const zoom = Number(getComputedStyle(stage).zoom) || 1;
        const origin = desk.getBoundingClientRect();
        const handbill = canvasElement.querySelector<HTMLElement>('.handbill')!.closest<HTMLElement>('.spilled')!.getBoundingClientRect();
        // The layout gives the corner; tilted with the folder, the centre lands within a few units of the corner plus half the width.
        const centreX = (handbill.left + handbill.width / 2 - origin.left) / zoom;
        expect(Math.abs(centreX - (DESK_LAYOUT.handbillX + DESK_LAYOUT.handbillWidth / 2))).toBeLessThan(12);
      },
      { timeout: 3000 },
    );
    // The things on the desk still work: the handbill turns over.
    await userEvent.click(canvas.getByRole('button', { name: 'Turn the handbill over' }));
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
