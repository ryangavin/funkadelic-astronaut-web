import type { Config, Data } from '@puckeditor/core';
import { OLIVES_TOUR_PASS_PROPS, TourPass, type TourPassProps } from '../components/TourPass/TourPass';

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
        statusLabel: { type: 'text', label: 'Status' },
        tierLabel: { type: 'text', label: 'Pass tier' },
        stageLabel: { type: 'text', label: 'Festival day' },
        venue: { type: 'text', label: 'Venue' },
        city: { type: 'text', label: 'City' },
        location: { type: 'text', label: 'Location' },
        time: { type: 'text', label: 'Doors and set time' },
        portraitSrc: { type: 'text', label: 'Portrait asset' },
        portraitAlt: { type: 'text', label: 'Portrait alt text' },
        actionLabel: { type: 'text', label: 'Ticket label' },
        actionHref: { type: 'text', label: 'Ticket link' },
        actionAriaLabel: { type: 'text', label: 'Ticket accessible label' },
      },
      defaultProps: OLIVES_TOUR_PASS_PROPS,
      render: (props) => <TourPass {...props} />,
    },
  },
};

export type PageData = Data<PageComponents>;

export const emptyPage: PageData = {
  root: { props: {} },
  content: [],
};
