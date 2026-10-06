/**
 * What the tests know should exist on the page, taken from src/content so
 * they follow the band's data: who is in the band, where each link goes, and
 * which records are on offer. Only identities come from here, and only from
 * modules Node can import as plain TypeScript (liveSet.ts imports video files,
 * so the live set's sources are read from the page instead). The site's
 * wording is checked by the Storybook stories, not by these tests.
 */
export { BANDCAMP_HREF, BOOKING_HREF, LISTEN_HREFS, SOCIAL_HREFS } from '../../src/content/links';
export { MEMBERS } from '../../src/content/members';
export { EARLIER_RELEASES, FEATURED_RELEASE } from '../../src/content/releases';
