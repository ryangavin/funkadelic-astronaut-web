import { RunSheet, SitePlan } from './DeskPapers';
import { Contract } from '../../components/2D/Contract/Contract';
import { Handbill } from '../../experiments/BandIntro/Handbill';
import { BAND_HANDBILL_FRONT, BAND_HANDBILL_BACK } from '../../experiments/BandIntro/Handbill.band';
import { DossierCover } from './DossierCover';
import { BandDossier } from '../../sections/BandDossier/BandDossier';
import { memo, useCallback, useRef, useState, type ReactNode } from 'react';
import { Movable, type Place } from '../../behaviors/Movable/Movable';
import { Inspectable, useInspection } from '../../behaviors/Inspectable/Inspectable';
import { Solid, type Foot } from '../../behaviors/Perspective/Perspective';
import { Relief, StudyLighting, ROUND_CASE, type StudyCamera, type StudyShape } from '../../behaviors/Perspective/DeskObjectStudy';
import { CradleRelief } from '../../behaviors/Perspective/CradleRelief';
import { elevatedLayer } from '../../behaviors/Perspective/elevation';
import { DeskClock } from '../../components/3D/DeskClock/DeskClock';
import { DeskPhone, DESK_PHONE_WIDTH, DESK_PHONE_DEPTH, DESK_PHONE_HEIGHT, DESK_PHONE_FOOT, SET_BODY_HEIGHT } from '../../components/3D/DeskPhone/DeskPhone';
import { Handheld } from '../../components/3D/Handheld/Handheld';
import { HANDHELD_SILHOUETTE } from '../../components/3D/Handheld/silhouette';
import { LabelBro, LABEL_BRO_HEIGHT, LABEL_BRO_FOOT } from '../../components/3D/LabelBro/LabelBro';
import { Mug } from '../../components/3D/Mug/Mug';
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
type ObjectSpec = { flat?: boolean; id: string; name: string; width: number; ratio: number; height: number; place: Place; content?: ReactNode; solid?: { height: number; foot: Foot; localCoordinates?: boolean }; shapes?: StudyShape[]; colors?: readonly [string, string, string]; inspect?: Inspect };
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
/* The dossier is drawn as a spread with the folder closed on the right of it, so the thing to bring
   up is the cover and not the empty half beside it. */
const READ_FOLDER: Inspect = { fill: 0.86, subject: '.folder__cover' };
const OBJECT_DRAWINGS: ObjectSpec[] = [
  { id: 'sitePlan', name: 'Festival site plan', width: 380, ratio: 11/8.5, height: .2, flat: true, place: { x: 400, y: 455, rotation: -8 }, content: <SitePlan /> , inspect: READ },
  { id: 'poster', name: 'Band poster', width: 400, ratio: 11/8.5, height: .2, flat: true, place: { x: 455, y: 385, rotation: -5 }, content: <Handbill front={BAND_HANDBILL_FRONT} back={BAND_HANDBILL_BACK} stock="goldenrod" spot="purple" /> , inspect: TURN_OVER },
  { id: 'setTimes', name: 'Set times', width: 440, ratio: 11/8.5, height: .2, flat: true, place: { x: 655, y: 415, rotation: 4 }, content: <RunSheet /> , inspect: READ },
  { id: 'contract', name: 'Performance contract', width: 460, ratio: 11/8.5, height: .2, flat: true, place: { x: 960, y: 415, rotation: -3 }, content: <Contract rotation={0} /> , inspect: READ },
  { id: 'dossier', name: 'Band dossier', width: 1200, ratio: 960/1440, height: 1, flat: true, place: { x: 370, y: 330, rotation: -2 }, content: <BandDossier className="dossier--branded" sticker={<DossierCover />} open={false} rotation={0} tape={null} /> , inspect: READ_FOLDER },
  { id: 'clock', name: 'Desk clock', width: 180, ratio: 560/720, height: 15, place: { x: 60, y: 65, rotation: -4 }, content: <DeskClock /> },
  // CradleRelief works its own rail and ball elevations out of the width it is given.
  { id: 'cradle', name: 'Newton’s cradle', width: 240, ratio: 600/720, height: 90, place: { x: 330, y: 65, scale: 1.2 }, shapes: [{ path: 'M3 5H97V95H3Z', heightMm: 8 }, { path: 'M8 20H92V23H8Z M8 77H92V80H8Z', heightMm: 90 }] },
  { id: 'mug', name: 'Mug', width: 280, ratio: 1, height: 95, place: { x: 1010, y: 570, rotation: -15 }, solid: { height: 95/140, foot: { x: 104/240, y: 120/240 } }, content: <Mug rotation={0} shadow="contact" /> },
  { id: 'rolodex', name: 'Rolodex', width: 274.1, ratio: 624/518, height: 107.95, place: { x: 1170, y: 330, rotation: 4 }, solid: { localCoordinates: true, height: 408/518, foot: { x: .5, y: 312/518 } }, content: <Rolodex rotation={0} loose={false} /> , inspect: HANDLE },
  { id: 'handheld', name: 'Handheld', width: 408, ratio: 327/720, height: 23, place: { x: 30, y: 250, rotation: -5 }, content: <Handheld rotation={0} />, shapes: [{ path: HANDHELD_SILHOUETTE }], colors: ['#17181b', '#141519', '#090a0d'] , inspect: HANDLE },
  { id: 'labelBro', name: 'Label Bro', width: 366, ratio: 772/732, height: 65, place: { x: 755, y: 515, rotation: -5 }, solid: { localCoordinates: true, height: LABEL_BRO_HEIGHT, foot: LABEL_BRO_FOOT }, content: <LabelBro rotation={0} defaultOn defaultText="BACKLINE" /> , inspect: HANDLE },
  { id: 'pen', name: 'Pen', width: 298, ratio: 60/720, height: 3.5, place: { x: 450, y: 330, rotation: 8 }, shapes: [{ path: 'M.3 28H3.3V18H17.2V28H19.7V33H96.4L99.9 50L96.4 67H19.7V72H.3Z' }] },
  { id: 'walkman', name: 'Walkman', width: 224, ratio: 590/720, height: 30, place: { x: 770, y: 260, rotation: -6 }, content: <Walkman rotation={0} /> , inspect: HANDLE },
  // Its own drawing, at the desk's two units to the millimetre: the phone alone
  // since the answering machine became its own component. The silhouette is the
  // 221 by 229 housing within that plan, and it stands at the moulding's height.
  { id: 'phone', name: 'Desk phone', width: DESK_PHONE_WIDTH * 2, ratio: DESK_PHONE_DEPTH / DESK_PHONE_WIDTH, height: SET_BODY_HEIGHT, place: { x: 45, y: 415, scale: 0.8 }, solid: { height: DESK_PHONE_HEIGHT, foot: DESK_PHONE_FOOT }, content: <DeskPhone rotation={0} sound={false} />, shapes: [{ path: 'M33.1 12H81Q91.6 12 91.6 23.3V72.3Q91.6 88.3 76.6 88.3H37.5Q22.5 88.3 22.5 72.3V23.3Q22.5 12 33.1 12Z' }] , inspect: HANDLE },
];
// A wider desktop: retain relative physical sizes while fitting the 16:9 composition.
const OBJECT_SCALE = 0.6;
export const DESK_OBJECTS = OBJECT_DRAWINGS.map(object => ({ ...object, width: object.width * OBJECT_SCALE, height: object.height * OBJECT_SCALE, shapes: object.shapes?.map(shape => ({ ...shape, heightMm: shape.heightMm === undefined ? undefined : shape.heightMm * OBJECT_SCALE })) }));
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

function PenRelief({ place, camera, width }: { place: Place; camera: StudyCamera; width: number }) {
  const top = elevatedLayer(7 * OBJECT_SCALE * (place.scale ?? 1), { ...place, width, drawingWidth: 720, drawingHeight: 60 }, camera);
  return <div style={{ position: 'relative', aspectRatio: '720 / 60' }}>
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', filter: 'brightness(.65)' }}><Pen rotation={0} /></div>
    <div style={{ position: 'relative', transform: `translate(${top.x / 720 * 100}%, ${top.y / 60 * 100}%) scale(${top.scale})` }}><Pen rotation={0} /></div>
  </div>;
}

/*
  One thing's shadow. Each silhouette is sixteen blurred copies of the thing's
  own outline stacked up through its height, so a desk of them is a great many
  filtered paths: it is drawn per thing and memoised per thing, and moving one
  thing redraws one shadow rather than all of them. The light is still context,
  so every shadow does move together when the lamp does.
*/
const ObjectShadow = memo(function ObjectShadow({ object, place, height }: { object: ObjectSpec; place: Place; height: number }) {
  const size = sizeOf(object, place);
  return <StudyLighting shadowOnly surfaceHeight={height} place={place} pivot={pivotOf(object)} width={size.width} depth={size.depth} heightMm={size.heightMm} mug={object.id === 'mug'} shapes={(object.shapes ?? [{ path: ROUND_CASE }] as StudyShape[]).map(shape => ({ ...shape, heightMm: shape.heightMm === undefined ? undefined : shape.heightMm * size.scale }))} />;
});

export function DeskObjectShadows({ placements, height }: { placements: ObjectPlacements; height: number }) {
  return <>{DESK_OBJECTS.filter(object => !object.flat).map(object =>
    <ObjectShadow key={object.id} object={object} place={placements[object.id] ?? object.place} height={height} />)}</>;
}

/*
  One thing on the desk. It is memoised so that dragging one thing leaves the
  other fifteen alone: each of them otherwise rebuilt its Relief or its Solid,
  and every Solid measures itself off the plane the moment it renders, so a
  single drag was paying for a whole desk of measurements a frame.
*/
const DeskObject = memo(function DeskObject({ object, place, camera, layer, held, onFront, onMove }: { object: ObjectSpec; place: Place; camera: StudyCamera; layer: number; held: boolean; onFront: (id: string) => void; onMove: (id: string, place: Place) => void }) {
  const size = sizeOf(object, place);
  const drawing = object.flat ? object.content : object.id === 'pen' ? <PenRelief place={place} camera={camera} width={size.width} /> : object.id === 'cradle' ? <CradleRelief place={place} camera={camera} width={size.width} /> : object.solid ? <Solid {...object.solid}>{object.content}</Solid> : <Relief place={place} camera={camera} width={size.width} depth={size.depth} heightMm={size.heightMm} path={object.shapes?.[0].path ?? ROUND_CASE} sideColors={object.colors}>{object.content}</Relief>;
  return <Movable {...place} width={object.width} pivot={pivotOf(object)} resizable label={object.name} z={held ? INSPECT_LAYER : layer} onGrab={() => { if (object.flat) onFront(object.id); }} grab={object.id === 'poster' ? 'anywhere' : object.flat ? 'body' : 'anywhere'} onMove={next => onMove(object.id, { ...place, ...next })}>
    {object.inspect ? <Inspectable id={object.id} {...object.inspect}>{drawing}</Inspectable> : drawing}
  </Movable>;
});

export function DeskObjects({ placements, camera, onMove }: { placements: ObjectPlacements; camera: StudyCamera; onMove: (id: string, place: Place) => void }) {
  const [front, setFront] = useState<string>();
  const inspection = useInspection();
  /* Both are handed down to a memoised thing, so they have to keep their identity
     between renders or nothing is saved by memoising at all. */
  const move = useRef(onMove);
  move.current = onMove;
  const moved = useCallback((id: string, next: Place) => move.current(id, next), []);
  const bringForward = useCallback((id: string) => setFront(id), []);
  return <>{DESK_OBJECTS.map((object, index) => {
    /* Paper stays under everything that stands up, however recently it was handled. */
    const layer = object.flat ? (front === object.id ? PAPER_LAYER + DESK_OBJECTS.length : PAPER_LAYER + index) : OBJECT_LAYER + index;
    return <DeskObject key={object.id} object={object} place={placements[object.id] ?? object.place} camera={camera} layer={layer} held={inspection?.held === object.id} onFront={bringForward} onMove={moved} />;
  })}</>;
}
