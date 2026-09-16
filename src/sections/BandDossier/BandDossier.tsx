import { useState, type CSSProperties, type ReactNode } from 'react';
import { Stack, type StackProps } from '../../behaviors/Stack/Stack';
import { Folder, type FolderStock } from '../../components/Folder/Folder';
import { Packet, type PacketProps } from '../../components/Packet/Packet';
import { Polaroid } from '../../components/Polaroid/Polaroid';
import { Walkman } from '../../components/Walkman/Walkman';
import { BAND_MEMBER_PACKETS, BAND_PACKET, DEMO_TAPE, LIVE_SET, type LiveSet, type MemberPacket, type Tape } from './bandMembers';
import './BandDossier.css';

export { BAND_MEMBER_PACKETS, BAND_PACKET, DEMO_TAPE, LIVE_SET, type LiveSet, type MemberPacket, type Tape } from './bandMembers';

export type MemberPileProps = Pick<StackProps, 'spread' | 'duration' | 'side'> & {
  /** The members, in filing order. */
  members?: MemberPacket[];
  /** Which member starts on top. */
  initial?: number;
  className?: string;
};

/**
 * The members' packets as a pile the visitor sifts through: click a name peeking
 * out to bring that card up, click the top card to send it under. Which card is
 * on top is announced for assistive technology.
 */
export function MemberPile({ members = BAND_MEMBER_PACKETS, initial = 0, spread, duration, side, className = '' }: MemberPileProps) {
  const [index, setIndex] = useState(initial);
  const count = members.length;
  return (
    <div className={`member-pile ${className}`} role="region" aria-roledescription="carousel" aria-label="Meet the band">
      <Stack
        index={index}
        spread={spread}
        duration={duration}
        side={side}
        onSelect={(item) => setIndex(item === index ? (index + 1) % count : item)}
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
  /** The band's own packet, filed under the pile. */
  band?: PacketProps;
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
  /** Tilt of the folder on the desk, in degrees. */
  rotation?: number;
  /** Which member starts on top of the pile. */
  initial?: number;
  /** How loosely the pile is stacked. */
  spread?: number;
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
  /** Tilt of the whole pile, and of the band's packet beneath it, in degrees. */
  pileRotation?: number;
  bandRotation?: number;
  className?: string;
  style?: CSSProperties;
};

/** Where everything lies by default, for the stories' controls. */
export const DOSSIER_PLACEMENT = {
  proofWidth: 90,
  proofX: 4,
  proofY: 0,
  proofRotation: 1.5,
  deckWidth: 62,
  deckX: 7,
  deckY: 2,
  deckRotation: 3,
  wellWidth: 78,
  wellX: 9,
  wellGap: 4,
  pileRotation: 0,
  bandRotation: 0,
} as const;

/**
 * The band section: a booking agent's press package lying open on the desk.
 * The live set plays inside the cover with a cassette player left under it;
 * the members' packets sit in a pile in the well, the band's own packet filed
 * beneath them.
 */
export function BandDossier({
  members,
  band = BAND_PACKET,
  liveSet = LIVE_SET,
  tape = DEMO_TAPE,
  label = 'Press Package – Funkadelic Astronaut',
  stamps = ['Booking', 'Received'],
  sticker = 'Funkadelic Astronaut',
  stock,
  open = true,
  rotation = -1,
  initial,
  spread = 0.9,
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
  pileRotation = DOSSIER_PLACEMENT.pileRotation,
  bandRotation = DOSSIER_PLACEMENT.bandRotation,
  className = '',
  style,
}: BandDossierProps) {
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
    '--dossier-pile-rotation': `${pileRotation}deg`,
  } as CSSProperties;
  return (
    <section className={`dossier ${className}`} style={{ ...placement, ...style }} aria-label="The band">
      <Folder
        label={label}
        tab="side"
        stock={stock}
        open={open}
        stamps={stamps}
        stampsAt="bottom"
        sticker={sticker}
        rotation={rotation}
        cover={
          <>
            <div className="dossier__proof">
              <Polaroid
                video={liveSet.video}
                plain
                format="wide"
                alt={liveSet.alt}
                caption={liveSet.caption ?? 'Live set'}
                note={liveSet.note}
                tape
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
        <div className="dossier__well">
          <MemberPile members={members} initial={initial} spread={spread} duration={duration} />
          <Packet {...band} rotation={bandRotation} />
        </div>
      </Folder>
    </section>
  );
}
