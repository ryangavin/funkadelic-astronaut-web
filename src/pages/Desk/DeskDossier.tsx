import { memo, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Movable, type Place } from '../../behaviors/Movable/Movable';
import { usePlaces, usePlaceEffect } from '../../behaviors/Movable/places';
import { Spill, Spilled, SPILL_FLIGHT_MS, SPILL_STAGGER_MS } from '../../behaviors/Spill/Spill';
import { useRoomArrangement, type RoomArrangement } from '../../foundations/Room/useRoomArrangement';
import { BandDossier, BAND_MEMBER_PACKETS, BAND_ONE_SHEET, BAND_PACKET, LIVE_SET } from '../../sections/BandDossier/BandDossier';
import { FOLDER_CLOSE_MS } from '../../components/2D/Folder/Folder';
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

export const DOSSIER_RETURN_MS = SPILL_FLIGHT_MS * .8 + 9 * SPILL_STAGGER_MS;
type Phase = 'closed' | 'preparing' | 'opening' | 'spilling' | 'open' | 'returning' | 'closing';

/** One content tree stays in the folder's stacking context, but its positions
 * remain in desk units. Counter-rotate about the folder centre, then offset
 * the desk origin. Updating this host never remounts the papers or their media. */
function DeskContents({ width, place, phase }: { width: number; place: Place; phase: Phase }) {
  const host = useRef<HTMLDivElement>(null);
  const fit = () => {
    const folder = host.current?.closest<HTMLElement>('.folder');
    if (!folder) return;
    for (const paper of host.current!.querySelectorAll<HTMLElement>('.spilled')) {
      // Contents may have been resized, unfolded, or opened while on the desk.
      // Fit the actual drawing in the well without resetting its internal state.
      const scale = Math.min(.7 * ((places?.get('dossier') ?? place).scale ?? 1),
        folder.offsetWidth * .4 / Math.max(1, paper.offsetWidth),
        folder.offsetHeight * .8 / Math.max(1, paper.offsetHeight));
      paper.style.setProperty('--spill-packed-scale', `${scale}`);
    }
  };
  const places = usePlaces();
  useLayoutEffect(() => {
    const observer = new ResizeObserver(fit);
    const folder = host.current?.closest('.folder');
    if (folder) observer.observe(folder);
    host.current?.querySelectorAll('.spilled').forEach(paper => observer.observe(paper));
    fit();
    return () => observer.disconnect();
  });
  usePlaceEffect('dossier', value => {
    const at = value ?? place;
    const w = width * (at.scale ?? 1);
    const h = w * 915 / 1440;
    const origin = dossierOrigin(at, width);
    const style = host.current?.style;
    style?.setProperty('--spill-unit', `calc(100cqw / ${w})`);
    style?.setProperty('--desk-centre-x', `${at.x + w / 2}`);
    style?.setProperty('--desk-centre-y', `${at.y + h / 2}`);
    style?.setProperty('--desk-turn', `${at.rotation ?? 0}deg`);
    style?.setProperty('--packed-x', `${origin.x}`);
    style?.setProperty('--packed-y', `${origin.y}`);
    style?.setProperty('--packed-scale', `${.7 * (at.scale ?? 1)}`);
    fit();
  });
  return <div ref={host} className="desk-dossier__contents" data-phase={phase} onPointerDown={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>
    <Spill className="desk-dossier__spill" open={phase === 'spilling' || phase === 'open'} hidePacked={false} scatter={0}
      from={{ x: 0, y: 0 }} unit="inherit" style={{
        '--spill-unit': 'inherit', '--spill-from-x': 'var(--packed-x)', '--spill-from-y': 'var(--packed-y)',
        '--spill-packed-scale': 'var(--packed-scale)',
      } as CSSProperties}><Contents /></Spill>
  </div>;
}

/** The desk owns the sequence; the dossier merely requests open and close. */
export function DeskDossier({ width, place, layer, onFront }: { width: number; place: Place; layer: number; onFront: (id: string) => void }) {
  const places = usePlaces();
  const arrange = useRoomArrangement();
  const [phase, setPhase] = useState<Phase>('closed');
  const [requestedOpen, setRequestedOpen] = useState(false);
  const closed = useRef<RoomArrangement | undefined>(undefined);
  const coverOpen = phase === 'opening' || phase === 'spilling' || phase === 'open' || phase === 'returning';
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer = 0;
    let frame = 0;
    const next = (value: Phase, delay: number) => { timer = window.setTimeout(() => setPhase(value), motion.matches ? 0 : delay); };
    if (phase === 'preparing') {
      // Paint all mounted papers under the closed cover before moving it.
      frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => setPhase('opening')); });
    } else if (phase === 'opening') next('spilling', FOLDER_CLOSE_MS);
    else if (phase === 'spilling') next('open', SPILL_FLIGHT_MS + 9 * SPILL_STAGGER_MS);
    else if (phase === 'returning') next('closing', DOSSIER_RETURN_MS);
    else if (phase === 'closing') {
      arrange(closed.current ?? {});
      next('closed', FOLDER_CLOSE_MS);
    }
    else if (phase === 'closed') closed.current = undefined;
    const reduce = () => {
      if (!motion.matches) return;
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
      // The returning phase deliberately leaves the folder in its open place.
      // Finish that deferred restoration before discarding the saved layout.
      if (!requestedOpen) arrange(closed.current ?? {}, 0);
      setPhase(requestedOpen ? 'open' : 'closed');
    };
    motion.addEventListener('change', reduce);
    return () => { window.clearTimeout(timer); cancelAnimationFrame(frame); motion.removeEventListener('change', reduce); };
  }, [phase, requestedOpen, arrange]);
  const opening = () => {
    if (!closed.current) closed.current = Object.fromEntries(Object.keys(DOSSIER_OPEN_TARGETS).flatMap(id => {
      const at = places?.get(id);
      return at ? [[id, { ...at }]] : [];
    }));
    // Keep existing interactive children on interrupted returns.
    if (phase === 'closed') for (const [id, target] of Object.entries(DOSSIER_SPILL_TARGETS)) places?.set(id, target);
    arrange(Object.fromEntries(Object.entries(DOSSIER_OPEN_TARGETS).filter(([id]) => places?.get(id))));
    setRequestedOpen(true);
    setPhase(phase === 'closed' ? 'preparing' : phase === 'returning' ? 'spilling' : 'opening');
  };
  const closing = () => {
    arrange(Object.fromEntries(Object.entries(closed.current ?? {}).filter(([id]) => id !== 'dossier')));
    setRequestedOpen(false);
    setPhase(phase === 'preparing' || phase === 'opening' ? 'closing' : 'returning');
  };
  return <Movable id="dossier" {...place} width={width} resizable label="Band dossier" z={layer} onGrab={() => onFront('dossier')} grab="anywhere" data-dossier-phase={phase}>
    <BandDossier className="dossier--branded" sticker={<DossierCover />} open={coverOpen} requestedOpen={requestedOpen}
      onOpen={opening} onClose={closing} showContents={false} rotation={0} tape={null}
      contentsLayer={phase !== 'closed' && <DeskContents width={width} place={place} phase={phase} />} />
  </Movable>;
}
