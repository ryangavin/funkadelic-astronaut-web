import { DossierCover } from './DossierCover';
import { BandDossier } from '../../sections/BandDossier/BandDossier';
import type { ReactNode } from 'react';
import { Movable, type Place } from '../../behaviors/Movable/Movable';
import { Solid, type Foot } from '../../behaviors/Perspective/Perspective';
import { Relief, StudyLighting, ROUND_CASE, type StudyCamera, type StudyShape } from '../../behaviors/Perspective/DeskObjectStudy';
import { CradleRelief } from '../../behaviors/Perspective/CradleRelief';
import { elevatedLayer } from '../../behaviors/Perspective/elevation';
import { DeskClock } from '../../components/3D/DeskClock/DeskClock';
import { DeskPhone, DESK_PHONE_HEIGHT, DESK_PHONE_FOOT } from '../../components/3D/DeskPhone/DeskPhone';
import { Handheld } from '../../components/3D/Handheld/Handheld';
import { HANDHELD_SILHOUETTE } from '../../components/3D/Handheld/silhouette';
import { LabelBro, LABEL_BRO_HEIGHT, LABEL_BRO_FOOT } from '../../components/3D/LabelBro/LabelBro';
import { Mug } from '../../components/3D/Mug/Mug';
import { Pen } from '../../components/3D/Pen/Pen';
import { Rolodex } from '../../components/3D/Rolodex/Rolodex';
import { Walkman } from '../../components/3D/Walkman/Walkman';

type ObjectSpec = { flat?: boolean; id: string; name: string; width: number; ratio: number; height: number; place: Place; content?: ReactNode; solid?: { height: number; foot: Foot; localCoordinates?: boolean }; shapes?: StudyShape[]; colors?: readonly [string, string, string] };
const OBJECT_DRAWINGS: ObjectSpec[] = [
  { id: 'dossier', name: 'Band dossier', width: 1200, ratio: 960/1440, height: 1, flat: true, place: { x: 370, y: 330, rotation: -2 }, content: <BandDossier className="dossier--branded" sticker={<DossierCover />} open={false} rotation={0} tape={null} /> },
  { id: 'clock', name: 'Desk clock', width: 180, ratio: 560/720, height: 15, place: { x: 60, y: 65, rotation: -4 }, content: <DeskClock /> },
  { id: 'cradle', name: 'Newton’s cradle', width: 240, ratio: 600/720, height: 90, place: { x: 330, y: 65}, shapes: [{ path: 'M3 5H97V95H3Z', heightMm: 8 }, { path: 'M8 20H92V23H8Z M8 77H92V80H8Z', heightMm: 90 }] },
  { id: 'mug', name: 'Mug', width: 280, ratio: 1, height: 95, place: { x: 1010, y: 570, rotation: -15 }, solid: { height: 95/140, foot: { x: 104/240, y: 120/240 } }, content: <Mug rotation={0} shadow="contact" /> },
  { id: 'rolodex', name: 'Rolodex', width: 274.1, ratio: 624/518, height: 107.95, place: { x: 1170, y: 330, rotation: 4 }, solid: { localCoordinates: true, height: 408/518, foot: { x: .5, y: 312/518 } }, content: <Rolodex rotation={0} loose={false} /> },
  { id: 'handheld', name: 'Handheld', width: 408, ratio: 327/720, height: 23, place: { x: 30, y: 250, rotation: -5 }, content: <Handheld rotation={0} />, shapes: [{ path: HANDHELD_SILHOUETTE }], colors: ['#17181b', '#141519', '#090a0d'] },
  { id: 'labelBro', name: 'Label Bro', width: 366, ratio: 772/732, height: 65, place: { x: 755, y: 515, rotation: -5 }, solid: { localCoordinates: true, height: LABEL_BRO_HEIGHT, foot: LABEL_BRO_FOOT }, content: <LabelBro rotation={0} defaultOn defaultText="BACKLINE" /> },
  { id: 'pen', name: 'Pen', width: 298, ratio: 60/720, height: 3.5, place: { x: 450, y: 330, rotation: 8 }, shapes: [{ path: 'M.3 28H3.3V18H17.2V28H19.7V33H96.4L99.9 50L96.4 67H19.7V72H.3Z' }] },
  { id: 'walkman', name: 'Walkman', width: 224, ratio: 590/720, height: 30, place: { x: 770, y: 260, rotation: -6 }, content: <Walkman rotation={0} /> },
  { id: 'phone', name: 'Desk phone', width: 560, ratio: 300/560, height: 68.5, place: { x: 45, y: 415}, solid: { height: DESK_PHONE_HEIGHT, foot: DESK_PHONE_FOOT }, content: <DeskPhone rotation={0} sound={false} />, shapes: [{ path: 'M20 12H46Q52 12 52 25V80Q52 88 46 88H20Q13 88 13 80V25Q13 12 20 12Z', heightMm: 68.5 }, { path: 'M57 15H96V79H57Z', heightMm: 32.5 }] },
];
// A wider desktop: retain relative physical sizes while fitting the 16:9 composition.
const OBJECT_SCALE = 0.6;
export const DESK_OBJECTS = OBJECT_DRAWINGS.map(object => ({ ...object, width: object.width * OBJECT_SCALE, height: object.height * OBJECT_SCALE, shapes: object.shapes?.map(shape => ({ ...shape, heightMm: shape.heightMm === undefined ? undefined : shape.heightMm * OBJECT_SCALE })) }));
export const DEFAULT_OBJECT_PLACEMENTS = Object.fromEntries(DESK_OBJECTS.map(object => [object.id, { rotation: 0, ...object.place }]));
export type ObjectPlacements = Record<string, Place>;

function PenRelief({ place, camera }: { place: Place; camera: StudyCamera }) {
  const top = elevatedLayer(7 * OBJECT_SCALE, { ...place, width: 298 * OBJECT_SCALE, drawingWidth: 720, drawingHeight: 60 }, camera);
  return <div style={{ position: 'relative', aspectRatio: '720 / 60' }}>
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', filter: 'brightness(.65)' }}><Pen rotation={0} /></div>
    <div style={{ position: 'relative', transform: `translate(${top.x / 720 * 100}%, ${top.y / 60 * 100}%) scale(${top.scale})` }}><Pen rotation={0} /></div>
  </div>;
}

export function DeskObjectShadows({ placements, height }: { placements: ObjectPlacements; height: number }) {
  return <>{DESK_OBJECTS.filter(object => !object.flat).map(object => <StudyLighting key={object.id} shadowOnly surfaceHeight={height} place={placements[object.id] ?? object.place} width={object.width} depth={object.width * object.ratio} heightMm={object.height} mug={object.id === 'mug'} shapes={object.shapes ?? [{ path: ROUND_CASE }]} />)}</>;
}

export function DeskObjects({ placements, camera, onMove }: { placements: ObjectPlacements; camera: StudyCamera; onMove: (id: string, place: Place) => void }) {
  return <>{DESK_OBJECTS.map(object => {
    const place = placements[object.id] ?? object.place;
    return <Movable key={object.id} {...place} width={object.width} label={object.name} grab={object.flat ? 'body' : 'anywhere'} onMove={next => onMove(object.id, { ...place, ...next })}>
      {object.flat ? object.content : object.id === 'pen' ? <PenRelief place={place} camera={camera} /> : object.id === 'cradle' ? <CradleRelief place={place} camera={camera} width={object.width} /> : object.solid ? <Solid {...object.solid}>{object.content}</Solid> : <Relief place={place} camera={camera} width={object.width} depth={object.width * object.ratio} heightMm={object.height} path={object.shapes?.[0].path ?? ROUND_CASE} sideColors={object.colors}>{object.content}</Relief>}
    </Movable>;
  })}</>;
}
