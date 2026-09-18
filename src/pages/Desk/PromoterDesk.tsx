import { RunSheet, SitePlan } from './DeskPapers';
import type React from 'react';
import { useRef, useState } from 'react';
import { MovableScale, Movable, type Place } from '../../behaviors/Movable/Movable';
import { Spill, Spilled } from '../../behaviors/Spill/Spill';
import { Weathered } from '../../behaviors/Weathered/Weathered';
import { AdmissionTicket, TOUR_ADMISSION_TICKET_PROPS } from '../../components/2D/AdmissionTicket/AdmissionTicket';
import { DESK_WIDTH, Desk, type DeskWood } from '../../components/3D/Desk/Desk';
import { DeskClock } from '../../components/3D/DeskClock/DeskClock';
import { DeskLamp, LampLight } from '../../components/3D/DeskLamp/DeskLamp';
import { Folder } from '../../components/2D/Folder/Folder';
import { GuitarPick } from '../../components/2D/GuitarPick/GuitarPick';
import { Handheld } from '../../components/3D/Handheld/Handheld';
import { CoffeeRing } from '../../components/3D/Mug/CoffeeRing';
import { Mug } from '../../components/3D/Mug/Mug';
import { CoffeeRings, Stained } from '../../components/3D/Mug/Stained';
import { DESK, useCoffeeTrail } from '../../components/3D/Mug/trail';
import { NewtonsCradle } from '../../components/3D/NewtonsCradle/NewtonsCradle';
import { OneSheet } from '../../components/2D/OneSheet/OneSheet';
import { Packet } from '../../components/2D/Packet/Packet';
import { Pen } from '../../components/3D/Pen/Pen';
import { Pin } from '../../components/2D/Pin/Pin';
import { Polaroid } from '../../components/2D/Polaroid/Polaroid';
import { Stage, type StageProps } from '../../components/2D/Stage/Stage';
import { SocialSticker } from '../../components/2D/Sticker/SocialSticker';
import { StickyNote } from '../../components/2D/StickyNote/StickyNote';
import { TourPass } from '../../components/2D/TourPass/TourPass';
import { NYACK_FESTIVAL_TOUR_PASS_PROPS } from '../../components/2D/TourPass/TourPass.data';
import { Cassette } from '../../components/3D/Walkman/Cassette';
import { Walkman } from '../../components/3D/Walkman/Walkman';
import { Wordmark } from '../../components/2D/Wordmark/Wordmark';
import { Handbill } from '../../experiments/BandIntro/Handbill';
import { BAND_HANDBILL_BACK, BAND_HANDBILL_FRONT } from '../../experiments/BandIntro/Handbill.band';
import { MiniZine } from '../../experiments/BandIntro/MiniZine';
import { BAND_ZINE_PAGES } from '../../experiments/BandIntro/MiniZine.band';
import { BAND_MEMBER_PACKETS, BAND_ONE_SHEET, BAND_PACKET, DEMO_TAPE, LIVE_SET } from '../../sections/BandDossier/BandDossier';
import { LISTEN_LINKS, SOCIAL_LINKS } from '../Home/Home';
import '../../styles/fonts.css';
import './PromoterDesk.css';

/**
 * Everything on the desk is sized from one reference: the Walkman, 112
 * millimetres across, is 224 desk units. So one unit is half a millimetre,
 * the desk's 1440 units are 720 mm of desktop, and every other thing is its
 * real size in the same scale: a letter folder, a Sharpie, a mug, a
 * quarter-sheet handbill, a 4 x 6 card. The frame is 16 x 9, and an open
 * letter folder is 306 mm tall, so this is about as big as the Walkman can
 * be with the folder lying open inside the frame and room left around it.
 */
export const REFERENCE = { object: 'Walkman', millimetres: 112, units: 224 } as const;
export const mm = (millimetres: number) => Math.round((millimetres * REFERENCE.units) / REFERENCE.millimetres);

/** The desk's design size: 1440 by 810, a 16 x 9 frame: 720 by 405 mm of desktop. */
export const DESK_HEIGHT = 810;

/** Real widths, in millimetres, of what lies on the desk. Each component's box is measured across the thing itself. */
export const REAL_WIDTHS = {
  /** A letter-size manila folder, open: 9½ x 11¾ inches a leaf. */
  folder: 482,
  walkman: 112,
  /** A compact cassette. */
  cassette: 100,
  /** The widescreen handheld: a fifth over the PSP's 170, because a console reads small at its true size beside the paper. */
  handheld: 204,
  /** A mug's box holds the body, 82 mm across, and the handle. */
  mug: 140,
  /** The ring a mug's base leaves, with its drips. */
  ring: 83,
  /** A letter sheet. */
  sheet: 216,
  ballpoint: 149,
  marker: 140,
  pick: 25,
  /** A three-inch sticky note. */
  note: 76,
  /** A die-cut sticker. */
  sticker: 40,
  /** A quarter-sheet handbill, 4¼ x 5½. */
  handbill: 108,
  /** The zine's open spread: two 2¾-inch pages. */
  zine: 140,
  /** A hard ticket. */
  ticket: 140,
  /** A laminate pass. */
  pass: 100,
  /** A wide instant print. */
  print: 108,
  /** A 4 x 6 index card, with the print clipped to it. */
  packet: 152,
  /** The wedge LCD desk clock. */
  clock: 90,
  /** A small Newton's cradle. */
  cradle: 120,
  /** The festival site plan, printed on a letter sheet. */
  plan: 216,
  /** The desk lamp's box: base, arm and shade. */
  lamp: 480,
  /** The pool of light the lamp throws. */
  glow: 450,
} as const;

/** The same, in desk units. */
export const SIZES = Object.fromEntries(Object.entries(REAL_WIDTHS).map(([thing, width]) => [thing, mm(width)])) as Record<keyof typeof REAL_WIDTHS, number>;

/** A letter sheet stands 11 units tall for every 8.5 across, which is what the running order and the site plan are printed on. */
const LETTER_RATIO = 11 / 8.5;
/** The folder's proportions, from the Folder component: two leaves of 720 in 1440, 915 tall. */
const FOLDER_RATIO = 915 / 1440;
/** The tab on the folder's edge, from the Folder component: 9% down the leaf, 52% of its height, 58 units wide, set 44 out past the edge. */
const TAB = { top: 9, height: 52, width: 58, out: 44 };

export type DeskThingId = 'walkman' | 'cassette' | 'handheld' | 'mug' | 'sheet' | 'plan' | 'ballpoint' | 'marker' | 'pick' | 'clock' | 'cradle';
export type SpilledThingId = 'live' | 'print' | 'ryan' | 'kevin' | 'sam' | 'oneSheet' | 'handbill' | 'zine' | 'ticket' | 'pass';
export type ThingId = DeskThingId | SpilledThingId;

/**
 * Where everything lies, in desk units from the top left. The folder is
 * pinned; the promoter's own things have a place while the folder is closed,
 * on and around it, and another they are shoved to when it opens; the things
 * inside the folder have only where they land. Anything the visitor has
 * moved stays where they put it.
 */
export const DESK_LAYOUT = {
  folder: { x: 410, y: 40, rotation: -1 },
  things: {
    walkman: { closed: { x: 910, y: 380, rotation: -6 }, open: { x: 30, y: 250, rotation: -8 } },
    cassette: { closed: { x: 60, y: 330, rotation: 10 }, open: { x: 240, y: 300, rotation: 12 } },
    handheld: { closed: { x: 240, y: 560, rotation: 3 }, open: { x: 30, y: 462, rotation: 2 } },
    mug: { closed: { x: 200, y: 10, rotation: 210 }, open: { x: 200, y: 10, rotation: 210 } },
    sheet: { closed: { x: 560, y: 120, rotation: -4 }, open: { x: 0, y: 200, rotation: -3 } },
    plan: { closed: { x: 520, y: 10, rotation: -6 }, open: { x: 520, y: 10, rotation: -6 } },
    ballpoint: { closed: { x: 600, y: 250, rotation: -14 }, open: { x: 930, y: 24, rotation: 3 } },
    marker: { closed: { x: 30, y: 260, rotation: -12 }, open: { x: 20, y: 440, rotation: -6 } },
    pick: { closed: { x: 760, y: 460, rotation: 40 }, open: { x: 860, y: 700, rotation: 40 } },
    clock: { closed: { x: 40, y: 640, rotation: -3 }, open: { x: 40, y: 650, rotation: -3 } },
    cradle: { closed: { x: 0, y: 20, rotation: 0 }, open: { x: 0, y: 20, rotation: 0 } },
  } satisfies Record<DeskThingId, { closed: Place; open: Place }>,
  /* What was inside lands over both leaves: the prints, the one-sheet, the handbill and the
     ticket on the cover, the members' cards, the pass and the zine in the well. */
  spilled: {
    live: { x: 450, y: 80, rotation: -3 },
    print: { x: 630, y: 300, rotation: 6 },
    oneSheet: { x: 440, y: 440, rotation: -2 },
    ticket: { x: 430, y: 560, rotation: 3 },
    ryan: { x: 920, y: 70, rotation: -4 },
    kevin: { x: 990, y: 240, rotation: 5 },
    sam: { x: 1060, y: 410, rotation: -6 },
    pass: { x: 1190, y: 90, rotation: 8 },
    handbill: { x: 690, y: 40, rotation: -9 },
    zine: { x: 910, y: 470, rotation: 4 },
  } satisfies Record<SpilledThingId, Place>,
  /** The lamp is clamped to the back edge of the desk: only the shade comes into the frame, and its light falls across the middle. */
  lamp: { x: 470, y: -620, rotation: 0 },
  glow: { x: 290, y: -60, rotation: 0 },
  /** The ring stays where the mug was set down last night; the stickers are stuck to the wood along the front edge. */
  ring: { x: 110, y: 230, rotation: 20 },
  socials: [
    { x: 1100, y: 690, rotation: -8 },
    { x: 1190, y: 684, rotation: 6 },
    { x: 1280, y: 690, rotation: -3 },
  ],
};

/** A layer on the desk: a thing, or the folder itself, which lies over the running order and under everything else. */
export type LayerId = ThingId | 'folder';

/** What lies on top of what, to begin with: first is underneath. Picking a thing up brings it to the top. */
const STACKING: LayerId[] = ['plan', 'sheet', 'folder', 'ballpoint', 'marker', 'pick', 'cassette', 'clock', 'cradle', 'mug', 'handheld', 'walkman', 'live', 'print', 'oneSheet', 'ticket', 'ryan', 'kevin', 'sam', 'pass', 'handbill', 'zine'];
const SPILL_ORDER: SpilledThingId[] = ['live', 'print', 'oneSheet', 'ticket', 'ryan', 'kevin', 'sam', 'pass', 'handbill', 'zine'];

const LABELS: Record<ThingId, string> = {
  walkman: 'Walkman',
  cassette: 'Spare cassette',
  handheld: 'Handheld',
  mug: 'Mug',
  sheet: 'Running order',
  plan: 'Festival site plan',
  clock: 'Desk clock',
  cradle: 'Newton’s cradle',
  ballpoint: 'Ballpoint',
  marker: 'Marker',
  pick: 'Guitar pick',
  live: 'Live set print',
  print: 'Contact print',
  ryan: 'Ryan Gavin’s card',
  kevin: 'Kevin O’Neill’s card',
  sam: 'Sam Luba’s card',
  oneSheet: 'Press one-sheet',
  handbill: 'Handbill',
  zine: 'Mini zine',
  ticket: 'Tour ticket',
  pass: 'Festival pass',
};

export type PromoterDeskProps = Pick<StageProps, 'minScale' | 'maxScale'> & {
  /** Whether the press package starts open. Clicking it opens and closes it. */
  open?: boolean;
  /** Called when the visitor opens or closes the package. */
  onToggle?: (open: boolean) => void;
  /** Called whenever the visitor puts something down, with where everything lies. */
  onArrange?: (placement: Record<ThingId, Place>) => void;
  /** Whether the desk lamp starts on. Clicking its shade switches it, and the room dims without it. */
  lamp?: boolean;
  onLamp?: (on: boolean) => void;
  wood?: DeskWood;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * The desk of someone at the Mission Control label who is producing the
 * festival, the way a visitor first sees the site: a 16 x 9 frame on 720
 * by 405 mm of wooden desktop, the band's press package lying closed on
 * it, their
 * name across the cover, and the promoter's own things on and around it: a
 * Walkman with the demo in it, a games console with the live set on the
 * disc, the running order for the day half under the folder, coffee, pens.
 * Click the package and it swings open, the things on it are shoved aside,
 * and what was inside spills out across the desk: the members' cards, the
 * one-sheet, two prints, the handbill, the zine, the tour ticket and the
 * festival pass, each the real thing to pick up. Everything can be dragged
 * about, and the thing picked up comes to the top. Click the tab to put it
 * all back. Everything is its real size against the Walkman.
 */
export function PromoterDesk({ open: initiallyOpen = false, onToggle, onArrange, lamp: lampOn = true, onLamp, wood = 'walnut', minScale, maxScale, className = '', style }: PromoterDeskProps) {
  const surface = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(initiallyOpen);
  const [lamp, setLamp] = useState(lampOn);
  const [placed, setPlaced] = useState<Partial<Record<ThingId, Place>>>({});
  const [stacking, setStacking] = useState<LayerId[]>(STACKING);
  /* The rings the mug has left behind it: one on everything it was standing on each time it is lifted, every one of them drying.
     A mug set down half on a sheet leaves half a ring on the sheet, which goes with it, and half on the wood. */
  const trail = useCoffeeTrail(
    () => ({ ...placeOf('mug'), width: SIZES.mug }),
    () =>
      (['plan', 'sheet'] as const)
        .map((id) => ({ id, ...placeOf(id), width: SIZES[id], height: SIZES[id] * LETTER_RATIO }))
        .sort((one, other) => stacking.indexOf(one.id) - stacking.indexOf(other.id)),
  );

  const folderWidth = SIZES.folder;
  const folderHeight = folderWidth * FOLDER_RATIO;
  const { folder } = DESK_LAYOUT;
  /* The things inside are packed at the centre of the closed folder, its right half. */
  const packed = { x: folder.x + folderWidth * 0.75, y: folder.y + folderHeight / 2 };

  const isSpilled = (id: ThingId): id is SpilledThingId => id in DESK_LAYOUT.spilled;
  const placeOf = (id: ThingId): Place =>
    placed[id] ?? (isSpilled(id) ? DESK_LAYOUT.spilled[id] : open ? DESK_LAYOUT.things[id].open : DESK_LAYOUT.things[id].closed);
  const zOf = (id: LayerId) => 10 + stacking.indexOf(id);

  const toggle = () => {
    setOpen(!open);
    onToggle?.(!open);
  };
  const grab = (id: ThingId) => setStacking((order) => (order[order.length - 1] === id ? order : [...order.filter((other) => other !== id), id]));
  const move = (id: ThingId) => (to: { x: number; y: number; rotation?: number }) => setPlaced((all) => ({ ...all, [id]: { ...placeOf(id), ...to } }));
  const drop = () => onArrange?.(Object.fromEntries(STACKING.filter((id): id is ThingId => id !== 'folder').map((id) => [id, placeOf(id)])) as Record<ThingId, Place>);
  /** Screen pixels per desk unit, for the pointer's travel. */
  const scale = () => (surface.current?.querySelector('.desk__top')?.getBoundingClientRect().width ?? DESK_WIDTH) / DESK_WIDTH;

  const movable = (id: ThingId, width: number, grabBy: 'body' | 'anywhere' = 'body') => ({
    ...placeOf(id),
    width,
    z: zOf(id),
    label: LABELS[id],
    grab: grabBy,
    onMove: move(id),
    onGrab: () => grab(id),
    onDrop: drop,
  });

  /* What is stuck to the outside of the cover: the band's name on two strips sized to the
     cover, a typed label, the streaming stickers, the promoter's note to themself, and a coffee ring. */
  const brand = Math.round(folderWidth / 16);
  const cover = (
    <div className="promoter-desk__cover">
      <div className="promoter-desk__brand">
        <Wordmark fontSize={brand} letterSpacing="0.05em" outlineWidth={3} shadowX={4} shadowY={5} paddingX={14} paddingY={5} jitter>
          FUNKADELIC
        </Wordmark>
        <Wordmark fontSize={Math.round(brand * 0.88)} letterSpacing="0.05em" outlineWidth={3} shadowX={4} shadowY={5} paddingX={14} paddingY={5} inkColor="#639ec8" jitter>
          ASTRONAUT
        </Wordmark>
      </div>
      <span className="promoter-desk__typed">Press kit · fall 2026</span>
      <div className="promoter-desk__streams">
        {LISTEN_LINKS.map(({ platform, href, label }, index) => (
          <SocialSticker key={platform} platform={platform} href={href} label={label} size={SIZES.sticker} rotation={index % 2 ? 5 : -6} target="_blank" rel="noreferrer" />
        ))}
      </div>
      <div className="promoter-desk__note" style={{ width: SIZES.note }}>
        <StickyNote color="canary" rotation={4} size={80}>
          <p>Sept 26 — the 6pm slot?</p>
          <p>Listen to the tape!! — M.C.</p>
        </StickyNote>
      </div>
      <div className="promoter-desk__ring" style={{ width: SIZES.ring }}>
        <CoffeeRing strength={0.35} rotation={-30} />
      </div>
    </div>
  );

  return (
    <div ref={surface} className={`promoter-desk-stage ${className}`} style={style}>
      <MovableScale.Provider value={scale}>
        <Stage height={DESK_HEIGHT} minScale={minScale} maxScale={maxScale}>
          <Desk className="promoter-desk" wood={wood} height={DESK_HEIGHT} light={lamp ? 1 : 0.55} data-open={open ? 'true' : 'false'} data-lamp={lamp ? 'on' : 'off'}>
            {/* The lamp's pool on the wood, under everything. */}
            <Pin {...DESK_LAYOUT.glow} width={SIZES.glow * 2}>
              <LampLight on={lamp} />
            </Pin>
            {/* The band's stickers, loose on their liners, so they stay reachable whatever lies on top. */}
            <nav aria-label="Socials" className="promoter-desk__socials">
              {SOCIAL_LINKS.map(({ platform, href, label }, index) => (
                <Pin key={platform} {...DESK_LAYOUT.socials[index]}>
                  <SocialSticker platform={platform} href={href} label={label} size={SIZES.sticker} backing peel={index === 1 ? 2.4 : true} target="_blank" rel="noreferrer" />
                </Pin>
              ))}
            </nav>
            <Pin {...DESK_LAYOUT.ring} width={SIZES.ring}>
              <CoffeeRing strength={0.55} />
            </Pin>
            {/* The rings left this morning: the one the mug has just come off is wet and dark, and every one behind it a shade paler. */}
            <CoffeeRings rings={trail.on(DESK)} />

            {/* The press package: a plain folder with the band's name on the cover, and a button beneath it.
                It has a layer of its own, over the running order and under everything else, until something is picked up. */}
            <div
              className="promoter-desk__folder"
              style={{
                '--promoter-desk-folder-x': folder.x,
                '--promoter-desk-folder-y': folder.y,
                '--promoter-desk-folder-width': folderWidth,
                '--promoter-desk-folder-height': `${folderHeight}px`,
                '--promoter-desk-folder-unit': `${folderWidth / 1440}px`,
                '--promoter-desk-folder-rotation': `${folder.rotation}deg`,
                '--promoter-desk-folder-z': zOf('folder'),
              } as React.CSSProperties}
            >
              <button
                type="button"
                className="promoter-desk__open"
                aria-expanded={open}
                aria-label={open ? 'Close the press package' : 'Open the Funkadelic Astronaut press package'}
                onClick={toggle}
                style={{ '--tab-top': `${TAB.top}%`, '--tab-height': `${TAB.height}%`, '--tab-width': `${TAB.width}`, '--tab-out': `${TAB.out}` } as React.CSSProperties}
              />
              <Folder label="Press Package – Funkadelic Astronaut" tab="side" open={open} stamps={['Mission Control', 'Received']} stampsAt="bottom" sticker={cover} />
            </div>

            {/* The promoter's own things, shoved aside when the folder opens. */}
            <Movable {...movable('plan', SIZES.plan)}>
              <Stained rings={trail.on('plan')}>
                <SitePlan />
              </Stained>
            </Movable>
            <Movable {...movable('sheet', SIZES.sheet)}>
              <Stained rings={trail.on('sheet')}>
                <RunSheet />
              </Stained>
            </Movable>
            <Movable {...movable('ballpoint', SIZES.ballpoint)}>
              <Pen kind="ballpoint" ink="#2c4fa3" />
            </Movable>
            <Movable {...movable('marker', SIZES.marker)}>
              <Pen kind="marker" ink="#c9432f" />
            </Movable>
            <Movable {...movable('pick', SIZES.pick)}>
              <GuitarPick color="#9275b2" print="FA" />
            </Movable>
            <Movable {...movable('cassette', SIZES.cassette)}>
              <div className="promoter-desk__tape">
                <Cassette label="live at the pond" side="B" progress={0.35} />
              </div>
            </Movable>
            <Movable {...movable('clock', SIZES.clock)}>
              <DeskClock finish="black" />
            </Movable>
            <Movable {...movable('cradle', SIZES.cradle, 'anywhere')}>
              <NewtonsCradle />
            </Movable>
            {/* The mug leaves a ring wherever it has been standing, the moment it is carried off it. */}
            <Movable
              {...movable('mug', SIZES.mug)}
              onMove={(to) => {
                trail.lift();
                move('mug')(to);
              }}
              onDrop={() => {
                trail.settle();
                drop();
              }}
              onBlur={trail.settle}
            >
              <Mug glaze="#e9e1cf" coffee={0.65} />
            </Movable>
            <Movable {...movable('handheld', SIZES.handheld)}>
              <Handheld video={LIVE_SET.video} title="What to Do · live at Barrier Brewing Co." finish="black" />
            </Movable>
            <Movable {...movable('walkman', SIZES.walkman)}>
              <Walkman {...DEMO_TAPE} finish="blue" />
            </Movable>

            {/* What is inside the package. */}
            <Spill open={open} from={packed} delay={420}>
              <Spilled {...movable('live', SIZES.print, 'anywhere')} order={SPILL_ORDER.indexOf('live')}>
                <Polaroid video={LIVE_SET.video} plain format="wide" alt={LIVE_SET.alt} caption={LIVE_SET.caption ?? 'Live set'} note={LIVE_SET.note} />
              </Spilled>
              <Spilled {...movable('print', SIZES.print, 'anywhere')} order={SPILL_ORDER.indexOf('print')}>
                <Polaroid {...BAND_PACKET.photo} />
              </Spilled>
              {BAND_MEMBER_PACKETS.map(({ name, ...packet }, index) => {
                const id = (['ryan', 'kevin', 'sam'] as const)[index];
                return (
                  <Spilled key={name} {...movable(id, SIZES.packet)} order={SPILL_ORDER.indexOf(id)}>
                    <Packet {...packet} rotation={0} />
                  </Spilled>
                );
              })}
              <Spilled {...movable('oneSheet', SIZES.sheet, 'anywhere')} order={SPILL_ORDER.indexOf('oneSheet')}>
                <OneSheet {...BAND_ONE_SHEET} />
              </Spilled>
              <Spilled {...movable('handbill', SIZES.handbill, 'anywhere')} order={SPILL_ORDER.indexOf('handbill')}>
                <Handbill front={BAND_HANDBILL_FRONT} back={BAND_HANDBILL_BACK} stock="goldenrod" spot="purple" />
              </Spilled>
              <Spilled {...movable('zine', SIZES.zine, 'anywhere')} order={SPILL_ORDER.indexOf('zine')}>
                <MiniZine pages={BAND_ZINE_PAGES} stock="canary" />
              </Spilled>
              <Spilled {...movable('ticket', SIZES.ticket)} order={SPILL_ORDER.indexOf('ticket')}>
                <AdmissionTicket {...TOUR_ADMISSION_TICKET_PROPS} />
              </Spilled>
              <Spilled {...movable('pass', SIZES.pass)} order={SPILL_ORDER.indexOf('pass')}>
                <TourPass {...NYACK_FESTIVAL_TOUR_PASS_PROPS} rotation={0} />
              </Spilled>
            </Spill>

            {/* Over everything: the room going dark without the lamp, the lamp's light on the papers, and the lamp itself. */}
            <div className="promoter-desk__night" aria-hidden="true" />
            <Pin {...DESK_LAYOUT.glow} width={SIZES.glow * 2}>
              <LampLight on={lamp} className="promoter-desk__glow" />
            </Pin>
            <div className="promoter-desk__lamp">
              <Pin {...DESK_LAYOUT.lamp} width={SIZES.lamp}>
                <DeskLamp
                  on={lamp}
                  enamel="red"
                  onToggle={(next) => {
                    setLamp(next);
                    onLamp?.(next);
                  }}
                />
              </Pin>
            </div>

            <p className="promoter-desk__status" role="status" aria-live="polite" aria-label="Press package">
              {open
                ? 'The press package is open and its contents are out on the desk: the members’ cards, the one-sheet, two prints, the handbill, the zine, the tour ticket and the festival pass. Everything on the desk can be moved and turned.'
                : 'The Funkadelic Astronaut press package is closed on the Mission Control desk.'}
            </p>
          </Desk>
        </Stage>
      </MovableScale.Provider>
    </div>
  );
}
