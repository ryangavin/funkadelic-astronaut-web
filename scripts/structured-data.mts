import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { BANDCAMP_HREF, BOOKING_HREF, LISTEN_HREFS, SOCIAL_HREFS } from '../src/content/links.ts';
import catalogue from '../src/content/locales/en.json' with { type: 'json' };
import { MEMBERS } from '../src/content/members.ts';
import { EARLIER_RELEASES, FEATURED_RELEASE } from '../src/content/releases.ts';
import { list, SHARED_STAGES } from '../src/content/stages.ts';

/**
 * Describes the band to machines from what the site already says, so it never drifts from src/content:
 *
 * - the press kit's head gets a schema.org `MusicGroup` in JSON-LD, for search engines;
 * - the build gets /llms.txt (https://llmstxt.org), a short Markdown summary for language models.
 *
 * The name, address and picture come from index.html's own `og:site_name`, canonical link and `og:image`; the
 * members, their parts and start years, the genre, where they are, the bio, the records and every link from
 * src/content.
 */
export function structuredData(): Plugin {
  let indexHtml = '';
  return {
    name: 'structured-data',
    configResolved(config) {
      indexHtml = resolve(config.root, 'index.html');
    },
    transformIndexHtml(html, { filename }) {
      // Only the press kit; not Storybook's or Vitest's own pages.
      if (resolve(filename) !== indexHtml) return html;
      // `<` is escaped so no value can close the script element.
      const json = JSON.stringify(musicGroup(headOf(html)), null, 2).replace(/</g, '\\u003c');
      return html.replace('</head>', () => `  <script type="application/ld+json">\n${json}\n    </script>\n  </head>`);
    },
    generateBundle(_options, bundle) {
      // The live set is a hashed build asset, so its address is only known here.
      const liveSet = Object.values(bundle).find(
        file => file.type === 'asset' && file.originalFileNames.some(name => name.endsWith('assets/epk/nyack-set.mp4')),
      );
      if (!liveSet) throw new Error('structured-data: the build has no live set video (assets/epk/nyack-set.mp4)');
      const head = headOf(readFileSync(indexHtml, 'utf8'));
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: llmsTxt(head, new URL(liveSet.fileName, head.url).href) });
    },
  };
}

type Head = { name: string; url: string; image: string };

/** The band's name, address and picture, as index.html's head gives them. */
function headOf(html: string): Head {
  const value = (pattern: RegExp, what: string) => {
    const found = html.match(pattern)?.[1];
    if (!found) throw new Error(`structured-data: index.html's head has no ${what}`);
    return found;
  };
  return {
    name: value(/<meta property="og:site_name" content="([^"]+)"/, 'og:site_name'),
    url: value(/<link rel="canonical" href="([^"]+)"/, 'canonical link'),
    image: value(/<meta property="og:image" content="([^"]+)"/, 'og:image'),
  };
}

// The dateline reads "<where they are> · <genre>".
const [LOCATION, GENRE] = catalogue.pressKit.dateline.place.split(' · ');
const FOUNDED = Math.min(...MEMBERS.map(member => member.since));
const PROFILES = [BANDCAMP_HREF, ...LISTEN_HREFS, ...SOCIAL_HREFS];

function musicGroup(head: Head) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    ...head,
    genre: GENRE,
    location: { '@type': 'Place', name: LOCATION },
    foundingDate: String(FOUNDED),
    member: MEMBERS.map(({ id, name, since }) => ({
      '@type': 'OrganizationRole',
      member: { '@type': 'Person', name },
      roleName: catalogue.band.members[id].part,
      startDate: String(since),
    })),
    sameAs: PROFILES.map(link => link.href),
  };
}

/** A line of the copy catalogue as plain text: `{{placeholders}}` filled in, inline markup dropped. */
const plain = (copy: string, values: Record<string, string> = {}) =>
  copy.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] ?? '').replace(/<[^>]+>/g, '');

function llmsTxt(head: Head, liveSetUrl: string) {
  const bio = catalogue.pressKit.record.bio;
  const earlier = EARLIER_RELEASES.map(({ title, year }) => plain(catalogue.pressKit.record.earlier, { title, year }));
  const { title, year } = FEATURED_RELEASE;
  const bookingEmail = BOOKING_HREF.replace(/^mailto:/, '').split('?')[0];
  return `# ${head.name}

> ${LOCATION} ${GENRE.toLowerCase()} trio, together since ${FOUNDED}: ${list(MEMBERS.map(member => member.name))}.

## About

${plain(bio.start, { stages: list(SHARED_STAGES) })} ${plain(bio.sound)} ${plain(bio.records, { title, year, earlier: list(earlier) })}

## Members

${MEMBERS.map(({ id, name, since }) => `- ${name}: ${catalogue.band.members[id].part} (since ${since})`).join('\n')}

## Links

- [Press kit](${head.url}): bio, music, live video and booking
- [Booking: ${bookingEmail}](${BOOKING_HREF})
- [Live set video](${liveSetUrl})
${PROFILES.map(link => `- [${catalogue.band.links[link.platform]}](${link.href})`).join('\n')}

## Releases

${[FEATURED_RELEASE, ...EARLIER_RELEASES].map(release => `- [${release.title}](${release.href}) (${release.year})`).join('\n')}
`;
}
