import { DESK_MM, UNITS_PER_MM } from '../../../geometry/physicalScale';
import { Solid } from '../../../behaviors/Perspective/Perspective';
import { PerspectiveDesk } from '../../../experience/Desk/PerspectiveDesk';
import { DeskObjectStudy } from '../../../experience/debug/ObjectStudy/DeskObjectStudy';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Movable, type Place } from '../../../behaviors/Movable/Movable';
import { Room } from '../../../foundations/Room/Room';
import { Pen } from '../Pen/Pen';
import { StickyNote } from '../../2D/StickyNote/StickyNote';
import { CoffeeRing } from './CoffeeRing';
import { MUG_FOOT, MUG_HEIGHT, MUG_SILHOUETTE, MUG_TALL, Mug } from './Mug';
import { CoffeeRings, Stained } from './Stained';
import { DESK, useCoffeeTrail } from './trail';

const meta = {
  title: 'Library/Components/3D/Mug',
  component: Mug,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    glaze: { control: 'color' },
    drink: { control: 'color' },
    coffee: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
  },
  args: { glaze: '#e8dfcc', drink: '#3a2113', coffee: 0.7 },
  decorators: [
    /* The mug is shown the size a mug is held at, unless a story asks for room to move it about. */
    (Story, { parameters }) => parameters.composition ? <Story /> : (
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
export const Coffee: Story = {};

/** Drunk: the bottom of the mug, and what dried on it. */
export const Empty: Story = {
  args: { coffee: 0 },
};

/** A dark glaze, tea in it. */
export const Tea: Story = {
  args: { glaze: '#2d4a3e', drink: '#a5561e', coffee: 0.9 },
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
  sheet: { place: { x: 660, y: 130 }, width: 432, label: 'Sheet of paper' },
  note: { place: { x: 150, y: 560 }, width: 152, label: 'Sticky note' },
  pen: { place: { x: 780, y: 730 }, width: 280, label: 'Marker' },
  mug: { place: { x: 300, y: 180 }, width: 280, label: 'Mug' },
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
    onSettle: (place: Place) => { if (id === 'mug') trail.settleAt({ ...place, width: DESK_THINGS.mug.width }); },
    onBlur: trail.settle,
  });

  return (
    <Room headTiltDegrees={90} eyeHeightMm={2250} viewerSetbackMm={800} room={false} lamp={false} deskShare={1} roomLip={0}>
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
          <Mug glaze="#e9e1cf" coffee={0.6} />
        </Movable>
    </Room>
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
  parameters: { layout: 'fullscreen', shownAt: '100%', composition: true },
  render: () => <MugOnTheMove />,
};

export const OnDesk: Story = {
  name: 'On desk',
  parameters: { layout: 'fullscreen', composition: true },
  render: (args) => <DeskObjectStudy name="Mug" widthMm={140} depthRatio={1} heightMm={MUG_TALL} shapes={MUG_SILHOUETTE} solid={{ height: MUG_HEIGHT, foot: MUG_FOOT }} note="Estimated 82 mm body diameter × 95 mm height; the 140 mm artwork box includes empty space."><Mug {...args} shadow="contact" /></DeskObjectStudy>,
};

/** The composition owns footprints, at the mug's current size, in fixed desk units. */
export const Footprints: Story = {
  parameters: { layout: 'fullscreen', composition: true },
  render: function FootprintScene() {
    const [wide, setWide] = useState(false);
    return <><button onClick={() => setWide(value => !value)}>Change desk dimensions</button>
      <PerspectiveDesk only={['mug']} showSettings={false} lamp={false} eyeHeightMm={1800} viewerSetbackMm={500} deskWidthMm={wide ? 1600 : 1200} deskDepthMm={wide ? 1000 : 800} />
    </>;
  },
};

/** Where the eye is when it is `distance` desk units along a gaze at `tilt` degrees that lands on the desk's front edge. */
const eyeAlongGaze = (tilt: number, distance: number) => {
  const pitch = tilt * Math.PI / 180, clearance = distance * Math.sin(pitch) / UNITS_PER_MM;
  return { eyeHeightMm: DESK_MM.height + clearance, viewerSetbackMm: DESK_MM.depth + clearance / Math.tan(pitch) };
};

/** The mug at a shallow 25° view, away from the optical axis; the button swaps to 70°. */
export const ExactProjection: Story = {
  parameters: { layout: 'fullscreen', composition: true },
  render: function ProjectionScene(_, { parameters }) {
    const [angle, setAngle] = useState(25);
    const [place, setPlace] = useState({ x: 980, y: 300, rotation: 38, scale: 1.25 });
    /* The eye 1800 desk units along the gaze, aimed at the desk's front edge, at either tilt. */
    const eye = eyeAlongGaze(angle, 1800);
    return <><button onClick={() => setAngle(angle === 25 ? 70 : 25)}>Change angle</button>
      <Room headTiltDegrees={angle} {...eye} room={false} lamp={false} deskShare={1} roomLip={0}>
        <Movable {...place} width={168} resizable label="Mug" onMove={to => setPlace(at => ({ ...at, ...to }))}>
          {parameters.exactSolid ? <Solid height={MUG_HEIGHT} foot={MUG_FOOT}><Mug /></Solid> : <Mug />}
        </Movable>
      </Room></>;
  },
};

/** The same scene with the mug inside the `Solid` adapter the physical Room desk uses. */
export const ExactSolidProjection: Story = {
  ...ExactProjection,
  parameters: { ...ExactProjection.parameters, exactSolid: true },
};
