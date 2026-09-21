import { DOSSIER_ITEMS } from '../../pages/Desk/DeskDossier';
import { DESK_OBJECTS, type ObjectPlacements } from '../../pages/Desk/DeskObjects';
import { StickyNote } from '../../components/2D/StickyNote/StickyNote';
import { PaperSheet } from '../../components/2D/PaperSheet/PaperSheet';
import { TourPass } from '../../components/2D/TourPass/TourPass';
import { NYACK_FESTIVAL_TOUR_PASS_PROPS } from '../../components/2D/TourPass/TourPass.data';
import { mmToUnits, unitsToMm } from '../../geometry/physicalScale';

export const MVP_INITIAL_IDS = ['dossier', 'walkman', 'handheld', 'sitePlan', 'contract', 'pen', 'labelBro', 'mug', 'cradle', 'lamp'];
const selectedContents = ['print', 'ryan', 'kevin', 'sam', 'oneSheet', 'handbill', 'zine'];
export const BENCH_EXTRAS = [
  ...DOSSIER_ITEMS.filter(item => selectedContents.includes(item.id)).map(item => ({
    id: `calibration-${item.id}`, name: item.label, width: item.width, widthMm: unitsToMm(item.width), content: item.content,
  })),
  ...['Next show', 'Following show', 'Later show'].map((name, index) => ({
    id: `calibration-tour-${index + 1}`, name: `${name} sample pass`, width: mmToUnits(100), widthMm: 100,
    content: <TourPass {...NYACK_FESTIVAL_TOUR_PASS_PROPS} venue={`${name} · layout sample`} location="Sample content — not a confirmed event" actionHref={undefined} actionLabel="Layout sample" actionAriaLabel="Sample ticket unavailable" rotation={0} />,
  })),
  { id: 'calibration-note', name: 'Invitation note', width: mmToUnits(76), widthMm: 76, content: <StickyNote rotation={0}><p>Listen to this!</p></StickyNote> },
  { id: 'calibration-paper', name: 'Reference paper', width: mmToUnits(220), widthMm: 220, content: <PaperSheet stock="white" surround={0} height={1440 * 280 / 220}><p style={{ margin: 0, padding: '8%', fontSize: 'calc(110 * var(--sheet-unit))' }}>220 × 280 mm<br />REFERENCE PAPER</p></PaperSheet> },
];
export const MVP_CONTENT_IDS = BENCH_EXTRAS.filter(item => selectedContents.some(id => item.id === `calibration-${id}`)).map(item => item.id);
export const MVP_PASS_IDS = BENCH_EXTRAS.filter(item => item.id.startsWith('calibration-tour')).map(item => item.id);
export const BENCH_OBJECTS = [...DESK_OBJECTS, ...BENCH_EXTRAS, { id: 'lamp', name: 'Desk lamp', width: mmToUnits(480), widthMm: 480, ratio: 400 / 480 }];

// Spaced study positions, not the proposed final composition. All sizes remain 1×.
export const MVP_INITIAL_PLACEMENTS: ObjectPlacements = {
  dossier: { x: -210, y: 440, rotation: 0, scale: 1 },
  sitePlan: { x: 610, y: 125, rotation: 0, scale: 1 },
  contract: { x: 930, y: 125, rotation: 0, scale: 1 },
  handheld: { x: 710, y: 550, rotation: 0, scale: 1 },
  walkman: { x: 455, y: 540, rotation: 0, scale: 1 },
  labelBro: { x: 1000, y: 500, rotation: 0, scale: 1 },
  pen: { x: 710, y: 700, rotation: 0, scale: 1 },
  mug: { x: 1350, y: 500, rotation: 0, scale: 1 },
  cradle: { x: 1560, y: 530, rotation: 0, scale: 1 },
  'calibration-tour-1': { x: 1280, y: 130, rotation: 0, scale: 1 },
  'calibration-tour-2': { x: 1470, y: 130, rotation: 0, scale: 1 },
  'calibration-tour-3': { x: 1660, y: 130, rotation: 0, scale: 1 },
  'calibration-note': { x: 460, y: 740, rotation: 0, scale: 1 },
  'calibration-paper': { x: 1850, y: 510, rotation: 0, scale: 1 },
};
export const MVP_CONTENT_PLACEMENTS: ObjectPlacements = Object.fromEntries([
  ...MVP_CONTENT_IDS.map((id, index) => [id, { x: index < 4 ? 610 + index * 330 : 130 + (index - 4) * 340, y: index < 4 ? 140 : 530, rotation: 0, scale: 1 }]),
  ['calibration-paper', { x: 1510, y: 530, rotation: 0, scale: 1 }],
]);
