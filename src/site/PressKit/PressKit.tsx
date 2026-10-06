import type React from 'react';
import { Weathered } from '../../behaviors/Weathered/Weathered';
import { Distressed } from '../../foundations/Distressed/Distressed';
import '../../styles/torn-edge.css';
import { BANDCAMP_HREF, BOOKING_HREF, LISTEN_HREFS, SOCIAL_HREFS } from '../../content/links';
import { NYACK_SET } from '../../content/liveSet';
import { MEMBERS } from '../../content/members';
import { FEATURED_RELEASE, type BandcampRelease } from '../../content/releases';
import { Copy, t } from '../../i18n/copy';
import { IconLinks } from './IconLinks';
import type { PressKitInk } from './inks';
import { LiveVideo } from './LiveVideo';
import { MemberColumn } from './MemberColumn';
import { PressKitBar } from './PressKitBar';
import { RecordSection } from './RecordSection';
import '../styles/newsprint.css';
import './PressKit.css';

/** The page's own links, each a tab in its own spot ink; the label is the catalogue's `nav.<id>`. */
const NAV_LINKS = [
  { id: 'music', ink: 'violet' },
  { id: 'live', ink: 'periwinkle' },
  { id: 'band', ink: 'lime' },
  { id: 'book', ink: 'pink' },
] as const satisfies { id: string; ink: PressKitInk }[];

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
 * `pressKit` and `band` namespaces; its design tokens from ../styles/tokens.css.
 */
export function PressKit({ release = FEATURED_RELEASE, className = '', style }: PressKitProps) {
  const live = { song: NYACK_SET.song, event: NYACK_SET.event };
  return (
    <div className={`epk ${className}`} style={style}>
      <Weathered as="article" className="epk__paper torn-edge" patina flecks grain wear>
        <header className="epk__masthead">
          <p className="epk__dateline epk-label">
            <span>{t('pressKit.dateline.issue')}</span>
            <span>{t('pressKit.dateline.place')}</span>
            <span>{t('pressKit.dateline.since')}</span>
          </p>
          <Distressed className="epk-print">
            <h1 className="epk__wordmark">{t('pressKit.wordmark')}</h1>
          </Distressed>
          <nav className="epk__nav" aria-label={t('pressKit.nav.label')}>
            {NAV_LINKS.map(link => (
              <a key={link.id} className="epk-headline" href={`#${link.id}`} data-ink={link.ink}>
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

          <RecordSection release={release} />

          <PressKitBar ink="pink" id="band">
            {t('pressKit.band.heading')}
          </PressKitBar>

          <section className="epk__members" aria-labelledby="band">
            {MEMBERS.map(member => (
              <MemberColumn key={member.id} id={member.id} name={member.name} />
            ))}
          </section>

          <footer className="epk-foot" id="book" aria-label={t('pressKit.foot.label')}>
            <a className="epk-foot__book epk-headline" href={BOOKING_HREF}>
              {t('pressKit.foot.book')}
            </a>
            <IconLinks className="epk-foot__links" links={[...SOCIAL_HREFS, ...LISTEN_HREFS, BANDCAMP_HREF]} />
          </footer>
        </main>
      </Weathered>
    </div>
  );
}
