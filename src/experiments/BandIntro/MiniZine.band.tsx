import astronaut from '../../../assets/astronaut-transparent.png';
import kevin from '../../../assets/kevin-portrait.webp';
import performance from '../../../assets/performance.webp';
import ryan from '../../../assets/ryan-portrait.webp';
import sam from '../../../assets/sam-portrait.webp';
import { TOUR_DATES } from '../../components/2D/TourPass/TourPass.data';
import { BAND_MEMBER_PACKETS, BAND_PACKET, LIVE_SET } from '../../sections/BandDossier/bandMembers';
import { ZineFolio, ZineHeading, ZineList, ZineNote, ZinePhoto, ZineText, ZineTitle } from './MiniZine';

const [ryanPacket, kevinPacket, samPacket] = BAND_MEMBER_PACKETS;

const memberPage = (page: number, src: string, packet: (typeof BAND_MEMBER_PACKETS)[number], part: string, focus: string) => (
  <>
    <ZinePhoto src={src} alt={packet.photo.alt ?? packet.name} height={400} focus={focus} />
    <ZineHeading>
      {packet.name}
      <small>{part}</small>
    </ZineHeading>
    <ZineText>{packet.card.children}</ZineText>
    <ZineList items={packet.facts ?? []} />
    <ZineFolio page={page}>Funkadelic Astronaut</ZineFolio>
  </>
);

/** The band's zine: a cover, who they are, the live shot, a page each, the dates, and the back. */
export const BAND_ZINE_PAGES = [
  // 1: cover
  <>
    <ZineHeading>
      A small introduction
      <small>No. 1 · New Jersey</small>
    </ZineHeading>
    <ZineTitle size={104}>
      Funkadelic
      <br />
      Astronaut
    </ZineTitle>
    <ZinePhoto src={astronaut} alt="" height={520} cutout />
    <ZineNote size={40}>funk, meet the future.</ZineNote>
  </>,
  // 2: the band
  <>
    <ZineHeading>
      The band
      <small>est. 2012</small>
    </ZineHeading>
    <ZineTitle size={64}>
      Three friends.
      <br />
      One orbit.
    </ZineTitle>
    <ZineText>{BAND_PACKET.card.children}</ZineText>
    <ZineList items={BAND_PACKET.facts ?? []} />
    <ZineFolio page={2}>Funkadelic Astronaut</ZineFolio>
  </>,
  // 3: live
  <>
    <ZinePhoto src={performance} alt={BAND_PACKET.photo.alt ?? 'Funkadelic Astronaut performing live'} height={620} focus="50% 40%" caption={<>Live · {LIVE_SET.caption} at Barrier Brewing Co.</>} />
    <ZineText>
      <p>Eight minutes forty-three of it is on the band's channel: {LIVE_SET.note}.</p>
    </ZineText>
    <ZineNote>see you out there ↗</ZineNote>
    <ZineFolio page={3}>Live transmission</ZineFolio>
  </>,
  // 4–6: the members
  memberPage(4, ryan, ryanPacket, 'Keys', '50% 20%'),
  memberPage(5, kevin, kevinPacket, 'Drums', '50% 20%'),
  memberPage(6, sam, samPacket, 'Bass & vocals', '50% 20%'),
  // 7: dates
  <>
    <ZineHeading>
      On tour
      <small>Northeast</small>
    </ZineHeading>
    <ZineList
      items={TOUR_DATES.map((date) => (
        <>
          <strong>
            {date.weekday} {date.month} {date.day}
          </strong>{' '}
          · {date.venue}, {date.city}
        </>
      ))}
    />
    <ZineHeading>
      <small>Listen everywhere</small>
    </ZineHeading>
    <ZineText>
      <p>Spotify · Apple Music · YouTube · Deezer · Bandcamp</p>
    </ZineText>
    <ZineNote>bring a friend.</ZineNote>
    <ZineFolio page={7}>Funkadelic Astronaut</ZineFolio>
  </>,
  // 8: back cover
  <>
    <ZinePhoto src={astronaut} alt="" height={300} cutout />
    <ZineText>
      <p>Made on a photocopier in New Jersey. Fold it, staple it, hand it to someone.</p>
      <p>
        Booking: <a href="mailto:samluba1@gmail.com?subject=Funkadelic%20Astronaut%20Booking">samluba1@gmail.com</a>
      </p>
    </ZineText>
    <ZineFolio page={8}>Keys · drums · bass · vox</ZineFolio>
  </>,
];
