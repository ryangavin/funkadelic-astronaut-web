import { mmToUnits } from '../../../geometry/physicalScale';
import { elevatedLayer } from '../../../behaviors/Perspective/elevation';
import { checkDeskStudy } from '../../../behaviors/Perspective/DeskObjectStudy.check';
import { DeskObjectStudy } from '../../../behaviors/Perspective/DeskObjectStudy';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { PEN_KINDS, Pen } from './Pen';

const meta = {
  title: 'Components/3D/Pen',
  component: Pen,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    kind: { control: 'inline-radio', options: PEN_KINDS },
    ink: { control: 'color' },
    rotation: { control: { type: 'range', min: -180, max: 180, step: 1 } },
  },
  args: { kind: 'ballpoint', ink: '#2c4fa3', rotation: -8 },
  decorators: [
    (Story, context) => context.parameters.composition ? <Story /> : (
      <div style={{ padding: '80px 56px', background: '#5a3a25' }}>
        <div style={{ width: 420 }}>
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof Pen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A clear ballpoint, cap on, the ink showing through the barrel. */
export const Ballpoint: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.pen[data-kind="ballpoint"] .pen__tube')).toBeInTheDocument();
  },
};

/** A permanent marker: black body, the cap in the ink's colour. */
export const Marker: Story = {
  args: { kind: 'marker', ink: '#c9432f', rotation: 6 },
};

/** A sharpened pencil, the eraser worn down. */
export const Pencil: Story = {
  args: { kind: 'pencil', rotation: -3 },
};

/** The three, dropped together. */
export const Handful: Story = {
  render: () => (
    <div style={{ position: 'relative', width: 480, height: 200 }}>
      <div style={{ position: 'absolute', left: 0, top: 30, width: 400 }}>
        <Pen kind="pencil" rotation={-14} />
      </div>
      <div style={{ position: 'absolute', left: 60, top: 70, width: 400 }}>
        <Pen kind="marker" ink="#228542" rotation={4} />
      </div>
      <div style={{ position: 'absolute', left: 40, top: 130, width: 400 }}>
        <Pen kind="ballpoint" ink="#121420" rotation={-2} />
      </div>
    </div>
  ),
};

export const OnDesk: Story = {
  play: checkDeskStudy,
  name: 'On desk',
  parameters: { layout: 'fullscreen', composition: true },
  render: (args) => {
    const heightMm = args.kind === 'marker' ? 6 : args.kind === 'pencil' ? 5 : 7;
    // Narrow silhouettes follow the artwork instead of filling its empty SVG margins.
    const outline = args.kind === 'marker'
      ? 'M.3 18H4.2V8.3H19.4V18H23V23H96.7V30H98.9V70H96.7V77H23V82H.3Z'
      : args.kind === 'pencil'
        ? 'M.3 30H5.6V27H11.9V28H86.7L99.4 50L86.7 72H11.9V73H5.6V70H.3Z'
        : 'M.3 28H3.3V18H17.2V28H19.7V33H96.4L99.9 50L96.4 67H19.7V72H.3Z';
    return <DeskObjectStudy name="Pen" widthMm={149} depthRatio={60/720} heightMm={heightMm} customRelief shapes={[{ path: outline }]} note="Estimated shallow height; a darker copy of the artwork supplies the thin side edge.">
      {(place, camera) => {
        const top = elevatedLayer(mmToUnits(heightMm), { ...place, width: mmToUnits(149), drawingWidth: 720, drawingHeight: 60 }, camera);
        return <div style={{ position: 'relative', aspectRatio: '720 / 60' }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', filter: 'brightness(.65)' }}>
            <Pen {...args} rotation={0} />
          </div>
          <div style={{ position: 'relative', transformOrigin: '50% 50%', transform: `translate(${top.x / 720 * 100}%, ${top.y / 60 * 100}%) scale(${top.scale})` }}>
            <Pen {...args} rotation={0} />
          </div>
        </div>;
      }}
    </DeskObjectStudy>;
  },
};
