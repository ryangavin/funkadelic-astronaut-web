import { useState, type CSSProperties, type ReactNode } from 'react';
import { Stack, type StackProps } from '../../behaviors/Stack/Stack';
import { Folder, type FolderStock } from '../../components/Folder/Folder';
import { Packet, type PacketProps } from '../../components/Packet/Packet';
import { Polaroid } from '../../components/Polaroid/Polaroid';
import { BAND_MEMBER_PACKETS, BAND_PACKET, LIVE_SET, type MemberPacket } from './bandMembers';
import './BandDossier.css';

export { BAND_MEMBER_PACKETS, BAND_PACKET, LIVE_SET, type MemberPacket } from './bandMembers';

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

export type LiveSet = {
  /** A plain clip or an HLS playlist. */
  stream: string;
  poster: string;
  alt: string;
  caption?: ReactNode;
  note?: ReactNode;
};

export type BandDossierProps = {
  members?: MemberPacket[];
  /** The band's own packet, filed under the pile. */
  band?: PacketProps;
  /** The footage printed inside the cover, playing muted. */
  liveSet?: LiveSet;
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
  className?: string;
  style?: CSSProperties;
};

/**
 * The band section: a booking agent's press package lying open on the desk.
 * The live set plays inside the cover; the members' packets sit in a pile in
 * the well, the band's own packet filed beneath them.
 */
export function BandDossier({
  members,
  band = BAND_PACKET,
  liveSet = LIVE_SET,
  label = 'Press Package – Funkadelic Astronaut',
  stamps = ['Booking', 'Received'],
  sticker = 'Funkadelic Astronaut',
  stock,
  open = true,
  rotation = -1,
  initial,
  spread = 0.9,
  duration,
  className = '',
  style,
}: BandDossierProps) {
  return (
    <section className={`dossier ${className}`} style={style} aria-label="The band">
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
          <div className="dossier__proof">
            <Polaroid
              src={liveSet.poster}
              video={liveSet.stream}
              plain
              format="wide"
              alt={liveSet.alt}
              caption={liveSet.caption ?? 'Live set'}
              note={liveSet.note ?? '8:42 · preview'}
              tape
              rotation={1.5}
            />
          </div>
        }
      >
        <div className="dossier__well">
          <MemberPile members={members} initial={initial} spread={spread} duration={duration} />
          <Packet {...band} />
        </div>
      </Folder>
    </section>
  );
}
