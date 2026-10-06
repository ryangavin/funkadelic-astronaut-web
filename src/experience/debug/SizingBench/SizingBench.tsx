import { useEffect, useState, type ReactNode } from 'react';
import { Movable, type Place } from '../../../behaviors/Movable/Movable';
import { Relief } from '../../../behaviors/Perspective/Relief';
import { MeterStick, STICK_VARIANTS, METER_STICK_OUTLINE, type StickVariant } from '../../../components/3D/MeterStick/MeterStick';
import { useRoomCamera } from '../../../foundations/Room/Room';
import { DESK_MM, PAPER_MM, mmToUnits } from '../../../geometry/physicalScale';
import { DESK_OBJECTS, DEFAULT_OBJECT_PLACEMENTS, type ObjectPlacements } from '../../Desk/DeskObjects';
import { PerspectiveDesk, type PerspectiveDeskProps } from '../../Desk/PerspectiveDesk';
import './SizingBench.css';

/*
  The bench that settles how big things look, in the order that has an answer.

  A thing's size is not a decision: it is in DeskObjects, in millimetres, and
  the world set it. What is decided here is the camera, and it is decided
  against the paper, because the sheets are the content and the one thing on the
  desk that cannot be scaled without becoming a lie. So the bench shows the four
  sheets alone first, reads out how wide a 220 mm sheet actually is on this
  screen, and the camera is moved until that number is good. Only then is the
  rest of the desk turned on, at a scale of one, to see what falls out.
*/

/** What is on the desk: the sheets alone, everything at life size, or one thing to look at closely. */
export type SizingStage = 'papers' | 'everything' | 'one';

export type SizingBenchProps = Omit<PerspectiveDeskProps, 'only' | 'showSettings' | 'objectPlacements'> & {
  stage?: SizingStage;
  /** The one thing on the desk when the stage is `one`. */
  focus?: string;
  /** A ruler laid along the front of the desk, or none. */
  ruler?: StickVariant | 'none';
  /** How wide the front sheet should come out on this screen, in CSS pixels; the readout judges against it. */
  paperTargetPx?: number;
  /** Whether the readout is drawn over the scene. */
  readout?: boolean;
  /** The composition's own placements, so a captured arrangement can be judged too. Left out, everything is at life size. */
  objectPlacements?: ObjectPlacements;
};

const PAPER_IDS = DESK_OBJECTS.filter(object => object.flat && object.widthMm === PAPER_MM.width).map(object => object.id);
export const OBJECT_IDS = DESK_OBJECTS.map(object => object.id);

/** Everything at a scale of one: the composition's positions, but the world's sizes. */
export const LIFE_SIZE: ObjectPlacements = Object.fromEntries(Object.entries(DEFAULT_OBJECT_PLACEMENTS).map(([id, place]) => [id, { ...place, scale: 1 }]));

const RULER_ID = 'sizing-ruler';
const RULER_PLACE: Place = { x: mmToUnits(40), y: mmToUnits(DESK_MM.depth - 200), rotation: 0 };

/** A ruler lying on the desk among the things being measured. It is a Relief so it stands its 6 mm like they do. */
function Ruler({ variant }: { variant: StickVariant }) {
  const dimensions = STICK_VARIANTS[variant];
  const width = mmToUnits(dimensions.length);
  const depth = mmToUnits(dimensions.width);
  const camera = useRoomCamera();
  const place = RULER_PLACE;
  return <Movable id={RULER_ID} {...place} width={width} label={dimensions.label} grab="anywhere" resizable={false} z={50}>
    <Relief place={place} placeId={RULER_ID} camera={camera} width={width} depth={depth} heightMm={dimensions.height} path={METER_STICK_OUTLINE}>
      <MeterStick variant={variant} />
    </Relief>
  </Movable>;
}

type Row = { id: string; name: string; widthMm: number; scale: number; screenPx: number | null };
type Reading = { viewport: string; deskPx: number; pxPerMm: number; rows: Row[]; paperPx: number | null };

/*
  Read off the screen, not off the maths: each row is the width of the thing's
  own element as the eye sees it, perspective and all. The desk's own width is
  read the same way at its front edge, so pixels-per-millimetre is what a ruler
  laid there would say. Things are dragged without a render, so this polls.
*/
function measure(root: HTMLElement, shown: readonly string[], placements: ObjectPlacements, deskWidthMm: number): Reading | null {
  const desk = root.querySelector<HTMLElement>('.desk');
  if (!desk) return null;
  const deskPx = desk.getBoundingClientRect().width;
  const rows = DESK_OBJECTS.filter(object => shown.includes(object.id)).map(object => {
    const element = root.querySelector<HTMLElement>(`[role="group"][aria-label="${object.name}"]`);
    const box = element?.getBoundingClientRect();
    return { id: object.id, name: object.name, widthMm: object.widthMm, scale: placements[object.id]?.scale ?? 1, screenPx: box && box.width > 0 ? box.width : null };
  });
  const papers = rows.filter(row => PAPER_IDS.includes(row.id) && row.screenPx !== null);
  return {
    viewport: `${window.innerWidth} × ${window.innerHeight}`,
    deskPx,
    pxPerMm: deskPx / deskWidthMm,
    rows,
    paperPx: papers.length ? Math.max(...papers.map(row => row.screenPx!)) : null,
  };
}

/** Seven to a table, so the whole desk's readout fits in the band under the scene. */
const columns = (rows: Row[]) => Array.from({ length: Math.max(1, Math.ceil(rows.length / 7)) }, (_, i) => rows.slice(i * 7, i * 7 + 7));

function Readout({ root, shown, placements, targetPx, deskWidthMm }: { root: HTMLElement | null; shown: readonly string[]; placements: ObjectPlacements; targetPx: number; deskWidthMm: number }) {
  const [reading, setReading] = useState<Reading | null>(null);
  useEffect(() => {
    if (!root) return;
    const read = () => setReading(measure(root, shown, placements, deskWidthMm));
    read();
    const timer = window.setInterval(read, 250);
    window.addEventListener('resize', read);
    return () => { window.clearInterval(timer); window.removeEventListener('resize', read); };
  }, [root, shown, placements, deskWidthMm]);
  if (!reading) return null;
  const verdict = reading.paperPx === null ? null : reading.paperPx >= targetPx ? 'meets' : 'short of';
  return <aside className="sizing-bench__readout" aria-label="Sizing readout">
    <div className="sizing-bench__summary">
      <span>Viewport <output aria-label="Viewport">{reading.viewport}</output></span>
      <span>Desk front <output aria-label="Desk width on screen">{reading.deskPx.toFixed(0)} px</output></span>
      <span>Scale <output aria-label="Pixels per millimetre">{reading.pxPerMm.toFixed(3)} px/mm</output></span>
      {reading.paperPx !== null && <span className={`sizing-bench__paper sizing-bench__paper--${verdict}`}>Front sheet <output aria-label="Front sheet width on screen">{reading.paperPx.toFixed(0)} px</output> {verdict} target <output aria-label="Paper target">{targetPx} px</output></span>}
    </div>
    <div className="sizing-bench__tables">{columns(reading.rows).map((rows, index) =>
      <table key={index} className="sizing-bench__table">
        <thead><tr><th scope="col">Thing</th><th scope="col">Real</th><th scope="col">Scale</th><th scope="col">On screen</th></tr></thead>
        <tbody>{rows.map(row =>
          <tr key={row.id} data-object={row.id} className={row.scale === 1 ? '' : 'sizing-bench__row--scaled'}>
            <th scope="row">{row.name}</th>
            <td>{row.widthMm.toFixed(0)} mm</td>
            <td>{row.scale.toFixed(2)}×</td>
            <td>{row.screenPx === null ? '—' : `${row.screenPx.toFixed(0)} px`}</td>
          </tr>)}</tbody>
      </table>)}</div>
  </aside>;
}

/** Which things the stage puts on the desk. */
export function shownAt(stage: SizingStage, focus: string): readonly string[] {
  if (stage === 'papers') return PAPER_IDS;
  if (stage === 'one') return OBJECT_IDS.includes(focus) ? [focus] : [];
  return OBJECT_IDS;
}

/** The one thing under study lies just above the ruler, whatever the composition had done with it. */
function besideRuler(placements: ObjectPlacements, focus: string): ObjectPlacements {
  const object = DESK_OBJECTS.find(object => object.id === focus);
  if (!object) return placements;
  const place = placements[focus] ?? DEFAULT_OBJECT_PLACEMENTS[focus];
  const scale = place?.scale ?? 1;
  return { ...placements, [focus]: { ...place, rotation: 0, x: RULER_PLACE.x, y: RULER_PLACE.y - object.width * object.ratio * scale - mmToUnits(20) } };
}

export function SizingBench({ stage = 'papers', focus = 'mug', ruler = 'twelveInch', paperTargetPx = 260, readout = true, objectPlacements = LIFE_SIZE, children, ...desk }: SizingBenchProps) {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const shown = shownAt(stage, focus);
  const placements = stage === 'one' ? besideRuler(objectPlacements, focus) : objectPlacements;
  return <div className="sizing-bench" ref={setRoot} data-stage={stage}>
    <PerspectiveDesk {...desk} showSettings={false} only={shown} objectPlacements={placements}>
      {ruler !== 'none' && <Ruler variant={ruler} />}
      {children as ReactNode}
    </PerspectiveDesk>
    {readout && <Readout root={root} shown={shown} placements={placements} targetPx={paperTargetPx} deskWidthMm={desk.deskWidthMm ?? DESK_MM.width} />}
  </div>;
}
