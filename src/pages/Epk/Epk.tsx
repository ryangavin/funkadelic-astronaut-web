import type React from 'react';
import { useState } from 'react';
import kevinPortrait from '../../../assets/epk/kevin-portrait-900.webp';
import ryanPortrait from '../../../assets/epk/ryan-portrait-900.webp';
import samPortrait from '../../../assets/epk/sam-portrait-900.webp';
import performance from '../../../assets/performance.webp';
import { SocialIcon } from '../../components/2D/SocialIcon/SocialIcon';
import { Distressed } from '../../foundations/Distressed/Distressed';
import { BAND_MEMBER_PACKETS, LIVE_SET } from '../../sections/BandDossier/bandMembers';
import { SHARED_STAGES } from '../../sections/BandDossier/bandOneSheet';
import { BANDCAMP_LINK, BOOKING_HREF, LISTEN_INKS, LISTEN_LINKS, SOCIAL_LINKS } from '../Home/Home';
import { BandcampPlayer, FEATURED_RELEASE, type BandcampRelease } from './BandcampPlayer';
import { LiveVideo } from './LiveVideo';
import '../../styles/fonts.css';
import './Epk.css';

/** The site's inks, which the poster's bars and frames are printed in. */
export type EpkInk = 'red' | 'green' | 'purple' | 'blue' | 'amber';

export const BOOKING_EMAIL = 'samluba1@gmail.com';

/** Earlier records, newest first, as they are on Bandcamp. */
export const BACK_CATALOG = [
  { title: 'Mission Control', year: '2021' },
  { title: 'Magrathea', year: '2018' },
  { title: 'Emergency Exit', year: '2017' },
  { title: 'Impact', year: '2013' },
];

const list = (names: string[]) => `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

/** Each member's part, the ink their card is framed in, and their stage portrait in colour. */
const MEMBERS = [
  { part: 'Keys', ink: 'red', portrait: ryanPortrait, focus: '35% 30%' },
  { part: 'Drums', ink: 'green', portrait: kevinPortrait, focus: '62% 30%' },
  { part: 'Bass & vocals', ink: 'purple', portrait: samPortrait, focus: '25% 40%' },
] as const satisfies { part: string; ink: EpkInk; portrait: string; focus: string }[];

/** A headline bar: bold caps on a band of one ink, as the poster's two big sections are introduced. */
export function EpkBar({ ink, id, children }: { ink: EpkInk; id?: string; children: React.ReactNode }) {
  return (
    <h2 className="epk-bar" data-ink={ink} id={id}>
      {children}
    </h2>
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
 * The press kit, laid out for the person deciding whether to book the band:
 * the masthead, a pitch with the booking address beside the three of them,
 * then the record and a live video, then the story and the band, and the
 * booking address again at the bottom so nobody scrolls back up for it.
 * Printed like a poster in the site's inks; wide it runs on one twelve-column
 * grid, narrower it stacks in that same order.
 */
export function Epk({ release = FEATURED_RELEASE, className = '', style }: EpkProps) {
  return (
    <div className={`epk ${className}`} style={style}>
      <header className="epk__masthead">
        <p className="epk__kicker">New Jersey · Funktronica · Est. 2012</p>
        <Distressed className="epk__wordmark-print">
          <h1 className="epk__wordmark">
            <span>Funkadelic</span> <span>Astronaut</span>
          </h1>
        </Distressed>
      </header>
      <nav className="epk__nav" aria-label="On this page">
        <a href="#music">Listen</a>
        <a href="#live">Watch</a>
        <a href="#band">The band</a>
        <a href="#book">Book us</a>
      </nav>

      <main className="epk__sheet">
        <section className="epk__live" id="live" aria-label="Live video">
          <LiveVideo
            set={LIVE_SET}
            poster={performance}
            title={`Funkadelic Astronaut, “${LIVE_SET.caption}” live at Barrier Brewing Co.`}
            label={
              <>
                <span>Live</span> “{LIVE_SET.caption}” · Barrier Brewing Co.
              </>
            }
          />
        </section>

        <EpkBar ink="red">Funk from the future</EpkBar>

        <section className="epk__intro" aria-label="About the band">
          <div className="epk__pitch">
            <p className="epk__lede">
              A New Jersey funktronica trio: Ryan Gavin on keys, Kevin O’Neill on drums and Sam Luba on bass and vocals.
            </p>
            <p>Funk wired to electronics, with a deep pocket and room to stretch out live, on stages across the Northeast since 2012.</p>
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
          <div className="epk-record" id="music">
            <BandcampPlayer release={release} />
            <div className="epk-record__about">
              <p className="epk__small-label">Out now on Bandcamp</p>
              <h2 className="epk-record__title">{release.title}</h2>
              <p className="epk__small-label">Earlier records</p>
              <ul className="epk-record__catalog">
                {BACK_CATALOG.map(record => (
                  <li key={record.title}>
                    <span>{record.title}</span>
                    <span>{record.year}</span>
                  </li>
                ))}
              </ul>
              <p className="epk__small-label">Stream everywhere</p>
              <div className="epk-record__links">
                {[...LISTEN_LINKS, BANDCAMP_LINK].map(link => (
                  <a key={link.platform} href={link.href} target="_blank" rel="noreferrer" aria-label={link.label}>
                    <SocialIcon platform={link.platform} ink={LISTEN_INKS[link.platform] ?? 'blue'} size={34} label="" />
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="epk__bio">
            <p>
              Ryan and Kevin started the band as high school friends in 2012, and the lineup locked in when Sam joined in 2017. Since then
              they have taken their sound to stages across the Northeast, sharing bills with some of their own favorites.
            </p>
            <p>
              That sound is funk wired to electronics: a deep pocket from the rhythm section, synths and keys that take chances, and room to
              stretch out live.
            </p>
            <p>
              Their new record, <em>{release.title}</em>, came out in {release.year}, following{' '}
              {list(BACK_CATALOG.map(record => `${record.title} (${record.year})`))}.
            </p>
          </div>
        </section>

        <EpkBar ink="amber" id="band">
          Three friends. One orbit.
        </EpkBar>

        <section className="epk__band" aria-labelledby="band">
          <div className="epk__members">
            {BAND_MEMBER_PACKETS.map((member, index) => {
              const { part, ink, portrait, focus } = MEMBERS[index];
              return (
                <article key={member.name} className="epk-member" data-ink={ink}>
                  <img
                    className="epk-member__photo"
                    src={portrait}
                    alt={member.photo.alt ?? member.name}
                    loading="lazy"
                    style={{ objectPosition: focus }}
                  />
                  <div className="epk-member__text">
                    <h3>
                      {member.name}
                      <small>{part}</small>
                    </h3>
                    {member.card.children}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <footer className="epk-spec" id="book" aria-label="Booking">
          <div className="epk-spec__name">
            <span>Funkadelic</span> <span>Astronaut</span>
          </div>
          <dl className="epk-spec__fact epk-spec__from">
            <dt>From</dt>
            <dd>New Jersey</dd>
          </dl>
          <dl className="epk-spec__fact epk-spec__lineup">
            <dt>Lineup</dt>
            <dd>Keys · drums · bass · vox</dd>
          </dl>
          <BookingLine className="epk-spec__book" />
          <div className="epk-spec__social">
            {SOCIAL_LINKS.map(link => (
              <a key={link.platform} href={link.href} target="_blank" rel="noreferrer" aria-label={link.label}>
                <SocialIcon platform={link.platform} ink="black" print="flat" paper="transparent" size={26} label="" worn={false} />
              </a>
            ))}
          </div>
        </footer>
        <div className="epk__border" aria-hidden="true" />
      </main>
    </div>
  );
}
