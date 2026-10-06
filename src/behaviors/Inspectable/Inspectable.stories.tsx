import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Desk, DESK_WIDTH } from '../../components/3D/Desk/Desk';
import { Handbill } from '../../experience/experiments/BandIntro/Handbill';
import { BAND_HANDBILL_FRONT, BAND_HANDBILL_BACK } from '../../experience/experiments/BandIntro/Handbill.band';
import { LabelBro, LABEL_BRO_FOOT, LABEL_BRO_HEIGHT } from '../../components/3D/LabelBro/LabelBro';
import { Mug } from '../../components/3D/Mug/Mug';
import { Movable, type Place } from '../Movable/Movable';
import { GENTLE_DEPTH, GENTLE_VIEW, Perspective, Solid } from '../Perspective/Perspective';
import { Inspectable, Inspector, InspectorVeil } from './Inspectable';

const meta = {
  title: 'Library/Foundations/Behaviors/Inspectable',
  component: Inspectable,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: { children: { control: false } },
  args: { id: 'handbill' },
} satisfies Meta<typeof Inspectable>;

export default meta;
type Story = StoryObj<typeof meta>;

const DESK_DEPTH = 900;
/* A thing held up has to be drawn over the veil, and the veil over everything still lying down. */
const DESK_LAYER = 10;
const HELD_LAYER = 5000;

type Id = 'handbill' | 'printer' | 'mug';
const START: Record<Id, Place> = {
  handbill: { x: 170, y: 330, rotation: -7 },
  printer: { x: 640, y: 300, rotation: -4 },
  mug: { x: 1120, y: 330, rotation: -15 },
};
const WIDTHS: Record<Id, number> = { handbill: 300, printer: 260, mug: 200 };
const LABELS: Record<Id, string> = { handbill: 'Band handbill', printer: 'Label printer', mug: 'Mug' };

/**
 * Three things on a desk seen from where someone stands at it. Two of them are
 * worth looking at and one is only ever scenery: click the handbill or the
 * label printer and it comes up off the desk to the middle of the frame, and
 * the mug stays a mug.
 */
function Things() {
  const [places, setPlaces] = useState(START);
  const [held, setHeld] = useState<string>();
  const camera = { angle: GENTLE_VIEW, depth: GENTLE_DEPTH, width: DESK_WIDTH, surfaceHeight: DESK_DEPTH };
  const thing = (id: Id) => ({
    ...places[id],
    width: WIDTHS[id],
    label: LABELS[id],
    z: held === id ? HELD_LAYER : DESK_LAYER,
    resizable: true,
    onMove: (to: Place) => setPlaces(all => ({ ...all, [id]: { ...all[id], ...to } })),
  });
  return (
    <Inspector className="inspectable-story" held={held} onInspect={setHeld} style={{ position: 'relative', background: '#211b16', padding: '2vw' }}>
      <Perspective {...camera}>
        <Desk height={DESK_DEPTH}>
          <InspectorVeil />
          {/* The whole face of a handbill is the button that turns it over, so it is picked up anywhere on it. */}
          <Movable {...thing('handbill')} grab="anywhere">
            <Inspectable id="handbill" grab="anywhere" fill={0.9}>
              <Handbill front={BAND_HANDBILL_FRONT} back={BAND_HANDBILL_BACK} stock="goldenrod" spot="purple" />
            </Inspectable>
          </Movable>
          <Movable {...thing('printer')} pivot={{ x: LABEL_BRO_FOOT.x, y: LABEL_BRO_FOOT.y / (772 / 732) }}>
            <Inspectable id="printer" fill={0.7} upright={false}>
              <Solid localCoordinates height={LABEL_BRO_HEIGHT} foot={LABEL_BRO_FOOT}>
                <LabelBro rotation={0} defaultOn defaultText="BACKLINE" />
              </Solid>
            </Inspectable>
          </Movable>
          <Movable {...thing('mug')}>
            <Mug shadow="contact" />
          </Movable>
        </Desk>
      </Perspective>
    </Inspector>
  );
}

/**
 * Click a thing to bring it up. It never leaves the desk it is lying on, so it
 * keeps the desk's angle as it comes: it is the same object, near to, not a
 * picture of one. Click away or press Escape and it settles back exactly where
 * it was.
 */
export const OnADesk: Story = {
  render: () => <Things />,
};
