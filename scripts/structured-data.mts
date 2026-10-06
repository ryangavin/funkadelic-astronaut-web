import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { GENRE, HOME } from '../src/content/band.ts';
import { BANDCAMP_HREF, BOOKING_EMAIL, BOOKING_HREF, LISTEN_HREFS, SOCIAL_HREFS } from '../src/content/links.ts';
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
 * founding year (the dateline's "Est."), members, their parts and start years, the genre and where they are
 * (band.ts), booking, the bio, the records and every link from src/content.
 *
 * It runs only in the client build of the press kit (index.html). A server-side build (`vite build --ssr`), whose
 * output has neither the page nor the live set, and Storybook's build, whose page is its own iframe.html, skip it.
 */
export function structuredData(): Plugin {
  let indexHtml = '';
  let enabled = false;
  return {
    name: 'structured-data',
    apply: 'build',
    configResolved(config) {
      indexHtml = resolve(config.root, 'index.html');
      const input = config.build.rolldownOptions?.input ?? config.build.rollupOptions?.input ?? 'index.html';
      const inputs = typeof input === 'string' ? [input] : Array.isArray(input) ? input : Object.values(input);
      enabled = !config.build.ssr && inputs.some(file => resolve(config.root, file) === indexHtml);
    },
    transformIndexHtml(html, { filename }) {
      // Only the press kit; not Storybook's or Vitest's own pages.
      if (!enabled || resolve(filename) !== indexHtml) return html;
      // `<` is escaped so no value can close the script element.
      const json = JSON.stringify(musicGroup(headOf(html)), null, 2).replace(/</g, '\\u003c');
      return html.replace('</head>', () => `  <script type="application/ld+json">\n${json}\n    </script>\n  </head>`);
    },
    generateBundle(_options, bundle) {
      if (!enabled) return;
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

// The dateline reads "Est. <year> · …".
const FOUNDED = catalogue.pressKit.dateline.since.match(/\bEst\. (\d{4})\b/)?.[1];
if (!FOUNDED) throw new Error('structured-data: the dateline (pressKit.dateline.since) no longer gives an "Est. <year>"');
const PROFILES = [BANDCAMP_HREF, ...LISTEN_HREFS, ...SOCIAL_HREFS];

/** Where the band is from, as a place: a state, with no town. */
const PLACE = {
  '@type': 'Place',
  name: HOME.name,
  address: { '@type': 'PostalAddress', addressRegion: HOME.region, addressCountry: HOME.country },
};

function musicGroup(head: Head) {
  const id = new URL('#band', head.url).href;
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    '@id': id,
    ...head,
    logo: new URL('icon-512.png', head.url).href,
    genre: GENRE,
    location: PLACE,
    foundingLocation: PLACE,
    foundingDate: FOUNDED,
    contactPoint: { '@type': 'ContactPoint', contactType: 'booking', email: BOOKING_EMAIL },
    member: MEMBERS.map(({ id: member, name, since }) => ({
      '@type': 'OrganizationRole',
      member: { '@type': 'Person', name },
      roleName: catalogue.band.members[member].part,
      startDate: String(since),
    })),
    album: [FEATURED_RELEASE, ...EARLIER_RELEASES].map(release => ({
      '@type': 'MusicAlbum',
      name: release.title,
      url: release.href,
      datePublished: release.year,
      numTracks: release.tracks,
      byArtist: { '@id': id },
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
  return `# ${head.name}

> ${HOME.name} ${GENRE.toLowerCase()} trio, founded in ${FOUNDED}: ${list(MEMBERS.map(member => member.name))}.

## About

${plain(bio.start, { stages: list(SHARED_STAGES) })} ${plain(bio.sound)} ${plain(bio.records, { title, year, earlier: list(earlier) })}

## Members

${MEMBERS.map(({ id, name, since }) => `- ${name}: ${catalogue.band.members[id].part} (since ${since})`).join('\n')}

## Links

- [Press kit](${head.url}): bio, music, live video and booking
- [Booking: ${BOOKING_EMAIL}](${BOOKING_HREF})
- [Live set video](${liveSetUrl})
${PROFILES.map(link => `- [${catalogue.band.links[link.platform]}](${link.href})`).join('\n')}

## Releases

${[FEATURED_RELEASE, ...EARLIER_RELEASES].map(release => `- [${release.title}](${release.href}) (${release.year})`).join('\n')}
`;
}
