import type React from 'react';
import { useId } from 'react';
import { PrintInkFilter } from '../../../foundations/Distressed/Distressed';
import './AdmissionTicket.css';

export type AdmissionTicketProps = {
  /** Who is presenting, across the top. */
  presenter: string;
  /** Small line under the presenter, e.g. "PRESENTS". */
  presents?: string;
  /** The big serif headline in the middle. */
  title: string;
  subtitle: string;
  /** Large year or number printed on the lower left. */
  seasonYear: string;
  seasonLabel: string;
  /** Lower-right copy block. */
  location: string;
  detail: string;
  /** Left stub copy, read bottom to top. */
  section: string;
  admission: string;
  serial: string;
  /** Copy printed along the coloured rail beside the left stub. */
  railCopy?: string;
  /** Right-hand price field, read top to bottom. */
  priceLabel?: string;
  price: string;
  priceSerial: string;
  /** Tilt of the whole ticket in degrees. Negative tilts counter-clockwise. */
  rotation?: number;
  /** Which of the site's inks the stamp, price and rail are printed in. */
  color?: AdmissionTicketColor;
  /** Accessible name for the ticket. Defaults to "<presenter> <title>". */
  ariaLabel?: string;
};

export const ADMISSION_TICKET_COLORS = ['orange', 'red', 'blue', 'purple', 'green'] as const;
export type AdmissionTicketColor = (typeof ADMISSION_TICKET_COLORS)[number];
export const DEFAULT_ADMISSION_TICKET_COLOR: AdmissionTicketColor = 'orange';

export const DEFAULT_ADMISSION_TICKET_ROTATION = 0;

export const TOUR_ADMISSION_TICKET_PROPS: AdmissionTicketProps = {
  presenter: 'FUNKadelic ASTRONAUT',
  presents: 'Presents',
  title: 'TOUR',
  subtitle: 'Live · All access',
  seasonYear: '2026',
  seasonLabel: 'Season',
  location: 'Northeast + beyond',
  detail: '2026 dates below',
  section: 'Sec · FA',
  admission: 'Gen. Adm.',
  serial: '004269',
  railCopy: 'Admit one · This date only',
  priceLabel: 'Price',
  price: '$42.69',
  priceSerial: 'FA 3853',
};

/* Hand-cut silhouette: every edge wobbles by a unit or two so nothing reads as machine-straight. */
const EDGE_SILHOUETTE =
  'M20 16 90 15 160 16 230 15 300 16 370 15 440 16 510 15 580 16 650 15 700 16 701 75 700 135 701 195 700 251 630 250 560 251 490 250 420 251 350 250 280 251 210 250 140 251 70 250 20 251 19 190 20 130 19 70Z';

const STAR = 'm0 0 6 13 14 2-10 10 3 14-13-7-13 7 3-14-10-10 14-2Z';

export function AdmissionTicket({
  presenter,
  presents = 'Presents',
  title,
  subtitle,
  seasonYear,
  seasonLabel,
  location,
  detail,
  section,
  admission,
  serial,
  railCopy = 'Admit one · This date only',
  priceLabel = 'Price',
  price,
  priceSerial,
  rotation = DEFAULT_ADMISSION_TICKET_ROTATION,
  color = DEFAULT_ADMISSION_TICKET_COLOR,
  ariaLabel,
}: AdmissionTicketProps) {
  /* Every ticket on a page carries its own defs, so ids are scoped per instance. */
  const uid = useId().replace(/:/g, '');
  const id = (name: string) => `admission-ticket-${name}-${uid}`;
  const url = (name: string) => `url(#${id(name)})`;

  return (
    <span
      className="admission-ticket"
      data-color={color}
      role="img"
      aria-label={ariaLabel ?? `${presenter} ${title}`}
      style={{ '--admission-ticket-rotation': `${rotation}deg` } as React.CSSProperties}
    >
      <svg className="admission-ticket__shape" viewBox="0 0 720 276" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={id('paper')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f6cba5" />
            <stop offset=".48" stopColor="#eeb78a" />
            <stop offset="1" stopColor="#d99a6c" />
          </linearGradient>
          <pattern id={id('fibers')} width="17" height="15" patternUnits="userSpaceOnUse" patternTransform="rotate(-5)">
            <path d="M0 2h8M5 9h10" stroke="#fff1dc" strokeOpacity=".22" strokeWidth="1" />
            <path d="M11 5h5M0 13h6" stroke="#7d3e27" strokeOpacity=".13" strokeWidth="1" />
          </pattern>
          <pattern id={id('weathering')} width="96" height="74" patternUnits="userSpaceOnUse">
            <circle cx="13" cy="18" r=".8" fill="#713b2b" fillOpacity=".2" />
            <circle cx="71" cy="11" r=".55" fill="#713b2b" fillOpacity=".16" />
            <circle cx="44" cy="53" r=".7" fill="#fff0d9" fillOpacity=".22" />
            <path d="m81 39 5-1M22 67l3 .5" stroke="#713b2b" strokeOpacity=".12" strokeWidth=".7" />
          </pattern>
          <linearGradient id={id('age-wash')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#713b2b" stopOpacity=".08" />
            <stop offset=".22" stopColor="#713b2b" stopOpacity="0" />
            <stop offset=".74" stopColor="#fff0d9" stopOpacity=".04" />
            <stop offset="1" stopColor="#713b2b" stopOpacity=".07" />
          </linearGradient>
          <PrintInkFilter id={id('ink')} />
          <path id={id('edge')} d={EDGE_SILHOUETTE} />
          <clipPath id={id('clip')}>
            <use href={`#${id('edge')}`} />
          </clipPath>
        </defs>

        <g className="admission-ticket__composition" transform="matrix(1 -.012 .018 1 -1 9)">
          <use className="admission-ticket__offset-edge" href={`#${id('edge')}`} />
          <g clipPath={url('clip')}>
            <use className="admission-ticket__stock" href={`#${id('edge')}`} fill={url('paper')} />
            <rect className="admission-ticket__stub" x="18" y="14" width="101" height="238" />
            <rect className="admission-ticket__stub" x="609" y="14" width="93" height="238" />
            <rect className="admission-ticket__rail" x="82" y="14" width="29" height="238" filter={url('ink')} />
            <rect className="admission-ticket__rail" x="609" y="14" width="27" height="238" filter={url('ink')} />
            <use className="admission-ticket__fibers" href={`#${id('edge')}`} fill={url('fibers')} />
            <use className="admission-ticket__age-wash" href={`#${id('edge')}`} fill={url('age-wash')} />
            <use className="admission-ticket__weathering" href={`#${id('edge')}`} fill={url('weathering')} />
            <path className="admission-ticket__perf" d="M119 18V248M609 18V248" />

            {/* Anchored at the stub's centre so the line stays centred whatever the copy length. */}
            <text className="admission-ticket__stub-copy" transform="translate(57 133) rotate(-90)" textAnchor="middle">
              <tspan className="admission-ticket__stub-label">{section}</tspan>
              <tspan className="admission-ticket__stub-stamp" dx="8">{admission}</tspan>
              <tspan className="admission-ticket__stub-serial" dx="10">{serial}</tspan>
            </text>
            <text className="admission-ticket__rail-copy" x="101" y="237" transform="rotate(-90 101 237)">
              {railCopy}
            </text>

            <path className="admission-ticket__star" d={STAR} transform="translate(164 43)" filter={url('ink')} />
            <path className="admission-ticket__star" d={STAR} transform="translate(564 43)" filter={url('ink')} />
            <text className="admission-ticket__presenter" x="364" y="49" textAnchor="middle">{presenter}</text>
            <text className="admission-ticket__presents" x="364" y="68" textAnchor="middle">{presents}</text>
            <text className="admission-ticket__title" x="364" y="130" textAnchor="middle" filter={url('ink')}>
              {title}
            </text>
            <text className="admission-ticket__subtitle" x="364" y="153" textAnchor="middle">{subtitle}</text>
            <path className="admission-ticket__rule" d="M143 163H588M310 164V239" />
            <text className="admission-ticket__season-year" x="148" y="211">{seasonYear}</text>
            <text className="admission-ticket__season-label" x="151" y="232">{seasonLabel}</text>
            <text className="admission-ticket__location" x="329" y="191">{location}</text>
            <text className="admission-ticket__detail" x="329" y="225">{detail}</text>

            <rect className="admission-ticket__price-field" x="646" y="35" width="42" height="197" />
            <g className="admission-ticket__price-copy" transform="translate(674 53) rotate(90)">
              <text className="admission-ticket__price-label" x="0" y="0">{priceLabel}</text>
              <text className="admission-ticket__price" x="48" y="0">{price}</text>
              <text className="admission-ticket__price-serial" x="0" y="16">{priceSerial}</text>
            </g>
          </g>
        </g>
      </svg>
    </span>
  );
}
