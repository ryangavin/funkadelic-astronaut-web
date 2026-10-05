import type React from 'react';
import { useState } from 'react';
import kevinPortrait from '../../../assets/epk/kevin-portrait-900.webp';
import ryanPortrait from '../../../assets/epk/ryan-portrait-900.webp';
import samPortrait from '../../../assets/epk/sam-portrait-900.webp';
import liveLoop from '../../../assets/epk/live-loop.mp4';
import livePoster from '../../../assets/epk/live-poster.webp';
import { Weathered } from '../../behaviors/Weathered/Weathered';
import { SocialIcon } from '../../components/2D/SocialIcon/SocialIcon';
import { Distressed } from '../../foundations/Distressed/Distressed';
import { Inkjet } from '../../foundations/Inkjet/Inkjet';
import { BAND_MEMBER_PACKETS, LIVE_SET } from '../../sections/BandDossier/bandMembers';
import { SHARED_STAGES } from '../../sections/BandDossier/bandOneSheet';
import { BANDCAMP_LINK, BOOKING_HREF, LISTEN_LINKS, SOCIAL_LINKS } from '../Home/Home';
import { BandcampPlayer, FEATURED_RELEASE, type BandcampRelease } from './BandcampPlayer';
import { LiveVideo } from './LiveVideo';
import '../../styles/fonts.css';
import '../../styles/torn-edge.css';
import './Epk.css';

/** The spot inks, sampled from the cover of Time to Save the Universe. */
export type EpkInk = 'violet' | 'lavender' | 'periwinkle' | 'pink' | 'lime';

/** The cover's night sky, deepened: the ink the paper is printed in. Matches `--epk-night` in Epk.css. */
const EPK_NIGHT = '#1c1640';

export const BOOKING_EMAIL = 'samluba1@gmail.com';

/** Earlier records, newest first, as they are on Bandcamp. */
export const BACK_CATALOG = [
  { title: 'Mission Control', year: '2021' },
  { title: 'Magrathea', year: '2018' },
  { title: 'Emergency Exit', year: '2017' },
  { title: 'Impact', year: '2013' },
];

const list = (names: string[]) => `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

/** Each member's part, the spot ink their column is ruled in, and their stage portrait. */
const MEMBERS = [
  { part: 'Keys', ink: 'periwinkle', portrait: ryanPortrait, focus: '35% 30%' },
  { part: 'Drums', ink: 'lime', portrait: kevinPortrait, focus: '62% 30%' },
  { part: 'Bass & vocals', ink: 'pink', portrait: samPortrait, focus: '25% 40%' },
] as const satisfies { part: string; ink: EpkInk; portrait: string; focus: string }[];

/** A headline bar: heavy caps reversed out of a band of one spot ink, as the paper's two big sections are introduced. */
export function EpkBar({ ink, id, children }: { ink: EpkInk; id?: string; children: React.ReactNode }) {
  // A spot colour run on the press: multiplied onto the newsprint and worn at the edges, never a flat fill.
  return (
    <Distressed className="epk-bar-print">
      <h2 className="epk-bar" data-ink={ink} id={id}>
        {children}
      </h2>
    </Distressed>
  );
}

/** The booking address, written out so it can be read and copied, not only clicked. */
export function BookingLine({ className = '' }: { className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(BOOKING_EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // No clipboard (an insecure origin, or permission refused): the address is on screen to select.
    }
  };
  return (
    <p className={`booking-line ${className}`}>
      <span className="booking-line__label">Booking</span>
      <a className="booking-line__email" href={BOOKING_HREF}>
        {BOOKING_EMAIL}
      </a>
      <button type="button" className="booking-line__copy" onClick={copy} aria-live="polite">
        {copied ? 'Copied' : 'Copy'}
      </button>
    </p>
  );
}

export type EpkProps = {
  /** The record in the Bandcamp card. */
  release?: BandcampRelease;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * The press kit as one sheet of newsprint laid on the Mission Control
 * festival poster: a dateline and nameplate, the live set as the front-page
 * picture, the pitch with the booking address beside the story in columns,
 * the record boxed like an advertisement, the three of them, and the booking
 * address again in the classifieds at the foot so nobody scrolls back up for
 * it. The sheet is weathered stock; colour only arrives as spot inks run on
 * it. Wide it runs on one twelve-column grid, narrower it stacks in that same
 * order.
 */
export function Epk({ release = FEATURED_RELEASE, className = '', style }: EpkProps) {
  return (
    <div className={`epk ${className}`} style={style}>
      <Weathered as="article" className="epk__paper torn-edge" patina flecks grain wear>
        <header className="epk__masthead">
          <p className="epk__dateline">
            <span>Vol. 14 · No. 1</span>
            <span>New Jersey · Funktronica</span>
            <span>Est. 2012 · Free</span>
          </p>
          <Distressed className="epk__wordmark-print">
            <h1 className="epk__wordmark">
              <span>Funkadelic</span> <span>Astronaut</span>
            </h1>
          </Distressed>
          <nav className="epk__nav" aria-label="On this page">
            <a href="#music">Listen</a>
            <a href="#live">Watch</a>
            <a href="#band">The band</a>
            <a href="#book">Book us</a>
          </nav>
        </header>

        <main className="epk__sheet">
          <figure className="epk__live" id="live">
            <LiveVideo
              set={LIVE_SET}
              loop={liveLoop}
              poster={livePoster}
              title={`Funkadelic Astronaut, “${LIVE_SET.caption}” live at Barrier Brewing Co.`}
              label={
                <>
                  <span>Live</span> “{LIVE_SET.caption}”
                </>
              }
            />
            <figcaption>
              <strong>On stage.</strong> Funkadelic Astronaut playing “{LIVE_SET.caption}” at Barrier Brewing Co. The whole set is on the band’s
              YouTube.
            </figcaption>
          </figure>

          <EpkBar ink="violet">Funk from the future</EpkBar>

          <section className="epk__intro" aria-label="About the band">
            <p className="epk__lede">
              A New Jersey funktronica trio: Ryan Gavin on keys, Kevin O’Neill on drums and Sam Luba on bass and vocals.
            </p>
            <div className="epk__aside">
              <BookingLine />
              <div className="epk__stages">
                <p className="epk__small-label">Shared stages with</p>
                <ul>
                  {SHARED_STAGES.map(name => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="epk-record" id="music" aria-labelledby="record-title">
            <div className="epk-record__player">
              <p className="epk__small-label">Out now on Bandcamp</p>
              <BandcampPlayer release={release} />
            </div>
            <div className="epk-record__story">
              <h2 className="epk-record__title" id="record-title">
                {release.title}
              </h2>
              <div className="epk-record__facts">
                <div>
                  <p className="epk__small-label">Earlier records</p>
                  <ul className="epk-record__catalog">
                    {BACK_CATALOG.map(record => (
                      <li key={record.title}>
                        <span>{record.title}</span>
                        <span>{record.year}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="epk__small-label">Stream everywhere</p>
                  <div className="epk-record__links">
                    {[...LISTEN_LINKS, BANDCAMP_LINK].map(link => (
                      <a key={link.platform} href={link.href} target="_blank" rel="noreferrer" aria-label={link.label}>
                        <SocialIcon platform={link.platform} ink={EPK_NIGHT} print="flat" paper="transparent" size={30} label="" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
              <div className="epk__bio">
                <p>
                  Ryan and Kevin started the band as high school friends in 2012, and the lineup locked in when Sam joined in 2017. Since
                  then they have taken their sound to stages across the Northeast, sharing bills with some of their own favorites.
                </p>
                <p>
                  That sound is funk wired to electronics: a deep pocket from the rhythm section, synths and keys that take chances, and
                  room to stretch out live.
                </p>
                <p>
                  Their new record, <em>{release.title}</em>, came out in {release.year}, following{' '}
                  {list(BACK_CATALOG.map(record => `${record.title} (${record.year})`))}.
                </p>
              </div>
            </div>
          </section>

          <EpkBar ink="pink" id="band">
            Three friends. One orbit.
          </EpkBar>

          <section className="epk__members" aria-labelledby="band">
            {BAND_MEMBER_PACKETS.map((member, index) => {
              const { part, ink, portrait, focus } = MEMBERS[index];
              return (
                <article key={member.name} className="epk-member" data-ink={ink}>
                  <Inkjet className="epk-member__print">
                    <img
                      className="epk-member__photo"
                      src={portrait}
                      alt={member.photo.alt ?? member.name}
                      loading="lazy"
                      style={{ objectPosition: focus }}
                    />
                  </Inkjet>
                  <h3>
                    {member.name}
                    <small>{part}</small>
                  </h3>
                  {member.card.children}
                </article>
              );
            })}
          </section>

          <footer className="epk-foot" id="book" aria-label="Booking">
            <a className="epk-foot__book" href={BOOKING_HREF}>
              Book The Band
            </a>
            <div className="epk-foot__links">
              {[...SOCIAL_LINKS, ...LISTEN_LINKS, BANDCAMP_LINK].map(link => (
                <a key={link.platform} href={link.href} target="_blank" rel="noreferrer" aria-label={link.label}>
                  <SocialIcon platform={link.platform} ink={EPK_NIGHT} print="flat" paper="transparent" size={30} label="" />
                </a>
              ))}
            </div>
          </footer>
        </main>
      </Weathered>
    </div>
  );
}
