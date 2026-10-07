import type { SocialPlatform } from '../components/2D/SocialIcon/SocialIcon';

/**
 * Everywhere the band can be found, by platform. The label each link is read
 * out with lives in the copy catalogue, under `band:links.<platform>`.
 */
type BandLinkData = { platform: SocialPlatform; href: string };

/** Where to listen. */
export const LISTEN_HREFS = [
  { platform: 'applemusic', href: 'https://music.apple.com/us/artist/funkadelic-astronaut/1208229110' },
  { platform: 'spotify', href: 'https://open.spotify.com/artist/5qpVp5gTB9QXi38qTyJ6oe' },
  { platform: 'youtube', href: 'https://www.youtube.com/@funkadelicastronaut' },
  { platform: 'deezer', href: 'https://www.deezer.com/artist/11985446' },
] as const satisfies BandLinkData[];

/** Where to follow them, and where their dates are listed. */
export const SOCIAL_HREFS = [
  { platform: 'instagram', href: 'https://www.instagram.com/funkadelicastronaut/' },
  { platform: 'facebook', href: 'https://www.facebook.com/funkadelicastronaut' },
  { platform: 'bandsintown', href: 'https://www.bandsintown.com/a/1180868' },
] as const satisfies BandLinkData[];

/** Their Bandcamp, where the records are sold. */
export const BANDCAMP_HREF = { platform: 'bandcamp', href: 'https://funkadelicastronaut.bandcamp.com/' } as const satisfies BandLinkData;

/** Every platform the band has a link on. */
export type BandPlatform = (typeof LISTEN_HREFS)[number]['platform'] | (typeof SOCIAL_HREFS)[number]['platform'] | typeof BANDCAMP_HREF.platform;

/** Where booking enquiries go: Sam. */
export const BOOKING_EMAIL ='samluba1@gmail.com';

/** Booking goes to Sam, with the subject filled in. */
export const BOOKING_HREF = `mailto:${BOOKING_EMAIL}?subject=Funkadelic%20Astronaut%20Booking`;
