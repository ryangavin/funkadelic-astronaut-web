import kevin from '../../../assets/band-22.webp';
import ryan from '../../../assets/band-13.webp';
import sam from '../../../assets/band-21.webp';
import type { PacketProps } from './Packet';

/** The three members as the agent has them filed: a print clipped to a typed card. */
export const BAND_MEMBER_PACKETS: (PacketProps & { name: string })[] = [
  {
    name: 'Ryan Gavin',
    photo: { src: ryan, alt: 'Ryan Gavin playing keyboards at Crossroads', focus: '33.5% 24%', caption: 'Ryan Gavin', note: 'Keys', tape: true },
    clipAt: 44,
    clipRotation: 9,
    card: {
      title: 'Ryan Gavin',
      notes: [{ text: 'takes chances on keys ✓', x: 6, y: 74, rotation: -3 }],
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
    card: {
      title: 'Kevin O’Neill',
      notes: [{ text: 'since day one', x: 6, y: 74, rotation: -2 }],
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
    photo: { src: sam, alt: 'Sam Luba singing and playing bass at Crossroads', focus: '21% 33%', caption: 'Sam Luba', note: 'Bass & vocals', tape: true },
    photoRotation: 7,
    clipAt: 104,
    clipRotation: 4,
    card: {
      title: 'Sam Luba',
      notes: [{ text: "joined '17 · bass + vox", x: 6, y: 74, rotation: -2.5 }],
      children: (
        <>
          <p>Sam joined Funkadelic Astronaut in 2017, solidifying the band’s current lineup.</p>
          <p>He plays bass and sings alongside Ryan Gavin and Kevin O’Neill.</p>
        </>
      ),
    },
  },
];
