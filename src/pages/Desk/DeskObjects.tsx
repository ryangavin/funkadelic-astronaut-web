import { CoffeeRings } from '../../components/3D/Mug/Stained';
import { DESK, useCoffeeTrail } from '../../components/3D/Mug/trail';
import { PAPER_MM, mmToUnits } from '../../geometry/physicalScale';
import { RunSheet, SitePlan } from './DeskPapers';
import { Contract } from '../../components/2D/Contract/Contract';
import { Handbill } from '../../experiments/BandIntro/Handbill';
import { BAND_HANDBILL_FRONT, BAND_HANDBILL_BACK } from '../../experiments/BandIntro/Handbill.band';
import { DeskDossier } from './DeskDossier';
import { memo, useCallback, useRef, useState, type ReactNode } from 'react';
import { Movable, type Place } from '../../behaviors/Movable/Movable';
import { usePlace, usePlaceEffect, usePlaces } from '../../behaviors/Movable/places';
import { Tallied } from '../../debug/DeskPerf/tally';
import { Inspectable, useInspection } from '../../behaviors/Inspectable/Inspectable';
import { Solid, type Foot } from '../../behaviors/Perspective/Perspective';
import { StudyLighting } from '../../behaviors/Perspective/CastShadow';
import { Relief } from '../../behaviors/Perspective/Relief';
import { CradleRelief } from '../../behaviors/Perspective/CradleRelief';
import { elevatedLayer, ROUND_CASE, type StudyCamera, type StudyShape } from '../../behaviors/Perspective/elevation';
import { DeskClock } from '../../components/3D/DeskClock/DeskClock';
import { DeskPhone, DESK_PHONE_WIDTH, DESK_PHONE_DEPTH, DESK_PHONE_HEIGHT, DESK_PHONE_FOOT, SET_BODY_HEIGHT } from '../../components/3D/DeskPhone/DeskPhone';
import { Handheld } from '../../components/3D/Handheld/Handheld';
import { HANDHELD_SILHOUETTE } from '../../components/3D/Handheld/silhouette';
import { LabelBro, LABEL_BRO_HEIGHT, LABEL_BRO_FOOT } from '../../components/3D/LabelBro/LabelBro';
import { MUG_FOOT, MUG_HEIGHT, MUG_SILHOUETTE, MUG_TALL, Mug } from '../../components/3D/Mug/Mug';
import { Pen } from '../../components/3D/Pen/Pen';
import { Rolodex } from '../../components/3D/Rolodex/Rolodex';
import { Walkman } from '../../components/3D/Walkman/Walkman';

/*
  Each thing is drawn at its own real size, and then at whatever the composition
  asks of it on top of that. That second number is its `scale`, and it lives in
  the placement beside x, y and rotation rather than in the code here: it is
  dragged on the desk by the size handle and captured with Copy desk settings,
  the same way a position is. It takes a drawing's width and its declared height
  together, which is the one way to move a thing's size without it standing at a
  height its own shadow disagrees with.
*/
type ObjectSpec = { flat?: boolean; id: string; name: string; width: number; widthMm: number; ratio: number; height: number; place: Place; content?: ReactNode; solid?: { height: number; foot: Foot; localCoordinates?: boolean }; shapes?: StudyShape[]; colors?: readonly [string, string, string]; inspect?: Inspect };
/*
  What happens when a thing is picked up and looked at — and nothing at all for
  the things that are only ever scenery. A sheet is there to be read, so it
  comes up square on and nearly fills the frame; a machine is there to be played
  with, so it comes up the way it was lying, at a size you could get your hands
  round, with every button on it still working.
*/
type Inspect = { fill?: number; upright?: boolean; grab?: 'body' | 'anywhere'; subject?: string };
const READ: Inspect = { fill: 0.9 };
const HANDLE: Inspect = { fill: 0.7, upright: false };
/* The handbill is one big button to turn it over, so nothing is left of its face to pick it up by:
   it comes up on the first press, and is turned over while it is up. */
const TURN_OVER: Inspect = { fill: 0.9, grab: 'anywhere' };
const OBJECT_DRAWINGS: Omit<ObjectSpec, 'width'>[] = [
  { id: 'sitePlan', name: 'Festival site plan', widthMm: PAPER_MM.width, ratio: PAPER_MM.height / PAPER_MM.width, height: .2, flat: true, place: { x: 400, y: 455, rotation: -8 }, content: <SitePlan /> , inspect: READ },
  { id: 'poster', name: 'Band poster', widthMm: PAPER_MM.width, ratio: PAPER_MM.height / PAPER_MM.width, height: .2, flat: true, place: { x: 455, y: 385, rotation: -5 }, content: <Handbill front={BAND_HANDBILL_FRONT} back={BAND_HANDBILL_BACK} stock="goldenrod" spot="purple" /> , inspect: TURN_OVER },
  { id: 'setTimes', name: 'Set times', widthMm: PAPER_MM.width, ratio: PAPER_MM.height / PAPER_MM.width, height: .2, flat: true, place: { x: 655, y: 415, rotation: 4 }, content: <RunSheet /> , inspect: READ },
  { id: 'contract', name: 'Performance contract', widthMm: PAPER_MM.width, ratio: PAPER_MM.height / PAPER_MM.width, height: .2, flat: true, place: { x: 960, y: 415, rotation: -3 }, content: <Contract rotation={0} /> , inspect: READ },
  { id: 'dossier', name: 'Band dossier', widthMm: 482, ratio: 915/1440, height: 1, flat: true, place: { x: 200, y: 330, rotation: -2 } },
  { id: 'clock', name: 'Desk clock', widthMm: 90, ratio: 560/720, height: 15, place: { x: 60, y: 65, rotation: -4 }, content: <DeskClock /> },
  // CradleRelief works its own rail and ball elevations out of the width it is given.
  { id: 'cradle', name: 'Newton’s cradle', widthMm: 120, ratio: 600/720, height: 90, place: { x: 330, y: 65 }, shapes: [{ path: 'M3 5H97V95H3Z', heightMm: 8 }, { path: 'M8 20H92V23H8Z M8 77H92V80H8Z', heightMm: 90 }] },
  { id: 'mug', name: 'Mug', widthMm: 140, ratio: 1, height: MUG_TALL, place: { x: 1010, y: 570, rotation: -15 }, shapes: MUG_SILHOUETTE, solid: { height: MUG_HEIGHT, foot: MUG_FOOT }, content: <Mug shadow="contact" /> },
  { id: 'rolodex', name: 'Rolodex', widthMm: 137.05, ratio: 624/518, height: 107.95, place: { x: 1170, y: 330, rotation: 4 }, solid: { localCoordinates: true, height: 408/518, foot: { x: .5, y: 312/518 } }, content: <Rolodex rotation={0} loose={false} /> , inspect: HANDLE },
  { id: 'handheld', name: 'Handheld', widthMm: 170, ratio: 327/720, height: 23, place: { x: 30, y: 250, rotation: -5 }, content: <Handheld rotation={0} />, shapes: [{ path: HANDHELD_SILHOUETTE }], colors: ['#17181b', '#141519', '#090a0d'] , inspect: HANDLE },
  { id: 'labelBro', name: 'Label Bro', widthMm: 183, ratio: 772/732, height: 78, place: { x: 755, y: 515, rotation: -5 }, solid: { localCoordinates: true, height: LABEL_BRO_HEIGHT, foot: LABEL_BRO_FOOT }, content: <LabelBro rotation={0} defaultOn defaultText="BACKLINE" /> , inspect: HANDLE },
  { id: 'pen', name: 'Pen', widthMm: 149, ratio: 60/720, height: 7, place: { x: 450, y: 330, rotation: 8 }, shapes: [{ path: 'M.3 28H3.3V18H17.2V28H19.7V33H96.4L99.9 50L96.4 67H19.7V72H.3Z' }] },
  { id: 'walkman', name: 'Walkman', widthMm: 112, ratio: 590/720, height: 30, place: { x: 770, y: 260, rotation: -6 }, content: <Walkman rotation={0} /> , inspect: HANDLE },
  // Its own drawing, in millimetres: the phone alone
  // since the answering machine became its own component. The silhouette is the
  // 221 by 229 housing within that plan, and it stands at the moulding's height.
  { id: 'phone', name: 'Desk phone', widthMm: DESK_PHONE_WIDTH, ratio: DESK_PHONE_DEPTH / DESK_PHONE_WIDTH, height: SET_BODY_HEIGHT, place: { x: 45, y: 415 }, solid: { height: DESK_PHONE_HEIGHT, foot: DESK_PHONE_FOOT }, content: <DeskPhone rotation={0} sound={false} />, shapes: [{ path: 'M33.1 12H81Q91.6 12 91.6 23.3V72.3Q91.6 88.3 76.6 88.3H37.5Q22.5 88.3 22.5 72.3V23.3Q22.5 12 33.1 12Z' }] , inspect: HANDLE },
];
// Width describes the entire artwork box (including cord/empty folder spread),
// not necessarily the physical footprint. Keep silhouettes and Solid feet local.
export const DESK_OBJECTS: ObjectSpec[] = OBJECT_DRAWINGS.map(object => ({ ...object, width: mmToUnits(object.widthMm) }));
export const DEFAULT_OBJECT_PLACEMENTS = Object.fromEntries(DESK_OBJECTS.map(object => [object.id, { rotation: 0, scale: 1, ...object.place }]));
export type ObjectPlacements = Record<string, Place>;

/* Paper lies on the desk and everything with a height of its own stands on top
   of it: a sheet can never end up over the mug. Within each band the order is
   the order they are drawn in, except that the sheet last picked up comes to
   the top of the paper. */
const PAPER_LAYER = 1;
const OBJECT_LAYER = 100;
/* A thing held up to be looked at is in front of the veil, and so in front of the desk and everything still on it. */
const INSPECT_LAYER = 5000;

/*
  What a thing turns and grows about. A drawing is a plan of the thing plus
  whatever room its drawing needed beside it, so the middle of the box is often
  not the middle of the thing — the phone's housing sits to the right of its own
  plan, with the cord's coil filling the rest. A Solid already says where its
  thing meets the desk, as a fraction of the drawing's width; as a fraction of
  the box's height that is the same number over the box's proportions. Anything
  without a foot of its own turns about its middle.
*/
const pivotOf = (object: ObjectSpec) => (object.solid ? { x: object.solid.foot.x, y: object.solid.foot.y / object.ratio } : { x: 0.5, y: 0.5 });

/** How big a thing is drawn right now: its own size, times whatever the composition asks. */
const sizeOf = (object: ObjectSpec, place: Place) => {
  const scale = place.scale ?? 1;
  return { scale, width: object.width * scale, depth: object.width * object.ratio * scale, heightMm: object.height * scale };
};

/*
  The pen is too shallow for a stack of layers: a darker copy of the drawing
  lying flat is its whole side, with the pen itself lifted the 7 mm above it.
  Where that lift lands is written from its place rather than rendered, the way
  a Relief's layers are.
*/
function PenRelief({ place, placeId, camera, width }: { place: Place; placeId?: string; camera: StudyCamera; width: number }) {
  const face = useRef<HTMLDivElement>(null);
  const at = useRef<Place>(place);
  if (!placeId) at.current = place;
  usePlaceEffect(placeId, where => {
    if (where) at.current = where;
    const top = face.current;
    if (!top) return;
    const here = at.current, grown = here.scale ?? 1;
    const lift = elevatedLayer(mmToUnits(7) * grown, { ...here, width: width * grown, drawingWidth: 720, drawingHeight: 60 }, camera);
    top.style.transform = `translate(${lift.x / 720 * 100}%, ${lift.y / 60 * 100}%) scale(${lift.scale})`;
  });
  return <div style={{ position: 'relative', aspectRatio: '720 / 60' }}>
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', filter: 'brightness(.65)' }}><Pen rotation={0} /></div>
    <div ref={face} style={{ position: 'relative' }}><Pen rotation={0} /></div>
  </div>;
}

/*
  One thing's shadow. Each silhouette is sixteen blurred copies of the thing's
  own outline stacked up through its height, so a desk of them is a great many
  filtered paths: it is drawn per thing and memoised per thing, and moving one
  thing redraws one shadow rather than all of them. The light is still context,
  so every shadow does move together when the lamp does.
*/
const ObjectShadow = memo(function ObjectShadow({ object, place, height, surfaceWidth }: { surfaceWidth?: number; object: ObjectSpec; place: Place; height: number }) {
  /* Its size at a scale of one: whatever the thing has been grown to is read off
     its place, in the caster, where a drag can reach it without a render. */
  const size = { width: object.width, depth: object.width * object.ratio, heightMm: object.height };
  /* Counted apart from the thing itself: a shadow that rebuilds when its object
     moves is a different fact from the object rebuilding, and they want different fixes. */
  return <Tallied id={`${object.name} — shadow`}><StudyLighting shadowOnly surfaceWidth={surfaceWidth} surfaceHeight={height} place={place} placeId={object.id} pivot={pivotOf(object)} width={size.width} depth={size.depth} heightMm={size.heightMm} shapes={object.shapes ?? [{ path: ROUND_CASE }] as StudyShape[]} /></Tallied>;
});

/** Which things are on the desk at all: everything, or the few named. */
const chosen = (only?: readonly string[]) => (only ? DESK_OBJECTS.filter(object => only.includes(object.id)) : DESK_OBJECTS);

/*
  The shadows take no placements. Each follows its own thing through the store
  and writes itself, so this renders once and then sits still however much is
  dragged about over it.
*/
export function DeskObjectShadows({ height, surfaceWidth, only }: { surfaceWidth?: number; height: number; only?: readonly string[] }) {
  return <>{chosen(only).filter(object => !object.flat).map(object =>
    <ObjectShadow surfaceWidth={surfaceWidth} key={object.id} object={object} place={DEFAULT_OBJECT_PLACEMENTS[object.id] ?? object.place} height={height} />)}</>;
}

/*
  One thing on the desk. It is memoised so that dragging one thing leaves the
  other fifteen alone: each of them otherwise rebuilt its Relief or its Solid,
  and every Solid measures itself off the plane the moment it renders, so a
  single drag was paying for a whole desk of measurements a frame.
*/
/*
  Which things still have to be rebuilt when they move.

  A Solid measures itself off the plane through its own small subscribed
  wrapper. A sheet is the same drawing wherever it lies, and a Relief and the
  pen write their own layers by subscription, so none rebuilds this owner.

  That leaves the cradle. Its drawing is worked out point by point from where it
  stands, and its rails, strings and five hanging balls are all different
  geometry rather than the same shape moved, so it is rendered again. It is also
  the one thing here that re-renders for a reason of its own — while it is
  swinging it redraws every frame regardless, which is what an animation is.
*/
const worksItselfOutFromWhereItStands = (object: ObjectSpec) => object.id === 'cradle';

/** Only the solid's projection re-renders when its place changes. Its content
 * element stays stable, so moving a phone doesn't rebuild its controls. */
function PositionedSolid({ object }: { object: ObjectSpec }) {
  usePlace(object.id);
  return <Solid {...object.solid!}>{object.content}</Solid>;
}

export const DeskObject = memo(function DeskObject({ object, place, camera, layer, held, onFront, onSettle }: { onSettle?: (place: Place) => void; object: ObjectSpec; place: Place; camera: StudyCamera; layer: number; held: boolean; onFront: (id: string) => void }) {
  const follows = worksItselfOutFromWhereItStands(object);
  const places = usePlaces();
  /* Subscribed only by the thing that still needs it; the hook is always called,
     and given no id it subscribes to nothing. */
  const moving = usePlace(follows ? object.id : undefined);
  const at = moving ?? places?.get(object.id) ?? place;
  const size = sizeOf(object, at);
  /* Sizes handed on at a scale of one: whatever the thing has been grown to is
     read off its place, inside the drawing, where a drag can reach it without a render. */
  const drawing = object.flat ? object.content : object.id === 'pen' ? <PenRelief place={at} placeId={object.id} camera={camera} width={object.width} /> : object.id === 'cradle' ? <CradleRelief place={at} camera={camera} width={size.width} /> : object.solid ? <PositionedSolid object={object} /> : <Relief place={at} placeId={object.id} camera={camera} width={object.width} depth={object.width * object.ratio} heightMm={object.height} path={object.shapes?.[0].path ?? ROUND_CASE} sideColors={object.colors}>{object.content}</Relief>;
  return <Movable onSettle={onSettle} id={object.id} {...at} width={object.width} pivot={pivotOf(object)} resizable label={object.name} z={held ? INSPECT_LAYER : layer} onGrab={() => { if (object.flat) onFront(object.id); }} grab={object.id === 'poster' ? 'anywhere' : object.flat ? 'body' : 'anywhere'}>
    {object.inspect ? <Inspectable id={object.id} {...object.inspect}>{drawing}</Inspectable> : drawing}
  </Movable>;
});

/*
  The things on the desk. Where each lies is the store's, so this takes no
  placements and hears nothing when one is dragged: the thing being moved writes
  its own element, its shadow follows by subscription, and only a Relief — which
  is genuinely a different drawing at a different place — renders again.
*/
/** The desk owns stains; each set-down snapshots the mug's current drawn footprint.
 * Existing stains never subscribe to mug scale or follow it through its Solid. */
function MugWithTrail(props: React.ComponentProps<typeof DeskObject>) {
  const places = usePlaces();
  const footprint = () => ({ ...(places?.get(props.object.id) ?? props.place), width: props.object.width });
  const trail = useCoffeeTrail(footprint);
  return <>
    <CoffeeRings rings={trail.on(DESK)} />
    <DeskObject {...props} onSettle={place => { trail.lift(); trail.settleAt({ ...place, width: props.object.width }); }} />
  </>;
}

export function DeskObjects({ camera, only }: { camera: StudyCamera; only?: readonly string[] }) {
  const [front, setFront] = useState<string>();
  const inspection = useInspection();
  /* Handed down to a memoised thing, so it has to keep its identity between
     renders or nothing is saved by memoising at all. */
  const bringForward = useCallback((id: string) => setFront(id), []);
  return <>{chosen(only).map((object, index) => {
    /* Paper stays under everything that stands up, however recently it was handled. */
    const layer = object.flat ? (front === object.id ? PAPER_LAYER + DESK_OBJECTS.length : PAPER_LAYER + index) : OBJECT_LAYER + index;
    if (object.id === 'dossier') return <DeskDossier key={object.id} width={object.width} place={DEFAULT_OBJECT_PLACEMENTS[object.id]} layer={layer} onFront={bringForward} />;
    const Component = object.id === 'mug' ? MugWithTrail : DeskObject;
    return <Component key={object.id} object={object} place={DEFAULT_OBJECT_PLACEMENTS[object.id] ?? object.place} camera={camera} layer={layer} held={inspection?.held === object.id} onFront={bringForward} />;
  })}</>;
}
