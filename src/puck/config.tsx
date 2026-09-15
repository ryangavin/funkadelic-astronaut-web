import type { Config, Data } from '@puckeditor/core';
import {
  DEFAULT_TOUR_PASS_COLOR,
  DEFAULT_TOUR_PASS_ROTATION,
  OLIVES_TOUR_PASS_PROPS,
  TOUR_PASS_COLORS,
  TourPass,
  type TourPassProps,
} from '../components/TourPass/TourPass';

export type PageComponents = {
  TourPass: TourPassProps;
};

export const pageConfig: Config<PageComponents> = {
  categories: {
    tour: {
      title: 'Tour',
      components: ['TourPass'],
    },
  },
  components: {
    TourPass: {
      label: 'Tour pass',
      fields: {
        dateTime: { type: 'text', label: 'Machine-readable date' },
        weekday: { type: 'text', label: 'Weekday' },
        month: { type: 'text', label: 'Month' },
        day: { type: 'text', label: 'Day' },
        tierLabel: { type: 'text', label: 'Pass tier' },
        venue: { type: 'text', label: 'Venue' },
        city: { type: 'text', label: 'City' },
        location: { type: 'text', label: 'Location' },
        time: { type: 'text', label: 'Doors and set time' },
        venueImageSrc: { type: 'text', label: 'Venue photo' },
        actionLabel: { type: 'text', label: 'Ticket label' },
        actionHref: { type: 'text', label: 'Ticket link' },
        actionAriaLabel: { type: 'text', label: 'Ticket accessible label' },
        rotation: { type: 'number', label: 'Tilt (degrees)', min: -10, max: 10, step: 0.25 },
        color: {
          type: 'select',
          label: 'Ink color',
          options: TOUR_PASS_COLORS.map((value) => ({ label: value, value })),
        },
      },
      defaultProps: {
        ...OLIVES_TOUR_PASS_PROPS,
        rotation: DEFAULT_TOUR_PASS_ROTATION,
        color: DEFAULT_TOUR_PASS_COLOR,
      },
      render: (props) => <TourPass {...props} />,
    },
  },
};

export type PageData = Data<PageComponents>;

export const emptyPage: PageData = {
  root: { props: {} },
  content: [],
};
