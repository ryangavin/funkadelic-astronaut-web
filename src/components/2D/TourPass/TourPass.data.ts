import { OLIVES_TOUR_PASS_PROPS, type TourPassColor, type TourPassProps } from './TourPass';

/** The upcoming dates as on the site's tour section: one pass each, in its own ink. */
export const NYACK_FESTIVAL_TOUR_PASS_PROPS: TourPassProps & { color: TourPassColor } = {
  dateTime: '2026-09-26',
  weekday: 'Sat',
  month: 'Sep',
  day: '26',
  tierLabel: 'GA pass',
  venue: 'Nyack Neighborhood Music & Arts Festival',
  city: 'Nyack, New York',
  location: '5 First Avenue',
  time: '6:00 PM',
  venueImageSrc: '/assets/performance.webp',
  actionLabel: 'Event details',
  actionHref: 'https://www.bandsintown.com/a/1180868',
  actionAriaLabel: 'Event details for the Nyack Neighborhood Music & Arts Festival',
  color: 'blue',
};

export const SATURN_LANES_TOUR_PASS_PROPS: TourPassProps & { color: TourPassColor } = {
  dateTime: '2026-10-03',
  weekday: 'Sat',
  month: 'Oct',
  day: '03',
  tierLabel: 'VIP pass',
  venue: 'Saturn Lanes',
  city: 'Hackensack, New Jersey',
  location: 'A bowling-alley gig from the design universe',
  time: 'Doors 8:30 PM · set 9:30 PM',
  venueImageSrc: '/assets/performance.webp',
  actionLabel: 'Mock ticket',
  actionAriaLabel: 'Mock ticket, a fictional preview',
  color: 'purple',
};

export const TOUR_DATES: (TourPassProps & { color: TourPassColor })[] = [
  { ...OLIVES_TOUR_PASS_PROPS, color: 'red' },
  NYACK_FESTIVAL_TOUR_PASS_PROPS,
  SATURN_LANES_TOUR_PASS_PROPS,
];
