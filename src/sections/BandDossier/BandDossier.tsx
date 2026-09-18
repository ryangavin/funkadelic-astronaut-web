import { useState, type CSSProperties, type ReactNode } from 'react';
import { Stack, type StackProps } from '../../behaviors/Stack/Stack';
import { Folder, type FolderStock } from '../../components/2D/Folder/Folder';
import { OneSheet, type OneSheetContent } from '../../components/2D/OneSheet/OneSheet';
import { Packet } from '../../components/2D/Packet/Packet';
import { Polaroid } from '../../components/2D/Polaroid/Polaroid';
import { Walkman } from '../../components/3D/Walkman/Walkman';
import { BAND_MEMBER_PACKETS, DEMO_TAPE, LIVE_SET, type LiveSet, type MemberPacket, type Tape } from './bandMembers';
import { BAND_ONE_SHEET } from './bandOneSheet';
import './BandDossier.css';

export { BAND_MEMBER_PACKETS, BAND_PACKET, DEMO_TAPE, LIVE_SET, type LiveSet, type MemberPacket, type Tape } from './bandMembers';
export { BAND_ONE_SHEET } from './bandOneSheet';

export type MemberPileProps = Pick<StackProps, 'spread' | 'spreadX' | 'duration' | 'side'> & {
  /** The members, in filing order. */
  members?: MemberPacket[];
  /** Which member starts on top. */
  initial?: number;
  selected?: number;
  onSelect?: (index: number) => void;
  className?: string;
};

/**
 * The members' packets as a pile the visitor sifts through: click a name peeking
 * out to bring that card up, click the top card to send it under. Which card is
 * on top is announced for assistive technology.
 */
export function MemberPile({ members = BAND_MEMBER_PACKETS, initial = 0, selected, onSelect, spread, spreadX, duration, side, className = '' }: MemberPileProps) {
  const [ownIndex, setIndex] = useState(initial);
  const index = selected ?? ownIndex;
  const count = members.length;
  return (
    <div className={`member-pile ${className}`} role="region" aria-roledescription="carousel" aria-label="Meet the band">
      <Stack
        index={index}
        spread={spread}
        spreadX={spreadX}
        duration={duration}
        side={side}
        onSelect={(item) => { const next = item === index ? (index + 1) % count : item; setIndex(next); onSelect?.(next); }}
        itemLabel={(item, depth) => (depth === 0 ? `${members[item].name}, on top. Show the next card` : `Bring ${members[item].name} to the front`)}
      >
        {members.map(({ name, ...packet }) => (
          <Packet key={name} {...packet} />
        ))}
      </Stack>
      <span className="member-pile__status" role="status" aria-live="polite">
        {members[index].name} · {index + 1} of {count}
      </span>
    </div>
  );
}

export type BandDossierProps = {
  members?: MemberPacket[];
  /** The band's press one-sheet, folded under the pile. Click it to unfold it. */
  oneSheet?: OneSheetContent;
  /** The footage printed inside the cover, playing muted: a video file or a YouTube link, captioned. */
  liveSet?: LiveSet;
  /** The cassette player left in the cover under the print, with a tape in it. `null` leaves it out. */
  tape?: Tape | null;
  /** Written on the tab. */
  label?: ReactNode;
  stamps?: ReactNode[];
  sticker?: ReactNode;
  stock?: FolderStock;
  /** Whether the folder lies open. */
  open?: boolean;
  /** Requests only: the containing scene decides what opening and closing mean. */
  onOpen?: () => void;
  onClose?: () => void;
  /** Hide the inside artwork when a containing scene lays its contents on the desk. */
  showContents?: boolean;
  /** Tilt of the folder on the desk, in degrees. */
  rotation?: number;
  /** Which member starts on top of the pile. */
  initial?: number;
  /** How loosely the pile is stacked. */
  spread?: number;
  /** How far the members' cards lean sideways out of the pile. Follows `spread` unless given. */
  spreadX?: number;
  /** Length of one sift, in milliseconds. */
  duration?: number;
  /** Placement of the print in the cover: width and inset from the left as percentages of the pocket, drop from the top, tilt in degrees. */
  proofWidth?: number;
  proofX?: number;
  proofY?: number;
  proofRotation?: number;
  /** Placement of the player in the cover: width and inset from the left as percentages of the pocket, lift from the bottom, tilt in degrees. */
  deckWidth?: number;
  deckX?: number;
  deckY?: number;
  deckRotation?: number;
  /** Placement of the well's contents: width and inset from the left as percentages of the well, the gap between pile and packet. */
  wellWidth?: number;
  wellX?: number;
  wellGap?: number;
  /** Nudge of the pile sideways, as a percentage of the well, to keep the tab clear. */
  pileX?: number;
  /** Tilt of the whole pile, and of the one-sheet beneath it, in degrees. */
  pileRotation?: number;
  bandRotation?: number;
  /** Anything else loose in the well, laid over the pile and the one-sheet. It positions itself: the well is its containing block. */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/** Where everything lies by default, for the stories' controls. */
export const DOSSIER_PLACEMENT = {
  proofWidth: 108,
  proofX: -9,
  proofY: -14,
  proofRotation: -3,
  deckWidth: 94,
  deckX: -4,
  deckY: -14,
  deckRotation: 4,
  wellWidth: 110,
  wellX: -1,
  wellGap: 0,
  pileX: -9,
  pileRotation: 5,
  bandRotation: -4,
} as const;

/**
 * The band section: a booking agent's press package lying open on the desk.
 * The live set plays inside the cover with a cassette player left under it;
 * the members' packets sit in a pile in the well, the band's press one-sheet
 * folded beneath them.
 */
export function BandDossier({
  members,
  oneSheet = BAND_ONE_SHEET,
  liveSet = LIVE_SET,
  tape = DEMO_TAPE,
  label = 'Press Package – Funkadelic Astronaut',
  stamps = ['Booking', 'Received'],
  sticker = 'Funkadelic Astronaut',
  stock,
  open = true,
  onOpen,
  onClose,
  showContents = true,
  rotation = -1,
  initial,
  spread = 1.1,
  spreadX,
  duration,
  proofWidth = DOSSIER_PLACEMENT.proofWidth,
  proofX = DOSSIER_PLACEMENT.proofX,
  proofY = DOSSIER_PLACEMENT.proofY,
  proofRotation = DOSSIER_PLACEMENT.proofRotation,
  deckWidth = DOSSIER_PLACEMENT.deckWidth,
  deckX = DOSSIER_PLACEMENT.deckX,
  deckY = DOSSIER_PLACEMENT.deckY,
  deckRotation = DOSSIER_PLACEMENT.deckRotation,
  wellWidth = DOSSIER_PLACEMENT.wellWidth,
  wellX = DOSSIER_PLACEMENT.wellX,
  wellGap = DOSSIER_PLACEMENT.wellGap,
  pileX = DOSSIER_PLACEMENT.pileX,
  pileRotation = DOSSIER_PLACEMENT.pileRotation,
  bandRotation = DOSSIER_PLACEMENT.bandRotation,
  children,
  className = '',
  style,
}: BandDossierProps) {
  const [selected, setSelected] = useState(initial ?? 0);
  const placement = {
    '--dossier-proof-width': `${proofWidth}%`,
    '--dossier-proof-x': `${proofX}%`,
    '--dossier-proof-y': `${proofY}%`,
    '--dossier-deck-width': `${deckWidth}%`,
    '--dossier-deck-x': `${deckX}%`,
    '--dossier-deck-y': `${deckY}%`,
    '--dossier-well-width': `${wellWidth}%`,
    '--dossier-well-x': `${wellX}%`,
    '--dossier-well-gap': `${wellGap}%`,
    '--dossier-pile-x': `${pileX}%`,
    '--dossier-pile-rotation': `${pileRotation}deg`,
  } as CSSProperties;
  return (
    <section className={`dossier ${className}`} style={{ ...placement, ...style }} aria-label="The band">
      <Folder
        label={label}
        tab="side"
        stock={stock}
        open={open}
        lazyContents
        stamps={stamps}
        stampsAt="bottom"
        sticker={sticker}
        rotation={rotation}
        cover={showContents &&
          <>
            <div className="dossier__proof">
              <Polaroid
                video={liveSet.video}
                plain
                format="wide"
                alt={liveSet.alt}
                caption={liveSet.caption ?? 'Live set'}
                note={liveSet.note}
                rotation={proofRotation}
              />
            </div>
            {tape && (
              <div className="dossier__deck">
                <Walkman {...tape} finish="silver" rotation={deckRotation} />
              </div>
            )}
          </>
        }
      >
        {showContents && <div className="dossier__well">
          <MemberPile members={members} selected={selected} onSelect={setSelected} spread={spread} spreadX={spreadX} duration={duration} />
          <OneSheet {...oneSheet} rotation={bandRotation} />
          {children}
        </div>}
      </Folder>
      {(onOpen || onClose) && <button type="button" className="dossier__toggle" aria-expanded={open} aria-label={open ? 'Close the press package' : 'Open the press package'} onClick={open ? onClose : onOpen} />}
    </section>
  );
}
