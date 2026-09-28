import { physicalControls, withLightTuning, type RoomStoryControls } from '../../debug/RoomControls/controls';
import { COFFEE_COUNTER, PRODUCTION_TRAILER } from './settings';
import { useArgs } from 'storybook/preview-api';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { DESK_SURFACES } from '../../components/3D/Desk/Desk';
import { DESK_WOODS } from '../../components/3D/Desk/Desk';
import { FLOOR_WOODS } from '../../components/3D/Floor/Floor';
import { WALL_FINISHES } from '../../components/3D/Wall/Wall';
import { PerspectiveDesk, type PerspectiveDeskProps } from './PerspectiveDesk';

/**
 * Two places the promoter's desk could be, drawn the way the desk's own room
 * is drawn: a real floor, a real wall and a real surface, measured in
 * millimetres and seen from an eye standing where a person would stand.
 *
 * Nothing here is painted on behind the desk. The cabin's wall is sheet
 * lining because the wall is made of sheets, the café's is tile because a tile
 * is 200 by 100 with a grout between, and the trestle top is a printed film
 * rather than a board because that is what a folding table is. Both hold the
 * same cast at the same sizes, so the only thing being judged is the place.
 */
const meta = {
  title: 'Pages/Desk Settings',
  component: PerspectiveDesk,
  parameters: { layout: 'fullscreen' },
  render: function Render(args) {
    const [, updateArgs] = useArgs();
    return <PerspectiveDesk {...withLightTuning(args)} onCaptureSettings={settings => updateArgs({ ...settings, ...settings.lightTuning })} />;
  },
  argTypes: {
    ...physicalControls,
    wood: { table: { category: 'Surface' }, control: 'inline-radio', options: DESK_WOODS },
    deskSurface: { table: { category: 'Surface' }, control: 'inline-radio', options: DESK_SURFACES },
    floor: { table: { category: 'Room' }, control: 'inline-radio', options: FLOOR_WOODS },
    wall: { table: { category: 'Room' }, control: 'inline-radio', options: WALL_FINISHES },
    deskShare: { table: { category: 'Room' }, control: { type: 'number', step: 0.01 } },
    roomLip: { table: { category: 'Room' }, control: { type: 'number', step: 5 } },
    roomBlur: { table: { category: 'Room' }, control: { type: 'number', step: 0.1 } },
    roomDim: { table: { category: 'Room' }, control: { type: 'range', min: 0, max: 1, step: 0.02 } },
    shadowStrength: { table: { category: 'Lighting' }, control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    lampX: { table: { category: 'Lamp placement' }, control: { type: 'number', step: 1 } },
    lampY: { table: { category: 'Lamp placement' }, control: { type: 'number', step: 1 } },
    objectPlacements: { table: { category: 'Objects' }, control: 'object' },
    showSettings: { table: { category: 'Layout tools' }, control: 'boolean' },
    onCaptureSettings: { table: { disable: true } },
    children: { table: { disable: true } },
    only: { table: { disable: true } },
    /* Drawings, not settings: shown as controls they would be serialised and edited as JSON. */
    outlook: { table: { disable: true } },
    floorContent: { table: { disable: true } },
  },
  args: { showPerformance: false, showCamera: false },
} satisfies Meta<PerspectiveDeskProps & RoomStoryControls>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every object in the setting is a real object: it stands on the surface and the lamp throws it. */
const standsInTheRoom: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await expect(canvas.getByRole('group', { name: 'Walkman' })).toBeVisible();
  await expect(canvas.getByRole('group', { name: 'Handheld' })).toBeVisible();
  await expect(canvas.getByRole('button', { name: 'Open the press package' })).toBeVisible();
  /* The room is drawn, not painted: the wall and the boards are in it. */
  await expect(canvasElement.querySelector('.desk-room__wall .wall')).toBeInTheDocument();
  await expect(canvasElement.querySelector('.desk-room__floor .floor')).toBeInTheDocument();
};

/**
 * A festival production cabin: a folding trestle in a sheet-lined box, under a
 * long shallow window, on grey plank. Seen standing, because nobody sits down
 * in a production office.
 */
export const ProductionTrailer: Story = { args: PRODUCTION_TRAILER, play: standsInTheRoom };

/**
 * A café window counter: a shallow oak bar along the glass at standing height,
 * against glazed tile, seen from a stool. Everything is within a forearm of
 * everything else, which is the whole character of the place.
 */
export const CoffeeCounter: Story = { args: COFFEE_COUNTER, play: standsInTheRoom };
