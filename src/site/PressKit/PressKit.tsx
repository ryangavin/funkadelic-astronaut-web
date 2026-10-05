import type React from 'react';
import { useRef, useState } from 'react';
import kevinPortrait from '../../../assets/epk/kevin-portrait-900.webp';
import ryanPortrait from '../../../assets/epk/ryan-portrait-900.webp';
import samPortrait from '../../../assets/epk/sam-portrait-900.webp';
import { Weathered } from '../../behaviors/Weathered/Weathered';
import { SOCIAL_PLATFORMS, SocialIcon } from '../../components/2D/SocialIcon/SocialIcon';
import { BANDCAMP_HREF, BOOKING_HREF, LISTEN_HREFS, SOCIAL_HREFS, type BandPlatform } from '../../content/links';
import { NYACK_SET } from '../../content/liveSet';
import { MEMBERS, type MemberId } from '../../content/members';
import { EARLIER_RELEASES, FEATURED_RELEASE, type BandcampRelease } from '../../content/releases';
import { list, SHARED_STAGES } from '../../content/stages';
import { Distressed } from '../../foundations/Distressed/Distressed';
import { Inkjet } from '../../foundations/Inkjet/Inkjet';
import { Copy, t } from '../../i18n/copy';
import { BandcampPlayer } from './BandcampPlayer';
import { LiveVideo } from './LiveVideo';
import '../../styles/fonts.css';
import '../../styles/torn-edge.css';
import './PressKit.css';

/** The spot inks, sampled from the cover of Time to Save the Universe. */
export type PressKitInk = 'violet' | 'lavender' | 'periwinkle' | 'pink' | 'lime' | 'orange';

/** A platform's mark printed in the night ink, taking the platform's own colour while it is pointed at or focused. */
function IconLink({ link }: { link: { platform: BandPlatform; href: string } }) {
  return (
    <a
      className="epk-icon"
      href={link.href}
      target="_blank"
      rel="noreferrer"
      aria-label={t(`band.links.${link.platform}`)}
      style={{ '--epk-brand': SOCIAL_PLATFORMS[link.platform].brand } as React.CSSProperties}
    >
      <SocialIcon platform={link.platform} ink="var(--epk-icon-ink)" print="flat" paper="transparent" size={30} label="" />
    </a>
  );
}

/** Each member's spot ink their column is ruled in, and their stage portrait. */
const MEMBER_PRINTS = {
  ryan: { ink: 'periwinkle', portrait: ryanPortrait, focus: '35% 30%' },
  kevin: { ink: 'lime', portrait: kevinPortrait, focus: '62% 30%' },
  sam: { ink: 'pink', portrait: samPortrait, focus: '25% 40%' },
} as const satisfies Record<MemberId, { ink: PressKitInk; portrait: string; focus: string }>;

/** A headline bar: heavy caps reversed out of a band of one spot ink, as the paper's two big sections are introduced. */
export function PressKitBar({ ink, id, children }: { ink: PressKitInk; id?: string; children: React.ReactNode }) {
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
const RECORD_INKS: PressKitInk[] = ['violet', 'lime', 'pink', 'periwinkle', 'orange'];

/** The page's own links, each a tab in its own spot ink; the label is the catalogue's `nav.<id>`. */
const NAV_LINKS = [
  { id: 'music', ink: 'violet' },
  { id: 'live', ink: 'periwinkle' },
  { id: 'band', ink: 'lime' },
  { id: 'book', ink: 'pink' },
] as const satisfies { id: string; ink: PressKitInk }[];

/** One member's column: their portrait, name and part, and their bio from the catalogue. */
function MemberColumn({ id, name }: { id: MemberId; name: string }) {
  const { ink, portrait, focus } = MEMBER_PRINTS[id];
  return (
    <article className="epk-member" data-ink={ink}>
      <Inkjet className="epk-member__print">
        <img className="epk-member__photo" src={portrait} alt={t(`band.members.${id}.photoAlt`)} loading="lazy" style={{ objectPosition: focus }} />
      </Inkjet>
      <h3>
        {name}
        <small>{t(`band.members.${id}.part`)}</small>
      </h3>
      {t(`band.members.${id}.bio`).map(paragraph => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </article>
  );
}

export type PressKitProps = {
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
 * order. Its words come from the copy catalogue (src/content/locales/en.json),
 * `pressKit` and `band` namespaces.
 */
export function PressKit({ release = FEATURED_RELEASE, className = '', style }: PressKitProps) {
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
  const live = { song: NYACK_SET.song, event: NYACK_SET.event };
  return (
    <div className={`epk ${className}`} style={style}>
      <Weathered as="article" className="epk__paper torn-edge" patina flecks grain wear>
        <header className="epk__masthead">
          <p className="epk__dateline">
            <span>{t('pressKit.dateline.issue')}</span>
            <span>{t('pressKit.dateline.place')}</span>
            <span>{t('pressKit.dateline.since')}</span>
          </p>
          <Distressed className="epk__wordmark-print">
            <h1 className="epk__wordmark">{t('pressKit.wordmark')}</h1>
          </Distressed>
          <nav className="epk__nav" aria-label={t('pressKit.nav.label')}>
            {NAV_LINKS.map(link => (
              <a key={link.id} href={`#${link.id}`} data-ink={link.ink}>
                {t(`pressKit.nav.${link.id}`)}
              </a>
            ))}
          </nav>
        </header>

        <main className="epk__sheet">
          <figure className="epk__live" id="live">
            <LiveVideo
              video={NYACK_SET.video}
              loop={NYACK_SET.loop}
              poster={NYACK_SET.poster}
              title={t('pressKit.live.title', live)}
              label={<Copy k="pressKit.live.label" values={live} />}
            />
            <figcaption>
              <Copy k="pressKit.live.caption" values={live} />
            </figcaption>
          </figure>

          <PressKitBar ink="violet">{release.title}</PressKitBar>

          <p className="epk__lede">
            <Copy k="pressKit.lede" />
          </p>

          <section className="epk-record" id="music" aria-label={t('pressKit.record.label')}>
            <div className="epk-record__player" ref={player}>
              <BandcampPlayer release={playing} fit />
            </div>
            <div className="epk-record__story">
              <div className="epk-record__head">
                <h2 className="epk-record__title">{t('pressKit.record.heading')}</h2>
                <div className="epk-record__links">
                  {[...LISTEN_HREFS, BANDCAMP_HREF].map(link => (
                    <IconLink key={link.platform} link={link} />
                  ))}
                </div>
              </div>
              <div className="epk__bio">
                <p>{t('pressKit.record.bio.start', { stages: list(SHARED_STAGES) })}</p>
                <p>{t('pressKit.record.bio.sound')}</p>
                <p>
                  <Copy
                    k="pressKit.record.bio.records"
                    values={{
                      title: release.title,
                      year: release.year,
                      earlier: list(EARLIER_RELEASES.map(record => t('pressKit.record.earlier', { title: record.title, year: record.year }))),
                    }}
                  />
                </p>
              </div>
            </div>
            <ul className="epk-record__catalog" aria-label={t('pressKit.record.catalog')}>
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

          <PressKitBar ink="pink" id="band">
            {t('pressKit.band.heading')}
          </PressKitBar>

          <section className="epk__members" aria-labelledby="band">
            {MEMBERS.map(member => (
              <MemberColumn key={member.id} id={member.id} name={member.name} />
            ))}
          </section>

          <footer className="epk-foot" id="book" aria-label={t('pressKit.foot.label')}>
            <a className="epk-foot__book" href={BOOKING_HREF}>
              {t('pressKit.foot.book')}
            </a>
            <div className="epk-foot__links">
              {[...SOCIAL_HREFS, ...LISTEN_HREFS, BANDCAMP_HREF].map(link => (
                <IconLink key={link.platform} link={link} />
              ))}
            </div>
          </footer>
        </main>
      </Weathered>
    </div>
  );
}
