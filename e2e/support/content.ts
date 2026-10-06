import catalogue from '@content/locales/en.json';

/**
 * What the tests know should exist on the page, taken from src/content so
 * they follow the band's data: who is in the band and what each plays, where
 * each link goes, which records are on offer, and who they have shared a bill
 * with. Only identities come from here, and only from modules Node can import
 * as plain TypeScript or JSON (liveSet.ts imports video files, so the live
 * set's sources are read from the page instead). Whether the site's wording
 * is right is checked by the Storybook stories, not by these tests.
 */
export { BANDCAMP_HREF, BOOKING_HREF, LISTEN_HREFS, SOCIAL_HREFS } from '@content/links';
export { MEMBERS } from '@content/members';
export { EARLIER_RELEASES, FEATURED_RELEASE } from '@content/releases';
export { SHARED_STAGES } from '@content/stages';

/** The band's name as the page prints it, which is how a visitor finds the nameplate. */
export const BAND_NAME = catalogue.pressKit.wordmark;

/** What each member plays, by member id. */
export const memberPart = (id: keyof typeof catalogue.band.members) => catalogue.band.members[id].part;

/**
 * The names of the page's sections, as their landmarks are announced: each
 * is named by the heading or call it shows. The live set is a figure, named
 * by its caption, rather than a region.
 */
export const SECTION_NAMES = {
  music: catalogue.pressKit.record.heading,
  band: catalogue.pressKit.band.heading,
  book: catalogue.pressKit.foot.book,
} as const;

/** The booking link's visible label. */
export const BOOKING_LABEL = catalogue.pressKit.foot.book;
