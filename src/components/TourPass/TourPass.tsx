import './TourPass.css';

export type TourPassProps = {
  dateTime: string;
  weekday: string;
  month: string;
  day: string;
  statusLabel: string;
  tierLabel: string;
  stageLabel: string;
  venue: string;
  city: string;
  location: string;
  time: string;
  portraitSrc: string;
  portraitAlt?: string;
  actionLabel: string;
  actionHref?: string;
  actionAriaLabel?: string;
};

export const OLIVES_TOUR_PASS_PROPS: TourPassProps = {
  dateTime: '2026-09-18',
  weekday: 'Fri',
  month: 'Sep',
  day: '18',
  statusLabel: 'Sample date',
  tierLabel: 'Artist pass',
  stageLabel: 'Festival day 01',
  venue: 'Olive’s',
  city: 'Nyack, New York',
  location: 'Address to be announced',
  time: 'Doors + set · TBD',
  portraitSrc: '/assets/tour-pass-ryan-cutout.png',
  portraitAlt: '',
  actionLabel: 'Ticket TBD',
  actionAriaLabel: 'Sample ticket action unavailable',
};

function PassField({ label, value, className }: { label: string; value: string; className: string }) {
  return (
    <p className={className}>
      <span className="tour-pass__field-label">{label}</span>
      <span>{value}</span>
    </p>
  );
}

export function TourPass({
  dateTime,
  weekday,
  month,
  day,
  statusLabel,
  tierLabel,
  stageLabel,
  venue,
  city,
  location,
  time,
  portraitSrc,
  portraitAlt = '',
  actionLabel,
  actionHref,
  actionAriaLabel,
}: TourPassProps) {
  const actionClassName = actionHref
    ? 'tour-pass__speech-bubble'
    : 'tour-pass__speech-bubble tour-pass__speech-bubble--disabled';

  const action = actionHref ? (
    <a className={actionClassName} href={actionHref} aria-label={actionAriaLabel}>
      {actionLabel}
    </a>
  ) : (
    <span className={actionClassName} aria-label={actionAriaLabel} aria-disabled="true">
      {actionLabel}
    </span>
  );

  return (
    <div className="tour-pass-frame">
      <article className="tour-pass" aria-label={`${venue} ${tierLabel}`}>
        <header className="tour-pass__date-panel">
          <time className="tour-pass__date" dateTime={dateTime}>
            <span>{weekday} · {month}</span>
            <strong>{day}</strong>
          </time>
          <span className="tour-pass__status">{statusLabel}</span>
          <span className="tour-pass__tier">{tierLabel}</span>
        </header>

        <div className="tour-pass__show">
          <p className="tour-pass__stage">{stageLabel}</p>
          <p className="tour-pass__venue">
            <span className="tour-pass__field-label">Venue</span>
            <strong>{venue}</strong>
          </p>
          <PassField className="tour-pass__city" label="City" value={city} />
          <PassField className="tour-pass__location" label="Location" value={location} />
          <PassField className="tour-pass__time" label="Time" value={time} />
        </div>

        <footer className="tour-pass__action-panel">
          <div className="tour-pass__action">
            <img
              className="tour-pass__portrait"
              src={portraitSrc}
              width="398"
              height="512"
              alt={portraitAlt}
              aria-hidden={portraitAlt ? undefined : true}
            />
            {action}
          </div>
        </footer>
      </article>
    </div>
  );
}
