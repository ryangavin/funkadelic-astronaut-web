import type React from 'react';
import './TourPass.css';

export type TourPassProps = {
  dateTime: string;
  weekday: string;
  month: string;
  day: string;
  tierLabel: string;
  venue: string;
  city: string;
  location: string;
  time: string;
  /** Photo of the venue, layered faintly behind the poster text. */
  venueImageSrc?: string;
  actionLabel: string;
  actionHref?: string;
  actionAriaLabel?: string;
  /** Tilt of the whole pass in degrees. Negative tilts counter-clockwise. */
  rotation?: number;
  /** Which of the site's fountain-pen inks the pass is printed in. */
  color?: TourPassColor;
};

export const TOUR_PASS_COLORS = ['red', 'blue', 'purple', 'green', 'amber'] as const;
export type TourPassColor = (typeof TOUR_PASS_COLORS)[number];
export const DEFAULT_TOUR_PASS_COLOR: TourPassColor = 'red';

export const DEFAULT_TOUR_PASS_ROTATION = -2.15;

/**
 * Every pass is the same size, so a long venue name cannot make its card taller:
 * it steps down in size by length instead, and clamps at three lines.
 */
export const VENUE_FITS = ['short', 'medium', 'long'] as const;
export type VenueFit = (typeof VENUE_FITS)[number];
export const venueFit = (venue: string): VenueFit => (venue.length <= 12 ? 'short' : venue.length <= 22 ? 'medium' : 'long');

export const OLIVES_TOUR_PASS_PROPS: TourPassProps = {
  dateTime: '2026-09-18',
  weekday: 'Fri',
  month: 'Sep',
  day: '18',
  tierLabel: 'Artist pass',
  venue: 'Olive’s',
  city: 'Nyack, New York',
  location: 'Address to be announced',
  time: 'Doors + set · TBD',
  venueImageSrc: '/assets/performance.webp',
  actionLabel: 'Ticket TBD',
  actionAriaLabel: 'Sample ticket action unavailable',
};

/** Deterministic bar pattern seeded from the pass date, so every date gets its own barcode. */
function Barcode({ seed }: { seed: string }) {
  const bars: React.ReactNode[] = [];
  let x = 0;
  let hash = 7;
  for (let i = 0; i < 52; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i % seed.length)) % 9973;
    const width = 1 + (hash % 3);
    if (hash % 5 !== 0) {
      bars.push(<rect key={i} x={x} y={0} width={width} height={24} />);
    }
    x += width + 1;
  }
  return (
    <svg className="tour-pass__barcode" viewBox={`0 0 ${x} 24`} preserveAspectRatio="none" aria-hidden="true">
      {bars}
    </svg>
  );
}

export function TourPass({
  dateTime,
  weekday,
  month,
  day,
  tierLabel,
  venue,
  city,
  location,
  time,
  venueImageSrc,
  actionLabel,
  actionHref,
  actionAriaLabel,
  rotation = DEFAULT_TOUR_PASS_ROTATION,
  color = DEFAULT_TOUR_PASS_COLOR,
}: TourPassProps) {
  const passId = dateTime.replace(/\D/g, '') || dateTime;

  const action = actionHref ? (
    <a className="tour-pass__action" href={actionHref} aria-label={actionAriaLabel}>
      {actionLabel}
    </a>
  ) : (
    <span className="tour-pass__action tour-pass__action--disabled" aria-label={actionAriaLabel} aria-disabled="true">
      {actionLabel}
    </span>
  );

  return (
    <div
      className="tour-pass-frame"
      data-color={color}
      style={{ '--tour-pass-rotation': `${rotation}deg` } as React.CSSProperties}
    >
      <article className="tour-pass" aria-label={`${venue} ${tierLabel}`}>
        <div className="tour-pass__sheet">
          {venueImageSrc ? (
            <img className="tour-pass__venue-image" src={venueImageSrc} alt="" aria-hidden="true" />
          ) : null}

          <header className="tour-pass__headline">
            <time className="tour-pass__date" dateTime={dateTime}>
              <strong>{day}</strong>
              <span>
                {weekday}
                <br />
                {month}
              </span>
            </time>
          </header>

          <div className="tour-pass__show">
            <p className="tour-pass__venue" data-fit={venueFit(venue)}>
              {venue}
            </p>
            <p className="tour-pass__city">{city}</p>
            <p className="tour-pass__location">{location}</p>
            <p className="tour-pass__time">{time}</p>
          </div>

          {action}
        </div>

        <footer className="tour-pass__tier-band">
          <strong className="tour-pass__tier">{tierLabel}</strong>
          <Barcode seed={dateTime} />
          <span className="tour-pass__pass-id">{passId}</span>
        </footer>
      </article>
    </div>
  );
}
