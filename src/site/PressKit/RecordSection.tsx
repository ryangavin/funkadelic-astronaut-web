import { useId, useRef, useState } from 'react';
import { BANDCAMP_HREF, LISTEN_HREFS } from '../../content/links';
import { EARLIER_RELEASES, type BandcampRelease } from '../../content/releases';
import { list, SHARED_STAGES } from '../../content/stages';
import { Copy, t } from '../../i18n/copy';
import { BandcampPlayer } from './BandcampPlayer';
import { IconLinks } from './IconLinks';
import type { PressKitInk } from './inks';
import '../styles/newsprint.css';
import './RecordSection.css';

/** The ribbon over each record in the list, newest first, as the members' columns are ruled. */
const RECORD_INKS: PressKitInk[] = ['violet', 'lime', 'pink', 'periwinkle', 'orange'];

/**
 * The record: Bandcamp's player in its own column, the heading, the streaming
 * links and the story beside it, and every record in a row underneath. Pressing
 * a record puts it in the player.
 */
export function RecordSection({ release }: { release: BandcampRelease }) {
  // The record in the player: the new one until a reader picks another from the list under the story.
  const [playing, setPlaying] = useState(release);
  const records = [release, ...EARLIER_RELEASES];
  const player = useRef<HTMLDivElement>(null);
  // The section is a region named by its own heading.
  const headingId = useId();
  const play = (record: BandcampRelease) => {
    setPlaying(record);
    // Stacked on a phone, the list is below the player: bring the player back into view.
    const top = player.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) player.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  return (
    <section className="epk-record" id="music" aria-labelledby={headingId}>
      <div className="epk-record__player" ref={player}>
        <BandcampPlayer release={playing} fit />
      </div>
      <div className="epk-record__story">
        <div className="epk-record__head">
          <h2 className="epk-record__title epk-headline" id={headingId}>
            {t('pressKit.record.heading')}
          </h2>
          <IconLinks className="epk-record__links" links={[...LISTEN_HREFS, BANDCAMP_HREF]} />
        </div>
        <div className="epk__bio epk-copy">
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
              <span className="epk-record__name epk-ribbon">
                <span className="epk-headline">{record.title}</span> <span>({record.year})</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
