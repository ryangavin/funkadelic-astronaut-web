import type { Config, Data, Slot } from '@puckeditor/core';
import {
  PAPER_SHEET_IMAGE_DEFAULTS,
  PAPER_STOCKS,
  PaperSheet,
  type PaperSheetProps,
} from '../components/PaperSheet/PaperSheet';
import { Pin, type PinProps } from '../components/Pin/Pin';
import {
  FOOTER_RIBBON_HEIGHT,
  FOOTER_RIBBON_WAVE,
  RIBBON_COLOR_NAMES,
  Ribbon,
  type RibbonColor,
  type RibbonProps,
} from '../components/Ribbon/Ribbon';
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
  Ribbon: Omit<RibbonProps, 'children' | 'color'> & { color: RibbonColor; content: Slot };
  TourPass: TourPassProps;
};

export const pageConfig: Config<PageComponents> = {
  categories: {
    layout: {
      title: 'Layout',
      components: ['PaperSheet', 'Pin', 'Ribbon'],
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
        imageSrc: { type: 'text', label: 'Printed image (URL, blank for plain stock)' },
        imageSize: { type: 'text', label: 'Image crop (cover, contain, or e.g. 118% auto)' },
        imagePosition: { type: 'text', label: 'Image position (e.g. center 66%)' },
        imageOpacity: { type: 'number', label: 'Image opacity', min: 0, max: 1, step: 0.02 },
        imageContrast: { type: 'number', label: 'Image contrast', min: 0.5, max: 3, step: 0.05 },
        content: { type: 'slot' },
      },
      defaultProps: {
        stock: 'wheat',
        height: 900,
        surround: 10,
        imageSrc: '',
        imageSize: PAPER_SHEET_IMAGE_DEFAULTS.size,
        imagePosition: PAPER_SHEET_IMAGE_DEFAULTS.position,
        imageOpacity: PAPER_SHEET_IMAGE_DEFAULTS.opacity,
        imageContrast: PAPER_SHEET_IMAGE_DEFAULTS.contrast,
        content: [],
      },
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
    Ribbon: {
      label: 'Ribbon',
      fields: {
        color: {
          type: 'select',
          label: 'Band ink',
          options: RIBBON_COLOR_NAMES.map((value) => ({ label: value, value })),
        },
        height: { type: 'number', label: 'Band height (px)', min: 24, max: 240, step: 2 },
        frequency: { type: 'number', label: 'Waves across the width', min: 0.25, max: 4, step: 0.01 },
        amplitude: { type: 'number', label: 'Wave depth (% of height)', min: 0, max: 80, step: 0.1 },
        rotation: { type: 'number', label: 'Tilt (degrees)', min: -20, max: 20, step: 0.1 },
        x: { type: 'number', label: 'Shift along (% of width)', min: -100, max: 100, step: 0.1 },
        y: { type: 'number', label: 'Shift down (% of height)', min: -100, max: 100, step: 0.1 },
        background: { type: 'text', label: 'Block fill (CSS colour)' },
        worn: {
          type: 'radio',
          label: 'Ink finish',
          options: [
            { label: 'Worn', value: true },
            { label: 'Crisp', value: false },
          ],
        },
        content: { type: 'slot' },
      },
      defaultProps: {
        color: 'purple',
        height: FOOTER_RIBBON_HEIGHT,
        ...FOOTER_RIBBON_WAVE,
        background: '#121420',
        worn: true,
        content: [],
      },
      render: ({ content: Content, ...props }) => (
        <Ribbon {...props}>
          <Content minEmptyHeight={120} />
        </Ribbon>
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
