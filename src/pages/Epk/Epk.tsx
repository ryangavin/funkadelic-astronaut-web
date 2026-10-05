import type React from 'react';
import festivalMap from '../../../assets/festival-map.webp';
import performance from '../../../assets/performance.webp';
import { SocialIcon } from '../../components/2D/SocialIcon/SocialIcon';
import { Distressed } from '../../foundations/Distressed/Distressed';
import { BAND_MEMBER_PACKETS, LIVE_SET } from '../../sections/BandDossier/bandMembers';
import { SHARED_STAGES } from '../../sections/BandDossier/bandOneSheet';
import { nextShow, showLine } from '../Arrival/links';
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

/** The next real date, or that new ones are coming. */
const nextShowLine = (today = new Date()) => {
  const show = nextShow(today);
  return show ? showLine(show) : 'New dates soon';
};

const list = (names: string[]) => `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

/** Each member's part, and the ink their block is framed in. */
const MEMBERS = [
  { part: 'Keys', ink: 'red' },
  { part: 'Drums', ink: 'green' },
  { part: 'Bass & vocals', ink: 'purple' },
] as const satisfies { part: string; ink: EpkInk }[];

/** A headline bar: bold caps on a band of one ink, ruled in black, as the poster's sections are introduced. */
export function EpkBar({ ink, as: Heading = 'h2', id, children }: { ink: EpkInk; as?: 'h2' | 'h3'; id?: string; children: React.ReactNode }) {
  return (
    <Heading className="epk-bar" data-ink={ink} id={id}>
      <span>{children}</span>
    </Heading>
  );
}

/** A photograph printed as the poster prints them: one ink, coarse halftone. */
export function EpkPhoto({ src, alt, focus = '50% 50%', className = '' }: { src: string; alt: string; focus?: string; className?: string }) {
  return (
    <figure className={`epk-photo ${className}`}>
      <img src={src} alt={alt} loading="lazy" style={{ objectPosition: focus }} />
    </figure>
  );
}

export type EpkProps = {
  /** The record in the Bandcamp card. */
  release?: BandcampRelease;
  /** Today, for the next show in the spec strip. */
  today?: Date;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * The press kit as one printed poster: a masthead, headline bars in the
 * site's inks, the bio beside the live shot, a framed block for each of the
 * three, the record in Bandcamp's player, a live video and a spec strip of the
 * things a booker needs. Wide, it is laid out like the poster; narrower, the
 * columns stack in reading order.
 */
export function Epk({ release = FEATURED_RELEASE, today, className = '', style }: EpkProps) {
  return (
    <div className={`epk ${className}`} style={style}>
      <header className="epk__masthead">
        <p className="epk__kicker">New Jersey · Funktronica · Est. 2012</p>
        <Distressed className="epk__wordmark-print">
          <h1 className="epk__wordmark">
            <span>Funkadelic</span> <span>Astronaut</span>
          </h1>
        </Distressed>
        <nav className="epk__nav" aria-label="On this page">
          <a href="#music">Listen</a>
          <a href="#live">Watch</a>
          <a href="#band">The band</a>
          <a href={BOOKING_HREF}>Book us</a>
        </nav>
      </header>

      <main className="epk__sheet">
        <EpkBar ink="red">Funk, meet the future</EpkBar>

        <section className="epk__hero" aria-label="About the band">
          <div className="epk__bio">
            <p className="epk__lede">
              Funkadelic Astronaut is a New Jersey funktronica trio: Ryan Gavin on keyboards, Kevin O’Neill on drums and Sam Luba on bass
              and vocals.
            </p>
            <p>
              Ryan and Kevin started the band as high school friends in 2012, and the lineup locked in when Sam joined in 2017. Since then
              they have taken their sound to stages across the Northeast.
            </p>
            <p>
              That sound is funk wired to electronics: a deep pocket from the rhythm section, synths and keys that take chances, and room to
              stretch out live. Along the way they have shared bills with some of their own favorites, among them <strong>{list(SHARED_STAGES)}</strong>.
            </p>
            <p>
              Their new record, <em>{release.title}</em>, came out in {release.year}, following{' '}
              {list(BACK_CATALOG.map(record => `${record.title} (${record.year})`))}.
            </p>
          </div>
          <EpkPhoto className="epk__hero-photo" src={performance} alt="Funkadelic Astronaut performing live" focus="50% 40%" />
        </section>

        <EpkBar ink="amber" id="band">Three friends. One orbit.</EpkBar>

        <div className="epk__body">
          <section className="epk__members" aria-labelledby="band">
            {BAND_MEMBER_PACKETS.map((member, index) => {
              const { part, ink } = MEMBERS[index];
              return (
                <article key={member.name} className="epk-member" data-ink={ink}>
                  <EpkPhoto className="epk-member__photo" src={member.photo.src ?? ''} alt={member.photo.alt ?? member.name} focus={member.photo.focus} />
                  <div className="epk-member__text">
                    <h3>
                      {member.name}
                      <small>{part}</small>
                    </h3>
                    {member.card.children}
                    {member.facts?.length ? (
                      <ul>
                        {member.facts.map((fact, factIndex) => (
                          <li key={factIndex}>{fact}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="epk-record" id="music" aria-label="Listen">
            <p className="epk-record__label">Out now on Bandcamp</p>
            <h2 className="epk-record__title">{release.title}</h2>
            <BandcampPlayer release={release} />
            <ul className="epk-record__catalog" aria-label="Earlier records">
              {BACK_CATALOG.map(record => (
                <li key={record.title}>
                  <span>{record.title}</span>
                  <span>{record.year}</span>
                </li>
              ))}
            </ul>
            <div className="epk-record__links">
              {[...LISTEN_LINKS, BANDCAMP_LINK].map(link => (
                <a key={link.platform} href={link.href} target="_blank" rel="noreferrer" aria-label={link.label}>
                  <SocialIcon platform={link.platform} ink={LISTEN_INKS[link.platform] ?? 'blue'} size={34} label="" />
                </a>
              ))}
            </div>
          </aside>
        </div>

        <EpkBar ink="blue" id="live">
          Live: “{LIVE_SET.caption}” at Barrier Brewing Co.
        </EpkBar>
        <section className="epk__live" aria-labelledby="live">
          <LiveVideo set={LIVE_SET} poster={performance} title={`Funkadelic Astronaut, “${LIVE_SET.caption}” live at Barrier Brewing Co.`} />
        </section>

        <footer className="epk-spec" aria-label="Booking">
          <div className="epk-spec__cell epk-spec__cell--name">
            <span>Funkadelic</span>
            <span>Astronaut</span>
          </div>
          <dl className="epk-spec__cell">
            <dt>From</dt>
            <dd>New Jersey</dd>
          </dl>
          <dl className="epk-spec__cell">
            <dt>Lineup</dt>
            <dd>Keys · drums · bass · vox</dd>
          </dl>
          <dl className="epk-spec__cell">
            <dt>Next show</dt>
            <dd>{nextShowLine(today)}</dd>
          </dl>
          <dl className="epk-spec__cell epk-spec__cell--book">
            <dt>Booking</dt>
            <dd>
              <a href={BOOKING_HREF}>{BOOKING_EMAIL}</a>
            </dd>
          </dl>
          <div className="epk-spec__cell epk-spec__cell--social">
            {SOCIAL_LINKS.map(link => (
              <a key={link.platform} href={link.href} target="_blank" rel="noreferrer" aria-label={link.label}>
                <SocialIcon platform={link.platform} ink="black" print="flat" paper="transparent" size={30} label="" worn={false} />
              </a>
            ))}
          </div>
        </footer>
        <div className="epk__border" style={{ backgroundImage: `url(${festivalMap})` }} aria-hidden="true" />
      </main>
    </div>
  );
}
