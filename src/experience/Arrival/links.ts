import { BOOKING_HREF, SOCIAL_HREFS } from '../../content/links';
import { TOUR_DATES } from '../../components/2D/TourPass/TourPass.data';

/**
 * Where the header can take you. Some of these never leave the desk — they go
 * to the thing on it that already does the job, and pick it up — and the rest
 * leave the site for somewhere that does it better.
 */
export type ArrivalLinkId = 'listen' | 'watch' | 'shows' | 'press' | 'book';

export type ArrivalLink = {
  id: ArrivalLinkId;
  label: string;
  /** The thing on the desk this goes to, by its place id. */
  object?: string;
  href?: string;
};

const BANDSINTOWN = SOCIAL_HREFS.find(link => link.platform === 'bandsintown')!.href;

export const ARRIVAL_LINKS: ArrivalLink[] = [
  { id: 'listen', label: 'Listen', object: 'walkman' },
  { id: 'watch', label: 'Watch', object: 'handheld' },
  { id: 'shows', label: 'Shows', href: BANDSINTOWN },
  { id: 'press', label: 'Press kit' },
  { id: 'book', label: 'Book us', href: BOOKING_HREF },
];

/**
 * The next real date: one with somewhere to send people. The passes also carry
 * a fictional date from the design universe, which has no link and is left out.
 */
export function nextShow(today = new Date()) {
  const day = today.toISOString().slice(0, 10);
  return TOUR_DATES.filter(date => date.actionHref && date.dateTime >= day).sort((a, b) => a.dateTime.localeCompare(b.dateTime))[0];
}

/** "Sat Sep 26 · Nyack", for a strip too small for the whole venue. */
export function showLine(show = nextShow()) {
  if (!show) return 'New dates soon';
  return `${show.weekday} ${show.month} ${Number(show.day)} · ${show.city.split(',')[0]}`;
}
