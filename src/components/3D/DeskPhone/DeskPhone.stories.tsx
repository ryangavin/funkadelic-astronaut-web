import { DeskObjectStudy } from '../../../experience/debug/ObjectStudy/DeskObjectStudy';
import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import festivalSketch from '../../../../assets/festival-scribble-fully-shaded.png';
import { Perspective, STANDING_VIEW, Solid } from '../../../behaviors/Perspective/Perspective';
import { Desk } from '../Desk/Desk';
import { PaperSheet } from '../../2D/PaperSheet/PaperSheet';
import { Pin } from '../../2D/Pin/Pin';
import { DESK_PHONE_FINISHES, DESK_PHONE_FOOT, DESK_PHONE_HEIGHT, DeskPhone, SET_BODY_HEIGHT } from './DeskPhone';

const meta = {
  title: 'Library/Components/3D/DeskPhone',
  component: DeskPhone,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    finish: { control: 'inline-radio', options: DESK_PHONE_FINISHES },
    number: { control: 'text' },
    rotation: { control: { type: 'range', min: -20, max: 20, step: 0.5 } },
    volume: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    offHook: { control: 'boolean' },
    sound: { control: 'boolean' },
  },
  args: {
    number: '718 555 0164',
    finish: 'black',
    rotation: -2,
    offHook: false,
    volume: 0.8,
    sound: true,
  },
  decorators: [
    (Story, context) =>
      context.parameters.composition ? (
        <Story />
      ) : (
        <div style={{ padding: 56, background: '#ead3a7' }}>
          <div style={{ width: 360, maxWidth: '100%' }}>
            <Story />
          </div>
        </div>
      ),
  ],
} satisfies Meta<typeof DeskPhone>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The booking line as it sits: handset down, and every part the size it is in millimetres. Lift the handset to dial. */
export const BookingLine: Story = {};

/** The handset up, the plungers risen, the dial live. */
export const OffHook: Story = {
  args: { offHook: true, rotation: 3 },
};

/** What the declared height is worth. The plan never changes; a Solid's two numbers, handed over by hand here, grow the flanks out from under the top faces. */
export const Raised: Story = {
  parameters: { composition: true },
  args: { rotation: 0 },
  render: (args) => (
    <div style={{ display: 'grid', gap: 40, padding: 56, background: '#ead3a7', justifyItems: 'center' }}>
      {[0, 0.08, 0.17].map((rise) => (
        <div key={rise} style={{ width: 465, maxWidth: '100%', '--solid-rise': rise, '--solid-splay': rise * 0.5 } as CSSProperties}>
          <DeskPhone {...args} />
        </div>
      ))}
    </div>
  ),
};

/** The whole path, not a simulation of it: the desk tipped to a standing view and the drawing stood in a Solid of its real height at its real foot. */
export const OnATiltedDesk: Story = {
  parameters: { composition: true, layout: 'fullscreen' },
  args: { rotation: 0, finish: 'black' },
  render: (args) => (
    <div style={{ background: '#1a1512', padding: '32px 0 56px' }}>
      <Perspective angle={STANDING_VIEW}>
        {/* The top is deeper than the frame because depth foreshortens. */}
        <Desk height={1020} edge={0}>
          {/* Set down at an angle, so the turn Solid hands back is worth something. */}
          <Pin x={400} y={470} width={495} rotation={-7}>
            <Solid height={DESK_PHONE_HEIGHT} foot={DESK_PHONE_FOOT}>
              <DeskPhone {...args} />
            </Solid>
          </Pin>
        </Desk>
      </Perspective>
    </div>
  ),
};

/** The colour range: the 1949 black, then ivory, cherry red, aqua blue and moss green.  */
export const Finishes: Story = {
  parameters: { composition: true },
  render: (args) => (
    <div style={{ display: 'grid', gap: 40, padding: 56, background: '#ead3a7', justifyItems: 'center' }}>
      {DESK_PHONE_FINISHES.map((finish) => (
        <div key={finish} style={{ width: 480, maxWidth: '100%' }}>
          <DeskPhone {...args} finish={finish} rotation={0} />
        </div>
      ))}
    </div>
  ),
};

/** Pushed to the corner of the desk, on the festival sketch, where the booking line lives. */
export const OnFestivalPaper: Story = {
  parameters: { composition: true, layout: 'fullscreen' },
  args: { rotation: -5, finish: 'ivory' },
  render: (args) => (
    <PaperSheet height={0} imageSrc={festivalSketch} imageSize="118% auto" imagePosition="center top" imageOpacity={0.9} imageContrast={1.28}>
      <div style={{ padding: '8% 8%', display: 'flex', justifyContent: 'flex-start' }}>
        <div style={{ width: 540, maxWidth: '100%' }}>
          <DeskPhone {...args} />
        </div>
      </div>
    </PaperSheet>
  ),
};

export const OnDesk: Story = {
  name: 'On desk',
  parameters: { layout: 'fullscreen', composition: true },
  render: (args) => <DeskObjectStudy name="Desk phone" widthMm={320} depthRatio={300/320} heightMm={SET_BODY_HEIGHT} solid={{ height: DESK_PHONE_HEIGHT, foot: DESK_PHONE_FOOT }} shapes={[{ path: "M32 12H81Q92 12 92 25V80Q92 88 81 88H32Q23 88 23 80V25Q23 12 32 12Z" }]} note="320 × 300 mm artwork bounds include the cord; housing is 221 × 229 mm. What stands up is the moulding, not the handset lying on it; handset and cord remain attached when lifted."><DeskPhone {...args} rotation={0} sound={false} /></DeskObjectStudy>,
};
