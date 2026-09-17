import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Movable, MovableScale, type Place } from '../../behaviors/Movable/Movable';
import { Desk } from '../Desk/Desk';
import { Pen } from '../Pen/Pen';
import { StickyNote } from '../StickyNote/StickyNote';
import { CoffeeRing } from './CoffeeRing';
import { Mug } from './Mug';
import { CoffeeRings, Stained } from './Stained';
import { COFFEE_DRIES, COFFEE_GONE, COFFEE_WET, DESK, useCoffeeTrail } from './trail';

const meta = {
  title: 'Components/Mug',
  component: Mug,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    glaze: { control: 'color' },
    drink: { control: 'color' },
    coffee: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    rotation: { control: { type: 'range', min: -180, max: 180, step: 5 } },
  },
  args: { glaze: '#e8dfcc', drink: '#3a2113', coffee: 0.7, rotation: 30 },
  decorators: [
    /* The mug is shown the size a mug is held at, unless a story asks for room to move it about. */
    (Story, { parameters }) => (
      <div style={{ padding: 56, background: '#5a3a25' }}>
        <div style={{ width: parameters.shownAt ?? 220 }}>
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof Mug>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Most of a coffee, handle out to the right. */
export const Coffee: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.mug__drink')).toBeInTheDocument();
    await expect(canvasElement.querySelector('.mug__shadow, .mug__footing, .mug__contact')).toBeNull();
    await expect(canvasElement.querySelector('.mug__bottom')).toBeNull();
  },
};

/** Drunk: the bottom of the mug, and what dried on it. */
export const Empty: Story = {
  args: { coffee: 0 },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.mug__bottom')).toBeInTheDocument();
  },
};

/** A dark glaze, tea in it. */
export const Tea: Story = {
  args: { glaze: '#2d4a3e', drink: '#a5561e', coffee: 0.9, rotation: -40 },
};

/** The ring a mug leaves, on paper. */
export const Ring: Story = {
  render: () => (
    <div style={{ width: 220, padding: 20, background: '#fbfaf5' }}>
      <CoffeeRing strength={0.5} rotation={15} />
    </div>
  ),
};

/* A desk with things on it, in the same units the promoter's desk uses: half a millimetre each,
   so the sheet is letter size, the mug is 140 mm across the handle and the marker is a Sharpie. */
type Thing = 'sheet' | 'note' | 'pen' | 'mug';
const DESK_THINGS: Record<Thing, { place: Place; width: number; label: string }> = {
  sheet: { place: { x: 660, y: 130, rotation: -5 }, width: 432, label: 'Sheet of paper' },
  note: { place: { x: 150, y: 560, rotation: 7 }, width: 152, label: 'Sticky note' },
  pen: { place: { x: 780, y: 730, rotation: -11 }, width: 280, label: 'Marker' },
  mug: { place: { x: 300, y: 180, rotation: 0 }, width: 280, label: 'Mug' },
};
/** A letter sheet stands 11 units tall for every 8.5 across. */
const SHEET_RATIO = 11 / 8.5;

/** A blank letter sheet, the thing on this desk a ring can be left on. */
function Paper() {
  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '8.5 / 11',
        background: '#fbfaf5',
        boxShadow: '1px 2px 0 rgb(18 20 32 / 0.2), 5px 8px 10px rgb(18 20 32 / 0.3)',
      }}
    />
  );
}

/** A desk with a mug on it that keeps the rings it leaves, and a sheet of paper that keeps its own. */
function MugOnTheMove() {
  const [places, setPlaces] = useState(() => Object.fromEntries(Object.entries(DESK_THINGS).map(([id, thing]) => [id, thing.place])) as Record<Thing, Place>);
  const [stacking, setStacking] = useState<Thing[]>(['sheet', 'note', 'pen', 'mug']);
  /* What the mug can be stood on, underneath first. Only the paper: a ring is not left on a pen. */
  const trail = useCoffeeTrail(
    () => ({ ...places.mug, width: DESK_THINGS.mug.width }),
    () => [{ id: 'sheet', ...places.sheet, width: DESK_THINGS.sheet.width, height: DESK_THINGS.sheet.width * SHEET_RATIO }],
  );

  const thing = (id: Thing) => ({
    ...places[id],
    width: DESK_THINGS[id].width,
    z: 1 + stacking.indexOf(id),
    label: DESK_THINGS[id].label,
    onMove: (to: Partial<Place>) => {
      if (id === 'mug') trail.lift();
      setPlaces((all) => ({ ...all, [id]: { ...all[id], ...to } }));
    },
    onGrab: () => setStacking((order) => [...order.filter((other) => other !== id), id]),
    onDrop: trail.settle,
    onBlur: trail.settle,
  });

  return (
    <MovableScale.Provider value={() => (document.querySelector('.desk__top')?.getBoundingClientRect().width ?? 1440) / 1440}>
      <Desk height={900}>
        {/* The wood's own rings lie under everything on it. */}
        <CoffeeRings rings={trail.on(DESK)} />
        <Movable {...thing('sheet')}>
          <Stained rings={trail.on('sheet')}>
            <Paper />
          </Stained>
        </Movable>
        <Movable {...thing('note')}>
          <StickyNote color="canary" rotation={0} size={76}>
            <p>coffee →</p>
          </StickyNote>
        </Movable>
        <Movable {...thing('pen')}>
          <Pen kind="marker" ink="#c9432f" />
        </Movable>
        <Movable {...thing('mug')}>
          <Mug glaze="#e9e1cf" coffee={0.6} rotation={0} />
        </Movable>
      </Desk>
    </MovableScale.Provider>
  );
}

/**
 * The trail a mug leaves as it is carried about. The coffee that ran down its
 * outside goes down with the mug and is under the base the whole time it
 * stands there, so lifting the mug only shows what was already on the desk,
 * and setting it down again fades every ring already down a shade further. The
 * desk keeps them all: a ring leaves only by drying out, which takes a dozen
 * or so journeys. Set the mug down half on the sheet of paper and the ring is
 * shared — pull the paper out from under it and the paper's half goes with the
 * paper, leaving the mug standing on the crescent the paper was not covering.
 */
export const Rings: Story = {
  parameters: { layout: 'fullscreen', shownAt: '100%' },
  render: () => <MugOnTheMove />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const mug = canvas.getByRole('group', { name: 'Mug' });
    const paper = canvas.getByRole('group', { name: 'Sheet of paper' });
    const scale = canvasElement.querySelector<HTMLElement>('.desk__top')!.getBoundingClientRect().width / 1440;
    const onPaper = () => Array.from(canvasElement.querySelectorAll<HTMLElement>('.stained .coffee-ring'));
    const onWood = () => Array.from(canvasElement.querySelectorAll<HTMLElement>('.coffee-ring')).filter((ring) => !ring.closest('.stained'));
    const darkness = (ring: HTMLElement) => Number(ring.style.getPropertyValue('--coffee-ring-strength'));

    const at: Record<string, { x: number; y: number }> = { mug: { ...DESK_THINGS.mug.place }, sheet: { ...DESK_THINGS.sheet.place } };
    const drag = async (thing: HTMLElement, id: string, to: { x: number; y: number }) => {
      const box = thing.getBoundingClientRect();
      const from = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
      const travel = { x: (to.x - at[id].x) * scale, y: (to.y - at[id].y) * scale };
      await userEvent.pointer([
        { keys: '[MouseLeft>]', target: thing, coords: { clientX: from.x, clientY: from.y } },
        { coords: { clientX: from.x + Math.sign(travel.x || 1) * 8, clientY: from.y + Math.sign(travel.y || 1) * 8 } },
        { coords: { clientX: from.x + travel.x, clientY: from.y + travel.y } },
        { keys: '[/MouseLeft]', coords: { clientX: from.x + travel.x, clientY: from.y + travel.y } },
      ]);
      at[id] = to;
    };
    const carry = (to: { x: number; y: number }) => drag(mug, 'mug', to);

    // The mug has been standing there since before anyone looked: the ring is already under it, hidden by the mug.
    await expect(onWood()).toHaveLength(1);
    await expect(darkness(onWood()[0])).toBeCloseTo(COFFEE_WET, 3);

    // The desk keeps every ring it is given: carried round in a circle, the mug leaves a chain of them behind it.
    const journeys = 13;
    const centre = { x: 280, y: 400 };
    const radius = 150;
    for (let journey = 0; journey < journeys; journey += 1) {
      const round = (journey / journeys) * Math.PI * 2;
      await carry({ x: Math.round(centre.x + radius * Math.cos(round)), y: Math.round(centre.y + radius * Math.sin(round)) });
      await expect(onWood()).toHaveLength(2 + journey);
      await expect(darkness(onWood()[0])).toBeCloseTo(COFFEE_WET, 3);
      await expect(darkness(onWood()[1])).toBeCloseTo(COFFEE_WET * COFFEE_DRIES, 3);
    }
    // Every ring goes pale over the same while, rather than stepping.
    await expect(getComputedStyle(onWood()[1]).transitionDuration).toBe('1.4s');
    // The first ring has been dried by every setting down since, and by now there is nothing of it left in the wood.
    await expect(COFFEE_WET * COFFEE_DRIES ** journeys).toBeLessThan(COFFEE_GONE);
    const oldest = onWood()[onWood().length - 1];
    await expect(darkness(oldest)).toBe(0);

    // Set down half on the sheet, the coffee under its base wets both: half the ring on the paper, half on the wood.
    await carry({ x: 539, y: 240 });
    await expect(onPaper()).toHaveLength(1);
    await expect(darkness(onPaper()[0])).toBeCloseTo(COFFEE_WET, 3);
    // The ring that had dried out has faded away where it lay, and the desk is rid of it.
    await expect(oldest.isConnected).toBe(false);
    // The wood's half is cut where the paper lies over it; the paper's half is whole, and clipped to the paper.
    const cut = onWood()[0].querySelector('clipPath path')!;
    await expect(cut).toBeInTheDocument();
    await expect(cut.getAttribute('d')).toMatch(/^M-40 -40H240V240H-40Z M/);
    await expect(onPaper()[0].querySelector('clipPath')).toBeNull();

    // Pull the paper out from under the standing mug and it takes its half away with it, leaving the mug on a crescent.
    const ringOnPaper = onPaper()[0];
    const before = ringOnPaper.getBoundingClientRect().left;
    await drag(paper, 'sheet', { x: 980, y: 300 });
    await expect(onPaper()[0]).toBe(ringOnPaper);
    await expect(ringOnPaper.getBoundingClientRect().left).toBeGreaterThan(before);
    const crescent = onWood()[0];
    await expect(crescent.querySelector('clipPath path')!.getAttribute('d')).toBe(cut.getAttribute('d'));

    // Carried off its crescent at last, so the wood shows exactly the half the paper was not covering.
    await carry({ x: 620, y: 600 });
    await expect(crescent.isConnected).toBe(true);
  },
};
