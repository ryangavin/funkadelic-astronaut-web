import type React from 'react';
import { useRef, useState } from 'react';
import kevinPortrait from '../../../assets/epk/kevin-portrait-900.webp';
import ryanPortrait from '../../../assets/epk/ryan-portrait-900.webp';
import samPortrait from '../../../assets/epk/sam-portrait-900.webp';
import liveLoop from '../../../assets/epk/live-loop.mp4';
import livePoster from '../../../assets/epk/live-poster.webp';
import { Weathered } from '../../behaviors/Weathered/Weathered';
import { SOCIAL_PLATFORMS, SocialIcon } from '../../components/2D/SocialIcon/SocialIcon';
import { Distressed } from '../../foundations/Distressed/Distressed';
import { Inkjet } from '../../foundations/Inkjet/Inkjet';
import { BAND_MEMBER_PACKETS, LIVE_SET } from '../../sections/BandDossier/bandMembers';
import { SHARED_STAGES } from '../../sections/BandDossier/bandOneSheet';
import { BANDCAMP_LINK, BOOKING_HREF, LISTEN_LINKS, SOCIAL_LINKS, type HomeLink } from '../Home/Home';
import { BandcampPlayer, EARLIER_RELEASES, FEATURED_RELEASE, type BandcampRelease } from './BandcampPlayer';
import { LiveVideo } from './LiveVideo';
import { Nameplate } from './Nameplate';
import '../../styles/fonts.css';
import '../../styles/torn-edge.css';
import './Epk.css';

/** The spot inks, sampled from the cover of Time to Save the Universe. */
export type EpkInk = 'violet' | 'lavender' | 'periwinkle' | 'pink' | 'lime' | 'orange';

/** A platform's mark printed in the night ink, taking the platform's own colour while it is pointed at or focused. */
function IconLink({ link }: { link: HomeLink }) {
  return (
    <a
      className="epk-icon"
      href={link.href}
      target="_blank"
      rel="noreferrer"
      aria-label={link.label}
      style={{ '--epk-brand': SOCIAL_PLATFORMS[link.platform].brand } as React.CSSProperties}
    >
      <SocialIcon platform={link.platform} ink="var(--epk-icon-ink)" print="flat" paper="transparent" size={30} label="" />
    </a>
  );
}

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

/** The ribbon over each record in the list, newest first, as the members' columns are ruled. */
const RECORD_INKS: EpkInk[] = ['violet', 'lime', 'pink', 'periwinkle', 'orange'];

/** The page's own links, each a tab in its own spot ink. */
const NAV_LINKS = [
  { href: '#music', label: 'Listen', ink: 'violet' },
  { href: '#live', label: 'Watch', ink: 'periwinkle' },
  { href: '#band', label: 'The band', ink: 'lime' },
  { href: '#book', label: 'Book us', ink: 'pink' },
] as const satisfies { href: string; label: string; ink: EpkInk }[];

export type EpkProps = {
  /** The record in the Bandcamp card. */
  release?: BandcampRelease;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * The press kit as one sheet of newsprint laid on the Mission Control
 * festival poster: a dateline and nameplate, the live set as the front-page
 * picture, the pitch, the record beside its story in ruled columns, the three
 * of them, and a way to book the band at the foot, with every place to find
 * them. The sheet is weathered stock; colour only arrives as spot inks run on
 * it. Wide it runs on one twelve-column grid, narrower it stacks in that same
 * order.
 */
export function Epk({ release = FEATURED_RELEASE, className = '', style }: EpkProps) {
  // The record in the player: the new one until a reader picks another from the list under the story.
  const [playing, setPlaying] = useState(release);
  const records = [release, ...EARLIER_RELEASES];
  const player = useRef<HTMLDivElement>(null);
  const play = (record: BandcampRelease) => {
    setPlaying(record);
    // Stacked on a phone, the list is below the player: bring the player back into view.
    const top = player.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) player.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  return (
    <div className={`epk ${className}`} style={style}>
      <Weathered as="article" className="epk__paper torn-edge" patina flecks grain wear>
        <header className="epk__masthead">
          <p className="epk__dateline">
            <span>Vol. 7 No. 42</span>
            <span>New Jersey · Future rock</span>
            <span>Est. 2012 · Always free</span>
          </p>
          <Distressed className="epk__wordmark-print">
            <h1 className="epk__wordmark">
              <Nameplate />
            </h1>
          </Distressed>
          <nav className="epk__nav" aria-label="On this page">
            {NAV_LINKS.map(link => (
              <a key={link.href} href={link.href} data-ink={link.ink}>
                {link.label}
              </a>
            ))}
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

          <EpkBar ink="violet">{release.title}</EpkBar>

          <p className="epk__lede">
            NJ trio ft. Ryan Gavin, Kevin O’Neill, and Sam Luba <strong>blast off</strong>
          </p>

          <section className="epk-record" id="music" aria-label="Records">
            <div className="epk-record__player" ref={player}>
              <BandcampPlayer release={playing} fit />
            </div>
            <div className="epk-record__story">
              <div className="epk-record__head">
                <h2 className="epk-record__title">Future rock</h2>
                <div className="epk-record__links">
                  {[...LISTEN_LINKS, BANDCAMP_LINK].map(link => (
                    <IconLink key={link.platform} link={link} />
                  ))}
                </div>
              </div>
              <div className="epk__bio">
                <p>
                  Ryan and Kevin started the band as high school friends in 2012, and the lineup locked in when Sam joined in 2017. Since
                  then they have taken their sound to stages across the Northeast, sharing bills with some of their own favorites:{' '}
                  {list(SHARED_STAGES)}.
                </p>
                <p>
                  That sound is funk wired to electronics: a deep pocket from the rhythm section, synths and keys that take chances, and
                  room to stretch out live.
                </p>
                <p>
                  Their new record, <em>{release.title}</em>, came out in {release.year}, following{' '}
                  {list(EARLIER_RELEASES.map(record => `${record.title} (${record.year})`))}.
                </p>
              </div>
            </div>
            <ul className="epk-record__catalog" aria-label="Records: press one to play it">
              {records.map((record, index) => (
                <li key={record.albumId} data-ink={RECORD_INKS[index % RECORD_INKS.length]}>
                  <button type="button" aria-pressed={record === playing} onClick={() => play(record)}>
                    <span className="epk-record__name">
                      <span>{record.title}</span> <span>({record.year})</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
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
                <IconLink key={link.platform} link={link} />
              ))}
            </div>
          </footer>
        </main>
      </Weathered>
    </div>
  );
}
