import demoTape from '../../../assets/audio/demo-tape.mp3';
import kevin from '../../../assets/band-22.webp';
import performance from '../../../assets/performance.webp';
import ryan from '../../../assets/band-13.webp';
import sam from '../../../assets/band-21.webp';
import type { ReactNode } from 'react';
import type { PacketProps } from '../../components/Packet/Packet';
import { KEVIN_SIGNATURE, RYAN_SIGNATURE, SAM_SIGNATURE } from './signatures';

export type LiveSet = {
  /** A video file, or a YouTube link. */
  video: string;
  alt: string;
  caption?: ReactNode;
  note?: ReactNode;
};

export type Tape = {
  /** An audio file. */
  src: string;
  /** Spelled out on the player's display. */
  title: string;
  /** Handwritten on the cassette label. */
  label?: string;
  side?: 'A' | 'B';
};

/** The tape left in the player: a synthesised bass loop standing in until a real track goes in. */
export const DEMO_TAPE: Tape = {
  src: demoTape,
  title: 'Spacewalk (demo)',
  label: 'spacewalk demo',
};

const WHAT_TO_DO = 'https://www.youtube.com/watch?v=iVZmXA27KfA';

/** The live set as the band's YouTube channel has it: "What to Do" at Barrier Brewing Co., 8 minutes 43. */
export const LIVE_SET: LiveSet = {
  video: WHAT_TO_DO,
  alt: 'Funkadelic Astronaut playing “What to Do” at Barrier Brewing Co., muted preview',
  caption: 'What to Do',
  note: (
    <a href={WHAT_TO_DO} target="_blank" rel="noreferrer">
      watch on YouTube
    </a>
  ),
};

/** The band's own packet: the live contact proof clipped to the summary card. */
export const BAND_PACKET: PacketProps = {
  photo: { src: performance, alt: 'Funkadelic Astronaut performing live', format: 'wide', focus: '50% 40%', caption: 'Live set', note: 'contact proof', tape: true, fade: 0.4 },
  rotation: -1.8,
  photoWidth: 280,
  photoTop: 30,
  photoRotation: 2,
  clipAt: 64,
  clipRotation: 6,
  facts: ['keys / drums / bass / vox', 'New Jersey · future rock'],
  card: {
    title: 'Funkadelic Astronaut',
    stamp: 'On file',
    stampAt: 'signature',
    children: (
      <>
        <p>Three friends blending funk and electronics with keyboards, drums, bass and vocals.</p>
        <p>Founded in New Jersey in 2012, bringing that sound to stages across the Northeast.</p>
      </>
    ),
  },
};

export type MemberPacket = PacketProps & { name: string };

/** The three members as the agent has them filed: a print captioned with a nickname,
    clipped to a written card signed with each member's scrawl. The strengths are drawn
    from the bios. Kevin's nickname is still to come. */
export const BAND_MEMBER_PACKETS: MemberPacket[] = [
  {
    name: 'Ryan Gavin',
    photo: { src: ryan, alt: 'Ryan Gavin playing keyboards at Crossroads', focus: '33.5% 24%', caption: 'Keyboard Wizard', tape: true },
    clipAt: 44,
    clipRotation: 9,
    facts: ['adventurous on the keys', 'music meets technology', 'helps steer the trio'],
    card: {
      title: 'Ryan Gavin',
      stamp: 'Since 2012',
      stampAt: 'signature',
      signature: { text: 'Ryan Gavin', path: RYAN_SIGNATURE, width: 250, rotation: -4 },
      children: (
        <>
          <p>Ryan co-founded Funkadelic Astronaut in 2012 with longtime friend Kevin O’Neill.</p>
          <p>Blending music and technology, he brings an adventurous touch to the keys, taking chances and helping steer the trio into unexpected territory.</p>
        </>
      ),
    },
  },
  {
    name: 'Kevin O’Neill',
    photo: { src: kevin, alt: 'Kevin O’Neill playing drums at Crossroads', focus: '66% 15%', caption: 'Kevin O’Neill', note: 'Drums' },
    photoRotation: -3,
    clipAt: 148,
    clipRotation: -4,
    facts: ['naturally gifted', 'steady behind the kit', 'here since day one'],
    card: {
      title: 'Kevin O’Neill',
      stamp: 'Since 2012',
      stampAt: 'signature',
      signature: { text: 'Kevin O’Neill', path: KEVIN_SIGNATURE, width: 236, rotation: 1.5 },
      children: (
        <>
          <p>A naturally gifted drummer, Kevin has been making music with Ryan since before Funkadelic Astronaut had a name.</p>
          <p>Behind the kit since day one, he brings a steady presence to a bond that runs deeper than bandmates, more like brothers.</p>
        </>
      ),
    },
  },
  {
    name: 'Sam Luba',
    photo: { src: sam, alt: 'Sam Luba singing and playing bass at Crossroads', focus: '21% 33%', caption: 'Starseed', note: 'Bass & vocals', tape: true },
    photoRotation: 7,
    clipAt: 104,
    clipRotation: 4,
    facts: ['bass and lead vocals', 'locked in the lineup'],
    card: {
      title: 'Sam Luba',
      stamp: 'Since 2017',
      stampAt: 'signature',
      signature: { text: 'Sam Luba', path: SAM_SIGNATURE, width: 244, rotation: -2.5 },
      children: (
        <>
          <p>Sam joined Funkadelic Astronaut in 2017, solidifying the band’s current lineup.</p>
          <p>He plays bass and sings alongside Ryan Gavin and Kevin O’Neill.</p>
        </>
      ),
    },
  },
];
