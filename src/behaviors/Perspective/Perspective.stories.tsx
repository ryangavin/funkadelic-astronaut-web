import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ComponentProps } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Movable, type Place } from '../Movable/Movable';
import { Desk } from '../../components/3D/Desk/Desk';
import { DeskClock } from '../../components/3D/DeskClock/DeskClock';
import { MUG_FOOT, MUG_HEIGHT, MUG_SILHOUETTE, MUG_TALL, MUG_WIDTH, Mug } from '../../components/3D/Mug/Mug';
import { LampShadows } from '../../components/3D/DeskLamp/LampShadows';
import { DeskLamp, LampLight } from '../../components/3D/DeskLamp/DeskLamp';
import { DeskLighting, castFrom, useDeskLight } from '../DeskLighting/DeskLighting';
import { Pen } from '../../components/3D/Pen/Pen';
import { StickyNote } from '../../components/2D/StickyNote/StickyNote';
import { ObjectCastShadow } from './DeskObjectStudy';
import { GENTLE_VIEW, GENTLE_DEPTH, PLAN_VIEW, Perspective, STANDING_VIEW, Solid, Standing } from './Perspective';

const meta = {
  title: 'Foundations/Behaviors/Perspective',
  component: Perspective,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: {
    shadowStrength: { control: { type: 'range', min: 0, max: 1, step: 0.01 }, description: 'Strength of shadows cast by the lamp in Gentle mug.' },
    angle: { control: { type: 'range', min: 25, max: 90, step: 1 }, description: 'Degrees above the surface: 90 is straight down, 60 is standing at a desk.' },
    depth: { control: { type: 'range', min: 900, max: 8000, step: 100 } },
    children: { control: false },
  },
  args: { shadowStrength: 0.36, angle: GENTLE_VIEW, depth: GENTLE_DEPTH, width: 1440 },
} satisfies Meta<ComponentProps<typeof Perspective> & { shadowStrength?: number }>;

export default meta;
type Story = StoryObj<ComponentProps<typeof Perspective> & { shadowStrength?: number }>;

/** The scene reads the bulb registered by DeskLamp; objects provide only their silhouette and height. */
function MugLighting({ place }: { place: Place }) {
  const light = useDeskLight();
  if (!light) return null;
  // Approximate 70° light cone: footprint follows the bulb's height in desk units.
  const poolWidth = 2 * light.height * Math.tan(35 * Math.PI / 180);
  return <>
    <LampLight on={light.on} style={{ position: 'absolute', width: `${poolWidth / 1440 * 100}%`, aspectRatio: '1', left: `${(light.x - poolWidth / 2) / 1440 * 100}%`, top: `${(light.y - poolWidth / 2) / 800 * 100}%` }} />
    <LampShadows />
    <ObjectCastShadow place={place} pivot={{ x: MUG_FOOT.x, y: MUG_FOOT.y }} width={MUG_WIDTH} depth={MUG_WIDTH} shapes={MUG_SILHOUETTE} heightMm={MUG_TALL} surfaceHeight={800} />
  </>;
}

/** The original artwork, with just a shallow ceramic side. Drag to compare it across the surface. */
function GentleMugScene({ shadowStrength, ...args }: NonNullable<Story['args']>) {
  const [place, setPlace] = useState<Place>({ x: 180, y: 300, rotation: 0 });
  const [lampOn, setLampOn] = useState(true);
  // 480×400 mm lamp drawing; bulb elevation estimated at 350 mm. Desk units are 2/mm.
  const [lamp, setLamp] = useState({ x: 400, y: 40, width: 960, rotation: 0 });
  return (
    <DeskLighting><div style={{ background: '#1a1512', padding: '24px', minHeight: '100vh', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <p style={{ color: '#e8dfcc', font: '15px/1.5 system-ui', margin: '0 0 16px' }}>
          Drag the lamp base to move it; use its rotation grip to turn it. Drag the shade to aim, or click to switch. Drag the mug through its light.
        </p>
        <Perspective {...args} className="perspective--lamp-study">
          <Desk height={800} edge={0}>
            <MugLighting place={place} />
            <Movable {...lamp} className="perspective__lamp" label="Desk lamp" onMove={(to) => setLamp((at) => ({ ...at, ...to }))}>
              <DeskLamp camera={{ angle: args.angle ?? GENTLE_VIEW, depth: args.depth ?? GENTLE_DEPTH, width: args.width ?? 1440, surfaceHeight: 800 }} shadowStrength={shadowStrength} lightPosition={{ ...lamp, height: 700 }} on={lampOn} onToggle={setLampOn} enamel="green" />
            </Movable>
            <Movable {...place} width={MUG_WIDTH} label="Mug" onMove={(to) => setPlace((at) => ({ ...at, ...to }))}>
              <Solid height={MUG_HEIGHT} foot={MUG_FOOT}>
                <Mug coffee={0.7} shadow="contact" />
              </Solid>
            </Movable>
          </Desk>
        </Perspective>
      </div>
    </div></DeskLighting>
  );
}

export const GentleMug: Story = {
  name: 'Gentle mug',
  parameters: { docs: { description: { story: 'One desk lamp registers its bulb as the scene light. Two desk units equal one millimeter: mug drawing 140 mm wide, mug height 95 mm, lamp drawing 480 × 400 mm. Estimated heights: bulb 350 mm, shade top 400 mm, elbow 230 mm, base 25 mm. The light pool uses an approximate 70° cone. Move the mug across the light or click the shade to switch it off.' } } },
  render: (args) => <GentleMugScene {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const shadow = canvasElement.querySelector('.desk-study__shadow .desk-study__cast')!;
    const mugGroup = () => canvas.getByRole('group', { name: 'Mug' });
    /*
      Which side of the thing its shadow falls on, measured off what is drawn
      rather than read off an attribute. The mug used to carry its own shadow and
      its own number to check; now it casts the way everything else does, and the
      thing worth asserting is the one that was always meant — that the shadow is
      thrown away from the bulb, and swaps sides when the thing is carried past it.
    */
    const horizontal = () => {
      const cast = shadow.getBoundingClientRect();
      const thing = mugGroup().getBoundingClientRect();
      return (cast.left + cast.width / 2) - (thing.left + thing.width / 2);
    };
    const before = horizontal();
    await expect(before).toBeLessThan(0);
    await userEvent.click(canvas.getByRole('button', { name: 'Turn the lamp off' }));
    await expect(shadow).toHaveAttribute('opacity', '0');
    await expect(canvasElement.querySelector('.mug__contact')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Turn the lamp on' }));
    await expect(Number(shadow.getAttribute('opacity'))).toBeGreaterThan(0);
    const mug = mugGroup();
    mug.focus();
    await userEvent.keyboard('{Shift>}{ArrowRight>11/}{/Shift}');
    await expect(horizontal()).toBeGreaterThan(0);
    await userEvent.keyboard('{Shift>}{ArrowLeft>11/}{/Shift}');
    mug.blur();
    // Near-horizontal rays and a bulb below the mug must remain bounded.
    const grazing = castFrom(10000, 10000, 250, { x: 0, y: 0, height: 200, on: true });
    await expect(Math.hypot(grazing.x, grazing.y)).toBeLessThanOrEqual(1440.001);
    const overhead = castFrom(10, 10, 250, { x: 10, y: 10, height: 720, on: true });
    await expect(overhead.x).toBe(0);
    await expect(overhead.y).toBe(0);
  },
};

/** The desk is deeper than the frame, because depth foreshortens: 1020 units of desktop draw about 760 tall. */
const DESK_DEPTH = 1020;

type Id = 'note' | 'pen' | 'mug' | 'clock';
const START: Record<Id, Place> = {
  note: { x: 500, y: 200, rotation: 4 },
  pen: { x: 620, y: 700, rotation: -12 },
  mug: { x: 150, y: 120, rotation: 35 },
  clock: { x: 1050, y: 560 },
};
const WIDTHS: Record<Id, number> = { note: 152, pen: 298, mug: 280, clock: 180 };
const LABELS: Record<Id, string> = { note: 'Sticky note', pen: 'Marker', mug: 'Mug', clock: 'Desk clock' };

/** A desk with four things on it, two of which stand up. Everything is drawn in plan; only the plane is tilted. */
function ADesk(args: Story['args']) {
  const [places, setPlaces] = useState(START);
  const [stacking, setStacking] = useState<Id[]>(['note', 'pen', 'clock', 'mug']);
  const thing = (id: Id) => ({
    ...places[id],
    width: WIDTHS[id],
    z: 1 + stacking.indexOf(id),
    label: LABELS[id],
    onMove: (to: Partial<Place>) => setPlaces((all) => ({ ...all, [id]: { ...all[id], ...to } })),
    onGrab: () => setStacking((order) => [...order.filter((other) => other !== id), id]),
  });
  return (
    <div style={{ background: '#1a1512', padding: '0 0 40px' }}>
      <Perspective {...args}>
        <Desk height={DESK_DEPTH} edge={0}>
          <Movable {...thing('note')}>
            <StickyNote color="canary" size={78}>
              <p>Drag me about</p>
            </StickyNote>
          </Movable>
          <Movable {...thing('pen')}>
            <Pen kind="marker" ink="#c9432f" />
          </Movable>
          <Movable {...thing('mug')}>
            <Solid height={MUG_HEIGHT} foot={MUG_FOOT}>
              <Mug coffee={0.6} />
            </Solid>
          </Movable>
          <Movable {...thing('clock')}>
            <Standing>
              <DeskClock finish="black" />
            </Standing>
          </Movable>
        </Desk>
      </Perspective>
    </div>
  );
}

/**
 * Standing at the desk, looking down at it at sixty degrees. The note and the
 * marker lie in the plane and foreshorten with it; the mug draws its own side
 * and stands on the desk, and the clock is stood up as a cutout. Drag
 * anything: it follows the pointer across the desk, which near the front edge
 * is a shorter trip than the same travel at the back.
 */
export const Standing_At_It: Story = {
  name: 'Standing at it',
  args: { angle: STANDING_VIEW, depth: 3200 },
  render: (args) => <ADesk {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const plane = canvasElement.querySelector<HTMLElement>('.perspective__plane')!;
    /* The near edge is not foreshortened, so it measures a unit for us. */
    const perUnit = plane.getBoundingClientRect().width / 1440;
    const travel = 120 * perUnit;
    const dragDown = async (thing: HTMLElement) => {
      const box = thing.getBoundingClientRect();
      const from = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
      const before = Number(thing.style.getPropertyValue('--movable-y'));
      await userEvent.pointer([
        { keys: '[MouseLeft>]', target: thing, coords: { clientX: from.x, clientY: from.y } },
        { coords: { clientX: from.x, clientY: from.y + 20 } },
        { coords: { clientX: from.x, clientY: from.y + travel } },
        { keys: '[/MouseLeft]', coords: { clientX: from.x, clientY: from.y + travel } },
      ]);
      return Number(thing.style.getPropertyValue('--movable-y')) - before;
    };
    /* The note lies at the back of the desk, the marker at the front. */
    const atTheBack = await dragDown(canvas.getByRole('group', { name: 'Sticky note' }));
    const atTheFront = await dragDown(canvas.getByRole('group', { name: 'Marker' }));
    /* Depth is foreshortened, so travel down the screen buys more desk than it would seen from overhead. */
    await expect(atTheBack).toBeGreaterThan(120);
    await expect(atTheFront).toBeGreaterThan(120);
    /* And further off it buys more still: the same travel is a longer trip at the back of the desk than at the front. */
    await expect(atTheBack).toBeGreaterThan(atTheFront);

    /* The mug is laid on the desk at an angle, and still stands up straight: turning a thing on a
       surface spins it about its upright, so its rim goes up from its base and not off to one side. */
    const base = canvasElement.querySelector<SVGElement>('.mug__base')!.getBoundingClientRect();
    const rim = canvasElement.querySelector<SVGElement>('.mug__body')!.getBoundingClientRect();
    const sideways = rim.left + rim.width / 2 - (base.left + base.width / 2);
    const upward = base.top + base.height / 2 - (rim.top + rim.height / 2);
    await expect(upward).toBeGreaterThan(10);
    /* Laid at 35 degrees and not turned back, the rim would go off at 35 degrees too, which is most of the way over. */
    await expect(Math.abs(sideways) / upward).toBeLessThan(0.3);
  },
};

/** Straight down, the way everything is drawn. At ninety degrees the behavior does nothing at all. */
export const StraightDown: Story = {
  args: { angle: PLAN_VIEW },
  render: (args) => <ADesk {...args} />,
};

/**
 * The eye brought in close: the far edge falls away, the desk runs off towards
 * it, and what stands on the desk leans harder — a mug at the back throws its
 * rim further up and further out than one at the front would.
 */
export const CloseUp: Story = {
  args: { angle: 48, depth: 2200 },
  render: (args) => <ADesk {...args} />,
};

/**
 * The two ways a thing with height is handled, at an angle low enough to see
 * them plainly. The mug has a side of its own drawn: the rim and the handle
 * stand off the desk by the mug's height, the wall slides out from under them,
 * and the base stays where it is standing. The clock has not, so it is stood
 * up as a cutout — its own plan drawing, upright on its foot. The cutout is
 * convincing enough at a glance; a side is the honest answer.
 */
export const WhatStandsUp: Story = {
  args: { angle: 40 },
  render: (args) => (
    <div style={{ background: '#1a1512' }}>
      <Perspective {...args}>
        <Desk height={620} edge={0}>
          <div style={{ position: 'absolute', left: '10%', top: '34%', width: '20%' }}>
            <Solid height={MUG_HEIGHT} foot={MUG_FOOT}>
              <Mug />
            </Solid>
          </div>
          <div style={{ position: 'absolute', left: '58%', top: '40%', width: '14%' }}>
            <Standing>
              <DeskClock finish="black" />
            </Standing>
          </div>
        </Desk>
      </Perspective>
    </div>
  ),
};
