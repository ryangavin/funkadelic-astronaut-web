import { memo, useEffect, useRef, useState } from 'react';
import { Movable, type Place } from '../../behaviors/Movable/Movable';
import { usePlaces } from '../../behaviors/Movable/places';
import { Spill, Spilled } from '../../behaviors/Spill/Spill';
import { useRoomArrangement, type RoomArrangement } from '../../foundations/Room/useRoomArrangement';
import { BandDossier, BAND_MEMBER_PACKETS, BAND_ONE_SHEET, BAND_PACKET, LIVE_SET } from '../../sections/BandDossier/BandDossier';
import { Packet } from '../../components/2D/Packet/Packet';
import { OneSheet } from '../../components/2D/OneSheet/OneSheet';
import { Polaroid } from '../../components/2D/Polaroid/Polaroid';
import { AdmissionTicket, TOUR_ADMISSION_TICKET_PROPS } from '../../components/2D/AdmissionTicket/AdmissionTicket';
import { TourPass } from '../../components/2D/TourPass/TourPass';
import { NYACK_FESTIVAL_TOUR_PASS_PROPS } from '../../components/2D/TourPass/TourPass.data';
import { Handbill } from '../../experiments/BandIntro/Handbill';
import { BAND_HANDBILL_FRONT, BAND_HANDBILL_BACK } from '../../experiments/BandIntro/Handbill.band';
import { MiniZine } from '../../experiments/BandIntro/MiniZine';
import { BAND_ZINE_PAGES } from '../../experiments/BandIntro/MiniZine.band';
import { DossierCover } from './DossierCover';
import { DESK_LAYOUT, SIZES } from './PromoterDesk';
import './DeskDossier.css';

// Reuse the promoter's filing order and physical sizes, converted from its
// half-millimetre units to the Room's 1.2 units/mm. Only this scene owns targets.
const physical = 0.6;
export const DOSSIER_SPILL_TARGETS: RoomArrangement = Object.fromEntries(
  Object.entries(DESK_LAYOUT.spilled).map(([id, place]) => [`dossier-${id}`, {
    ...place, x: id === 'pass' ? 880 : 110 + place.x * physical, y: id === 'pass' ? 650 : 190 + place.y * physical,
  }]),
);
export const DOSSIER_OPEN_TARGETS: RoomArrangement = {
  lamp: { x: 980, y: 40, rotation: 0 },
  dossier: { x: 350, y: 250, rotation: -1, scale: 1 },
  sitePlan: { x: 45, y: 165, rotation: -8 },
  poster: { x: 70, y: 420, rotation: -5 },
  setTimes: { x: 1090, y: 300, rotation: 4 },
  contract: { x: 1100, y: 510, rotation: -3 },
  pen: { x: 450, y: 190, rotation: 3 },
  walkman: { x: 1030, y: 140, rotation: -8 },
  phone: { x: 30, y: 590, rotation: 0 },
  labelBro: { x: 980, y: 720, rotation: -5 },
  mug: { x: 1190, y: 755, rotation: -15 },
  rolodex: { x: 1190, y: 85, rotation: 4 },
  handheld: { x: 25, y: 580, rotation: -5 },
};

/** Centre of the closed right-hand leaf, including its current turn and scale. */
export function dossierOrigin(place: Place, width: number) {
  const wide = width * (place.scale ?? 1);
  const angle = (place.rotation ?? 0) * Math.PI / 180;
  return { x: place.x + wide / 2 + wide / 4 * Math.cos(angle), y: place.y + wide * (915 / 1440) / 2 + wide / 4 * Math.sin(angle) };
}

const Contents = memo(function Contents() {
  const item = (id: string, label: string, width: number, order: number) => ({
    id: `dossier-${id}`, ...DOSSIER_SPILL_TARGETS[`dossier-${id}`],
    label, width: width * physical, order, z: 30 + order, grab: 'anywhere' as const,
  });
  return <>
    <Spilled {...item('live', 'Live set print', SIZES.print, 0)}><Polaroid video={LIVE_SET.video} plain format="wide" alt={LIVE_SET.alt} caption={LIVE_SET.caption ?? 'Live set'} note={LIVE_SET.note} /></Spilled>
    <Spilled {...item('print', 'Band photo', SIZES.print, 1)}><Polaroid {...BAND_PACKET.photo} /></Spilled>
    {BAND_MEMBER_PACKETS.map(({ name, ...packet }, index) => <Spilled key={name} {...item(['ryan', 'kevin', 'sam'][index], `${name} packet`, SIZES.packet, index + 2)}><Packet {...packet} rotation={0} /></Spilled>)}
    <Spilled {...item('oneSheet', 'Band one-sheet', SIZES.sheet, 5)}><OneSheet {...BAND_ONE_SHEET} /></Spilled>
    <Spilled {...item('handbill', 'Press handbill', SIZES.handbill, 6)}><Handbill front={BAND_HANDBILL_FRONT} back={BAND_HANDBILL_BACK} stock="goldenrod" spot="purple" /></Spilled>
    <Spilled {...item('zine', 'Band zine', SIZES.zine, 7)}><MiniZine pages={BAND_ZINE_PAGES} stock="canary" /></Spilled>
    <Spilled {...item('ticket', 'Tour ticket', SIZES.ticket, 8)}><AdmissionTicket {...TOUR_ADMISSION_TICKET_PROPS} /></Spilled>
    <Spilled {...item('pass', 'Festival pass', SIZES.pass, 9)}><TourPass {...NYACK_FESTIVAL_TOUR_PASS_PROPS} rotation={0} /></Spilled>
  </>;
});

/** The containing desk translates dossier events into named room arrangements. */
export function DeskDossier({ width, place, layer, onFront }: { width: number; place: Place; layer: number; onFront: (id: string) => void }) {
  const places = usePlaces();
  const arrange = useRoomArrangement();
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(() => dossierOrigin(place, width));
  const closed = useRef<RoomArrangement | undefined>(undefined);
  useEffect(() => {
    if (open) return;
    const timer = window.setTimeout(() => { closed.current = undefined; }, 750);
    return () => window.clearTimeout(timer);
  }, [open]);
  const opening = () => {
    const current = places?.get('dossier') ?? place;
    // An interrupted close keeps the original closed arrangement, not the
    // intermediate animation frame. A fresh open remembers the visitor's desk.
    if (!closed.current) closed.current = Object.fromEntries(Object.keys(DOSSIER_OPEN_TARGETS).flatMap(id => {
      const at = places?.get(id);
      return at ? [[id, { ...at }]] : [];
    }));
    setFrom(dossierOrigin(current, width));
    for (const [id, target] of Object.entries(DOSSIER_SPILL_TARGETS)) places?.set(id, target);
    const targets = Object.fromEntries(Object.entries(DOSSIER_OPEN_TARGETS).filter(([id]) => places?.get(id)));
    arrange(targets);
    setOpen(true);
  };
  const closing = () => {
    // Return to the remembered closed folder even if the open folder was moved.
    setFrom(dossierOrigin(closed.current?.dossier ?? places?.get('dossier') ?? place, width));
    arrange(closed.current ?? {});
    setOpen(false);
  };
  return <>
    <Movable id="dossier" {...place} width={width} resizable label="Band dossier" z={layer} onGrab={() => onFront('dossier')} grab="anywhere">
      <BandDossier className="dossier--branded" sticker={<DossierCover />} open={open} onOpen={opening} onClose={closing} showContents={false} rotation={0} tape={null} />
    </Movable>
    <Spill className="desk-dossier__spill" open={open} lazy lastOrder={9} from={from} delay={420}><Contents /></Spill>
  </>;
}
