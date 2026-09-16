import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { STAGE_WIDTH } from '../../components/Stage/Stage';
import { HOME_HEIGHT, HOME_LAYOUT, Home } from './Home';

/* The widths worth checking: the design width, common laptops either side of it, a big monitor, and a phone. */
const viewports = {
  laptop: { name: 'Laptop 1280', styles: { width: '1280px', height: '800px' }, type: 'desktop' },
  design: { name: 'Design 1440', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
  wide: { name: 'Wide 1920', styles: { width: '1920px', height: '1080px' }, type: 'desktop' },
  tablet: { name: 'Tablet 834', styles: { width: '834px', height: '1194px' }, type: 'tablet' },
  phone: { name: 'Phone 390', styles: { width: '390px', height: '844px' }, type: 'mobile' },
} as const;

/* One slider per pin coordinate, grouped by the piece it moves. */
const GROUPS: Record<string, string> = {
  pressKit: 'Press kit',
  band: 'Band',
  tour: 'Tour',
  booking: 'Booking',
  funk: 'FUNKADELIC',
  astro: 'ASTRONAUT',
  astronaut: 'Astronaut',
  listen: 'Streaming strip',
  dossier: 'Dossier',
  ticket: 'Tour ticket',
  passes: 'Tour passes: group',
  olives: 'Pass: Olive’s (within group)',
  nyack: 'Pass: Nyack festival (within group)',
  saturn: 'Pass: Saturn Lanes (within group)',
};
const range = (key: string) =>
  key.endsWith('Rotation')
    ? { min: -12, max: 12, step: 0.25 }
    : key.endsWith('Scale')
      ? { min: 0.25, max: 3, step: 0.05 }
      : key.endsWith('Width')
        ? { min: 100, max: STAGE_WIDTH, step: 10 }
        : key.endsWith('Y')
          ? { min: -200, max: HOME_HEIGHT, step: 2 }
          : { min: -200, max: STAGE_WIDTH, step: 2 };
const layoutControls = Object.fromEntries(
  Object.keys(HOME_LAYOUT).map((key) => [key, { control: { type: 'range', ...range(key) }, table: { category: GROUPS[key.replace(/(X|Y|Width|Rotation|Scale)$/, '')] } }]),
);

const meta = {
  title: 'Pages/Home',
  component: Home,
  parameters: { layout: 'fullscreen', viewport: { options: viewports } },
  tags: ['autodocs'],
  argTypes: {
    ...layoutControls,
    mapOpacity: { control: { type: 'range', min: 0, max: 1, step: 0.02 }, table: { category: 'Poster' } },
    minScale: { control: { type: 'range', min: 0, max: 1, step: 0.05 }, table: { category: 'Poster' } },
    maxScale: { control: { type: 'range', min: 0.5, max: 3, step: 0.05 }, table: { category: 'Poster' } },
  },
  args: { ...HOME_LAYOUT, mapOpacity: 1 },
} satisfies Meta<typeof Home>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The page filling whatever it is shown in. Drag the preview's edge: the composition scales, nothing moves. */
export const Responsive: Story = {
  args: {
    bandX: 524,
    funkX: 86,
    funkY: 344,
    astroX: 140,
    astroY: 494,
    astronautY: 286
  },

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Funkadelic Astronaut');
    await expect(canvas.getByRole('navigation', { name: 'Listen on streaming services' }).querySelectorAll('a')).toHaveLength(4);
    await expect(canvas.getByRole('region', { name: 'Tour' }).querySelectorAll('.tour-pass')).toHaveLength(3);
    await document.fonts.ready;
    // Wrapped details must leave the entire time and action inside each equal-sized card.
    await waitFor(() => {
      const passes = [...canvasElement.querySelectorAll<HTMLElement>('.tour-pass')];
      for (const pass of passes) {
        const sheet = pass.querySelector<HTMLElement>('.tour-pass__sheet')!;
        const copy = pass.querySelector<HTMLElement>('.tour-pass__copy')!;
        const details = pass.querySelector<HTMLElement>('.tour-pass__details')!;
        const show = pass.querySelector<HTMLElement>('.tour-pass__show')!;
        const time = pass.querySelector<HTMLElement>('.tour-pass__time')!;
        const action = pass.querySelector<HTMLElement>('.tour-pass__action')!;
        expect(pass.clientHeight).toBe(passes[0].clientHeight);
        expect(details.offsetHeight).toBeLessThanOrEqual(copy.clientHeight);
        expect(details.scrollWidth).toBeLessThanOrEqual(copy.clientWidth);
        expect(time.offsetTop + time.offsetHeight).toBeLessThanOrEqual(show.clientHeight);
        expect(show.offsetTop + show.offsetHeight).toBeLessThanOrEqual(action.offsetTop);
        expect(action.offsetTop + action.offsetHeight).toBeLessThan(sheet.clientHeight);
        expect(sheet.scrollHeight).toBe(sheet.clientHeight);
      }
      expect(passes[0].querySelector<HTMLElement>('.tour-pass__details')!.style.getPropertyValue('--copy-scale')).toBe('1');
    });
    const stage = canvasElement.querySelector<HTMLElement>('.stage')!;
    const sheet = canvasElement.querySelector<HTMLElement>('.stage__sheet')!;
    await waitFor(() => expect(Number(getComputedStyle(sheet).zoom)).toBeCloseTo(stage.clientWidth / STAGE_WIDTH, 3));
    // A fixed 11 x 17 poster: the page's proportions are the design's, whatever the width.
    const box = sheet.getBoundingClientRect();
    await expect(box.height / box.width).toBeCloseTo(HOME_HEIGHT / STAGE_WIDTH, 2);
  }
};

/** At the design width itself: one design pixel is one screen pixel. */
export const AtDesignWidth: Story = {
  globals: { viewport: { value: 'design' } },
};

/** A common laptop, a little under the design width. */
export const Laptop: Story = {
  globals: { viewport: { value: 'laptop' } },
};

/** A big monitor: the same page, a third larger. */
export const Wide: Story = {
  globals: { viewport: { value: 'wide' } },
};

/** A tablet in portrait, where the page is at just over half size. */
export const Tablet: Story = {
  globals: { viewport: { value: 'tablet' } },
};

/** A phone with no floor: the composition at about a quarter size, which is the case for a compact layout later. */
export const Phone: Story = {
  globals: { viewport: { value: 'phone' } },
};
