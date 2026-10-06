import type { Meta, StoryObj } from '@storybook/react-vite';
import { DESK_WOODS } from '../../components/3D/Desk/Desk';
import { PromoterDesk } from './PromoterDesk';

const viewports = {
  laptop: { name: 'Laptop 1280', styles: { width: '1280px', height: '800px' }, type: 'desktop' },
  design: { name: 'Design 1440 x 810', styles: { width: '1440px', height: '810px' }, type: 'desktop' },
  wide: { name: 'Wide 1920', styles: { width: '1920px', height: '1080px' }, type: 'desktop' },
  tablet: { name: 'Tablet 834', styles: { width: '834px', height: '1194px' }, type: 'tablet' },
  phone: { name: 'Phone 390', styles: { width: '390px', height: '844px' }, type: 'mobile' },
} as const;

const meta = {
  title: 'Experience/Desk',
  component: PromoterDesk,
  parameters: { layout: 'fullscreen', viewport: { options: viewports } },
  tags: ['autodocs'],
  argTypes: {
    wood: { control: 'inline-radio', options: DESK_WOODS },
    minScale: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    maxScale: { control: { type: 'range', min: 0.5, max: 3, step: 0.05 } },
  },
  args: { wood: 'walnut', open: false, lamp: true },
  decorators: [
    /* The page is the desk in its room; the docs show just the frame, at its own 16 x 9. */
    (Story, context) =>
      context.viewMode === 'docs' ? (
        <Story />
      ) : (
        <div className="promoter-desk-room">
          <Story />
        </div>
      ),
  ],
} satisfies Meta<typeof PromoterDesk>;

export default meta;
type Story = StoryObj<typeof meta>;

/** As a visitor lands on it: the package closed with the promoter's things on and around it, the band's name across the cover. Click it. */
export const Closed: Story = {};

/** Everything out on the desk, the way it looks once the package has been opened. Drag things about. */
export const Spilled: Story = {
  args: { open: true },
};

/** At the design size itself, 16 x 9: one desk unit is one screen pixel and the desk fills the frame. */
export const AtDesignWidth: Story = {
  globals: { viewport: { value: 'design' } },
};

/** A common laptop, a little under the design width. */
export const Laptop: Story = {
  globals: { viewport: { value: 'laptop' } },
};

/** A big monitor. */
export const Wide: Story = {
  globals: { viewport: { value: 'wide' } },
};

/** A phone, with no floor: the whole desk at about a quarter size. */
export const Phone: Story = {
  globals: { viewport: { value: 'phone' } },
};

/** The lighter timber. */
export const Oak: Story = {
  args: { wood: 'oak', open: true },
};

/** Late: the lamp off, the room dim. */
export const LampOff: Story = {
  args: { lamp: false, open: true },
};
