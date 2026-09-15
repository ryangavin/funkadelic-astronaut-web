import type { Config, Data, Slot } from '@puckeditor/core';
import { PAPER_STOCKS, PaperSheet, type PaperSheetProps } from '../components/PaperSheet/PaperSheet';
import { Pin, type PinProps } from '../components/Pin/Pin';
import {
  DEFAULT_TOUR_PASS_COLOR,
  DEFAULT_TOUR_PASS_ROTATION,
  OLIVES_TOUR_PASS_PROPS,
  TOUR_PASS_COLORS,
  TourPass,
  type TourPassProps,
} from '../components/TourPass/TourPass';

export type PageComponents = {
  PaperSheet: Omit<PaperSheetProps, 'children'> & { content: Slot };
  Pin: Omit<PinProps, 'children' | 'dragRef'> & { content: Slot };
  TourPass: TourPassProps;
};

export const pageConfig: Config<PageComponents> = {
  categories: {
    layout: {
      title: 'Layout',
      components: ['PaperSheet', 'Pin'],
    },
    tour: {
      title: 'Tour',
      components: ['TourPass'],
    },
  },
  components: {
    PaperSheet: {
      label: 'Paper sheet',
      fields: {
        stock: {
          type: 'select',
          label: 'Paper stock',
          options: PAPER_STOCKS.map((value) => ({ label: value, value })),
        },
        height: { type: 'number', label: 'Height (sheet units, 0 = fit content)', min: 0, step: 10 },
        surround: { type: 'number', label: 'Ink surround (px)', min: 0, max: 40 },
        content: { type: 'slot' },
      },
      defaultProps: { stock: 'wheat', height: 900, surround: 10, content: [] },
      render: ({ content: Content, ...props }) => (
        <PaperSheet {...props}>
          <Content minEmptyHeight={200} />
        </PaperSheet>
      ),
    },
    Pin: {
      label: 'Pin',
      inline: true,
      fields: {
        x: { type: 'number', label: 'X (sheet units)', step: 1 },
        y: { type: 'number', label: 'Y (sheet units)', step: 1 },
        width: { type: 'number', label: 'Width (sheet units, 0 = auto)', min: 0, step: 1 },
        rotation: { type: 'number', label: 'Rotation (degrees)', min: -45, max: 45, step: 0.25 },
        content: { type: 'slot' },
      },
      defaultProps: { x: 80, y: 80, width: 420, rotation: 0, content: [] },
      render: ({ content: Content, puck, ...props }) => (
        <Pin {...props} dragRef={puck.dragRef}>
          <Content minEmptyHeight={80} />
        </Pin>
      ),
    },
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
