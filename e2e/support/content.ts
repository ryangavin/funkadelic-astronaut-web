import { readFileSync } from 'node:fs';
import { basename, extname, resolve } from 'node:path';

/**
 * What the tests know should exist on the page, taken from src/content so
 * they follow the band's data: who is in the band, where each link goes, and
 * which records and video are on offer. Only identities come from here. The
 * site's wording is checked by the Storybook stories, not by these tests.
 */
export { BANDCAMP_HREF, BOOKING_HREF, LISTEN_HREFS, SOCIAL_HREFS } from '../../src/content/links';
export { MEMBERS } from '../../src/content/members';
export { EARLIER_RELEASES, FEATURED_RELEASE } from '../../src/content/releases';

/**
 * The file name (without Vite's hash or extension) of the whole live set.
 * src/content/liveSet.ts imports its videos as files, which Node cannot load,
 * so the import it uses for `video` is read from the source instead.
 */
export function liveSetVideoName(): string {
  const source = readFileSync(resolve(__dirname, '../../src/content/liveSet.ts'), 'utf8');
  const binding = /\bvideo:\s*(\w+)/.exec(source)?.[1];
  const path = binding && new RegExp(`import\\s+${binding}\\s+from\\s+'([^']+)'`).exec(source)?.[1];
  if (!path) throw new Error('Could not find the live set video in src/content/liveSet.ts');
  return basename(path, extname(path));
}
