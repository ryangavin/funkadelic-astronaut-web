/** A Bandcamp release as the band has it on its page. The album id comes from Bandcamp's own Share / Embed dialog. */
export type BandcampRelease = {
  title: string;
  /** The numeric album id Bandcamp's player is addressed by. */
  albumId: string;
  /** The release's page on the band's Bandcamp. */
  href: string;
  /** How many tracks, so the player is tall enough to list them all without scrolling. */
  tracks: number;
  year: string;
};

const album = (slug: string) => `https://funkadelicastronaut.bandcamp.com/album/${slug}`;

/** The release the press kit features. */
export const FEATURED_RELEASE: BandcampRelease = {
  title: 'Time to Save the Universe',
  albumId: '2034305585',
  href: album('time-to-save-the-universe'),
  tracks: 7,
  year: '2026',
};

/** The studio records before it, newest first, as they are on Bandcamp. */
export const EARLIER_RELEASES: BandcampRelease[] = [
  { title: 'Mission Control', albumId: '1493278664', href: album('mission-control'), tracks: 6, year: '2021' },
  { title: 'Magrathea', albumId: '3829388634', href: album('magrathea'), tracks: 5, year: '2018' },
  { title: 'Emergency Exit', albumId: '419773097', href: album('emergency-exit'), tracks: 3, year: '2017' },
  { title: 'Impact', albumId: '191897252', href: album('impact'), tracks: 6, year: '2013' },
];
