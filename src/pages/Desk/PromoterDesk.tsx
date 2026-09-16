import type React from 'react';
import { useRef, useState } from 'react';
import { MovableScale, Movable, type Place } from '../../behaviors/Movable/Movable';
import { Spill, Spilled } from '../../behaviors/Spill/Spill';
import { Weathered } from '../../behaviors/Weathered/Weathered';
import { AdmissionTicket, TOUR_ADMISSION_TICKET_PROPS } from '../../components/AdmissionTicket/AdmissionTicket';
import { DESK_WIDTH, Desk, type DeskWood } from '../../components/Desk/Desk';
import { Folder } from '../../components/Folder/Folder';
import { GuitarPick } from '../../components/GuitarPick/GuitarPick';
import { Handheld } from '../../components/Handheld/Handheld';
import { CoffeeRing } from '../../components/Mug/CoffeeRing';
import { Mug } from '../../components/Mug/Mug';
import { OneSheet } from '../../components/OneSheet/OneSheet';
import { Packet } from '../../components/Packet/Packet';
import { Pen } from '../../components/Pen/Pen';
import { Pin } from '../../components/Pin/Pin';
import { Polaroid } from '../../components/Polaroid/Polaroid';
import { Stage, type StageProps } from '../../components/Stage/Stage';
import { SocialSticker } from '../../components/Sticker/SocialSticker';
import { StickyNote } from '../../components/StickyNote/StickyNote';
import { TourPass } from '../../components/TourPass/TourPass';
import { NYACK_FESTIVAL_TOUR_PASS_PROPS } from '../../components/TourPass/TourPass.data';
import { Cassette } from '../../components/Walkman/Cassette';
import { Walkman } from '../../components/Walkman/Walkman';
import { Wordmark } from '../../components/Wordmark/Wordmark';
import { Handbill } from '../../experiments/BandIntro/Handbill';
import { BAND_HANDBILL_BACK, BAND_HANDBILL_FRONT } from '../../experiments/BandIntro/Handbill.band';
import { MiniZine } from '../../experiments/BandIntro/MiniZine';
import { BAND_ZINE_PAGES } from '../../experiments/BandIntro/MiniZine.band';
import { Distressed } from '../../foundations/Distressed/Distressed';
import { BAND_MEMBER_PACKETS, BAND_ONE_SHEET, BAND_PACKET, DEMO_TAPE, LIVE_SET } from '../../sections/BandDossier/BandDossier';
import { LISTEN_INKS, LISTEN_LINKS, SOCIAL_LINKS } from '../Home/Home';
import '../../styles/fonts.css';
import './PromoterDesk.css';

/**
 * Everything on the desk is sized from one reference: the Walkman, 112
 * millimetres across, is 300 desk units. So one unit is 0.37 mm, the desk's
 * 1440 units are 537 mm of desktop, and every other thing is its real size
 * in the same scale: a letter folder, a Sharpie, a mug, a quarter-sheet
 * handbill, a 4 x 6 card.
 */
export const REFERENCE = { object: 'Walkman', millimetres: 112, units: 300 } as const;
export const mm = (millimetres: number) => Math.round((millimetres * REFERENCE.units) / REFERENCE.millimetres);

/** The desk's design size: 1440 across, 1760 deep: 537 by 657 mm of desktop. */
export const DESK_HEIGHT = 1760;

/** Real widths, in millimetres, of what lies on the desk. Each component's box is measured across the thing itself. */
export const REAL_WIDTHS = {
  /** A letter-size manila folder, open: 9½ x 11¾ inches a leaf. */
  folder: 482,
  walkman: 112,
  /** A compact cassette. */
  cassette: 100,
  /** The widescreen handheld. */
  handheld: 170,
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
} as const;

/** The same, in desk units. */
export const SIZES = Object.fromEntries(Object.entries(REAL_WIDTHS).map(([thing, width]) => [thing, mm(width)])) as Record<keyof typeof REAL_WIDTHS, number>;

/** The folder's proportions, from the Folder component: two leaves of 720 in 1440, 915 tall. */
const FOLDER_RATIO = 915 / 1440;
/** The tab on the folder's edge, from the Folder component: 9% down the leaf, 52% of its height, 58 units wide, set 44 out past the edge. */
const TAB = { top: 9, height: 52, width: 58, out: 44 };

export type DeskThingId = 'walkman' | 'cassette' | 'handheld' | 'mug' | 'sheet' | 'ballpoint' | 'marker' | 'pick';
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
  folder: { x: 100, y: 80, rotation: -1.5 },
  things: {
    walkman: { closed: { x: 770, y: 520, rotation: -6 }, open: { x: 40, y: 1320, rotation: -8 } },
    cassette: { closed: { x: 60, y: 400, rotation: 12 }, open: { x: 380, y: 1400, rotation: 14 } },
    handheld: { closed: { x: 200, y: 560, rotation: 3 }, open: { x: 600, y: 1340, rotation: 2 } },
    mug: { closed: { x: 40, y: 40, rotation: 34 }, open: { x: 1080, y: 1330, rotation: 34 } },
    sheet: { closed: { x: 300, y: 120, rotation: -4 }, open: { x: 30, y: 1150, rotation: -3 } },
    ballpoint: { closed: { x: 320, y: 400, rotation: -12 }, open: { x: 1000, y: 1620, rotation: -6 } },
    marker: { closed: { x: 40, y: 300, rotation: -15 }, open: { x: 40, y: 20, rotation: -15 } },
    pick: { closed: { x: 640, y: 470, rotation: 40 }, open: { x: 1340, y: 1500, rotation: 40 } },
  } satisfies Record<DeskThingId, { closed: Place; open: Place }>,
  spilled: {
    live: { x: 180, y: 330, rotation: -3 },
    print: { x: 400, y: 560, rotation: 6 },
    ryan: { x: 760, y: 110, rotation: -4 },
    kevin: { x: 900, y: 360, rotation: 5 },
    sam: { x: 1000, y: 560, rotation: -6 },
    oneSheet: { x: 700, y: 640, rotation: -2 },
    handbill: { x: 60, y: 940, rotation: -9 },
    zine: { x: 400, y: 980, rotation: 4 },
    ticket: { x: 700, y: 1000, rotation: 3 },
    pass: { x: 1120, y: 960, rotation: 8 },
  } satisfies Record<SpilledThingId, Place>,
  /** The ring stays where the mug was set down last night; the stickers are stuck to the wood. */
  ring: { x: 200, y: 260, rotation: 20 },
  socials: [
    { x: 0, y: 600, rotation: -8 },
    { x: 6, y: 730, rotation: 6 },
    { x: 0, y: 860, rotation: -3 },
  ],
};

/** A layer on the desk: a thing, or the folder itself, which lies over the running order and under everything else. */
export type LayerId = ThingId | 'folder';

/** What lies on top of what, to begin with: first is underneath. Picking a thing up brings it to the top. */
const STACKING: LayerId[] = ['sheet', 'folder', 'ballpoint', 'marker', 'pick', 'cassette', 'mug', 'handheld', 'walkman', 'live', 'print', 'ryan', 'kevin', 'sam', 'oneSheet', 'handbill', 'zine', 'ticket', 'pass'];
const SPILL_ORDER: SpilledThingId[] = ['live', 'print', 'ryan', 'kevin', 'sam', 'oneSheet', 'handbill', 'zine', 'ticket', 'pass'];

const LABELS: Record<ThingId, string> = {
  walkman: 'Walkman',
  cassette: 'Spare cassette',
  handheld: 'Handheld',
  mug: 'Mug',
  sheet: 'Running order',
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
  wood?: DeskWood;
  className?: string;
  style?: React.CSSProperties;
};

/** The promoter's running order for the day, a draft off the office printer, with the band's slot pencilled in. */
function RunSheet() {
  return (
    <Weathered className="run-sheet" grain wear={0.25}>
      <div className="run-sheet__page">
        <Distressed className="run-sheet__stamp">
          <span className="run-sheet__stamp-ink">Draft</span>
        </Distressed>
        <h2 className="run-sheet__title">Nyack Neighborhood Music &amp; Arts Festival</h2>
        <p className="run-sheet__meta">Main stage · Saturday, September 26, 2026 · running order v3</p>
        <table className="run-sheet__slots">
          <tbody>
            <tr>
              <th scope="row">2:00 pm</th>
              <td>Opener — tbd</td>
            </tr>
            <tr>
              <th scope="row">3:15 pm</th>
              <td>tbd (hold for the school band?)</td>
            </tr>
            <tr>
              <th scope="row">4:30 pm</th>
              <td>Changeover · DJ</td>
            </tr>
            <tr className="run-sheet__slot--band">
              <th scope="row">6:00 pm</th>
              <td>Funkadelic Astronaut · 45 min</td>
            </tr>
            <tr>
              <th scope="row">7:30 pm</th>
              <td>Headliner — tbd</td>
            </tr>
            <tr>
              <th scope="row">9:00 pm</th>
              <td>Curfew</td>
            </tr>
          </tbody>
        </table>
        <span className="run-sheet__pen" aria-hidden="true">
          confirm!! → call Sam
        </span>
        <span className="run-sheet__circle" aria-hidden="true" />
      </div>
    </Weathered>
  );
}

/**
 * The promoter's desk, the way a visitor first sees the site: 537 by 657 mm
 * of wooden desktop with the band's press package lying closed on it, their
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
export function PromoterDesk({ open: initiallyOpen = false, onToggle, onArrange, wood = 'walnut', minScale, maxScale, className = '', style }: PromoterDeskProps) {
  const surface = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(initiallyOpen);
  const [placed, setPlaced] = useState<Partial<Record<ThingId, Place>>>({});
  const [stacking, setStacking] = useState<LayerId[]>(STACKING);

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
  const move = (id: ThingId) => (to: { x: number; y: number }) => setPlaced((all) => ({ ...all, [id]: { ...placeOf(id), ...to } }));
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

  /* What is stuck to the outside of the cover: the band's name on two strips, a typed
     label, the streaming stickers, the promoter's note to themself, and a coffee ring. */
  const cover = (
    <div className="promoter-desk__cover">
      <div className="promoter-desk__brand">
        <Wordmark fontSize={82} letterSpacing="0.05em" outlineWidth={3} shadowX={4} shadowY={5} paddingX={16} paddingY={6} jitter>
          FUNKADELIC
        </Wordmark>
        <Wordmark fontSize={72} letterSpacing="0.05em" outlineWidth={3} shadowX={4} shadowY={5} paddingX={16} paddingY={6} inkColor="#639ec8" jitter>
          ASTRONAUT
        </Wordmark>
      </div>
      <span className="promoter-desk__typed">Press kit · fall 2026</span>
      <div className="promoter-desk__streams">
        {LISTEN_LINKS.map(({ platform, href, label }, index) => (
          <SocialSticker key={platform} platform={platform} href={href} label={label} ink={LISTEN_INKS[platform]} size={SIZES.sticker} rotation={index % 2 ? 5 : -6} target="_blank" rel="noreferrer" />
        ))}
      </div>
      <div className="promoter-desk__note" style={{ width: SIZES.note }}>
        <StickyNote color="canary" rotation={4} size={80}>
          <p>Sept 26 — the 6pm slot?</p>
          <p>Listen to the tape!!</p>
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
          <Desk className="promoter-desk" wood={wood} height={DESK_HEIGHT} data-open={open ? 'true' : 'false'}>
            {/* Stuck to the desk itself, so they stay reachable whatever lies on top. */}
            <nav aria-label="Socials" className="promoter-desk__socials">
              {SOCIAL_LINKS.map(({ platform, href, label }, index) => (
                <Pin key={platform} {...DESK_LAYOUT.socials[index]}>
                  <SocialSticker platform={platform} href={href} label={label} ink="purple" size={SIZES.sticker} peel={index === 1 ? 2.4 : true} target="_blank" rel="noreferrer" />
                </Pin>
              ))}
            </nav>
            <Pin {...DESK_LAYOUT.ring} width={SIZES.ring}>
              <CoffeeRing strength={0.55} />
            </Pin>

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
              <Folder label="Press Package – Funkadelic Astronaut" tab="side" open={open} stamps={['Booking', 'Received']} stampsAt="bottom" sticker={cover} />
            </div>

            {/* The promoter's own things, shoved aside when the folder opens. */}
            <Movable {...movable('sheet', SIZES.sheet)}>
              <RunSheet />
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
            <Movable {...movable('mug', SIZES.mug)}>
              <Mug glaze="#e9e1cf" coffee={0.65} rotation={0} />
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

            <p className="promoter-desk__status" role="status" aria-live="polite" aria-label="Press package">
              {open
                ? 'The press package is open and its contents are out on the desk: the members’ cards, the one-sheet, two prints, the handbill, the zine, the tour ticket and the festival pass. Everything on the desk can be moved.'
                : 'The Funkadelic Astronaut press package is closed on the desk.'}
            </p>
          </Desk>
        </Stage>
      </MovableScale.Provider>
    </div>
  );
}
