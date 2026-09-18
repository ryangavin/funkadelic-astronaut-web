import { checkPhysicalRoom } from '../../debug/RoomControls/check';
import { PerspectiveDesk } from '../../pages/Desk/PerspectiveDesk';
import { physicalControls, physicalDefaults, withLightTuning, RoomExperiment, type RoomStoryControls } from '../../debug/RoomControls/controls';
import { articulateLamp, lampPoseAngles } from '../../components/3D/DeskLamp/articulation';
import { DESK_LAMP_ENAMELS } from '../../components/3D/DeskLamp/DeskLamp';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { GENTLE_DEPTH, GENTLE_VIEW } from '../../behaviors/Perspective/Perspective';
import { DESK_WOODS } from '../../components/3D/Desk/Desk';
import { FLOOR_WOODS } from '../../components/3D/Floor/Floor';
import { WALL_FINISHES } from '../../components/3D/Wall/Wall';
import { Room, type RoomProps } from './Room';
import './Room.stories.css';

const initialAngles = lampPoseAngles(articulateLamp({ x: 200, y: 420 }));

/**
 * A room with a desk in it and a lamp on the desk: what every composition in
 * this library is put together on top of. Nothing is on the desk in these
 * stories — this is the empty stage, so the camera, the room's own materials
 * and the light can be looked at on their own.
 */
const meta = {
  title: 'Foundations/Room',
  component: Room,
  render: args => <Room {...withLightTuning(args)} />,
  parameters: { layout: 'fullscreen' },
  decorators: [Story => <div className="room-story"><Story /></div>],
  tags: ['autodocs'],
  argTypes: {
    ...physicalControls,
    angle: { table: { category: 'Camera' }, control: { type: 'number', step: 1 } },
    depth: { table: { category: 'Camera' }, control: { type: 'number', step: 100 } },
    wood: { table: { category: 'Desktop' }, control: 'inline-radio', options: DESK_WOODS },
    room: { table: { category: 'Room' }, control: 'boolean' },
    floor: { table: { category: 'Room' }, control: 'inline-radio', options: FLOOR_WOODS },
    wall: { table: { category: 'Room' }, control: 'inline-radio', options: WALL_FINISHES },
    deskShare: { table: { category: 'Room' }, control: { type: 'number', step: 0.01 } },
    roomLip: { table: { category: 'Room' }, control: { type: 'number', step: 5 } },
    roomBlur: { table: { category: 'Room' }, control: { type: 'number', step: 0.1 } },
    roomDim: { table: { category: 'Room' }, control: { type: 'range', min: 0, max: 1, step: 0.02 } },
    shadowStrength: { table: { category: 'Lighting' }, control: { type: 'range', min: 0, max: 1, step: .01 } },
    lamp: { control: 'boolean', table: { category: 'Lighting' } },
    lampX: { control: { type: 'number', step: 1 }, table: { category: 'Lamp placement' } },
    lampY: { control: { type: 'number', step: 1 }, table: { category: 'Lamp placement' } },
    lampRotation: { control: { type: 'number', step: .1 }, table: { category: 'Lamp placement' } },
    lampWidth: { control: { type: 'number', step: 1 }, table: { category: 'Lamp appearance' } },
    lampEnamel: { control: 'inline-radio', options: DESK_LAMP_ENAMELS, table: { category: 'Lamp appearance' } },
    lampLowerAngle: { control: { type: 'number', step: .1 }, table: { category: 'Lamp articulation' } },
    lampUpperAngle: { control: { type: 'number', step: .1 }, table: { category: 'Lamp articulation' } },
    places: { table: { disable: true } },
    shadows: { table: { disable: true } },
    children: { table: { disable: true } },
    onArrange: { table: { disable: true } },
    onArticulate: { table: { disable: true } },
    onLamp: { table: { disable: true } },
  },
  args: { ...physicalDefaults, angle: 78, depth: 5700, wood: 'walnut', room: true, floor: 'pine', wall: 'red', lamp: true, shadowStrength: .36, lampX: 396, lampY: 17, lampRotation: 0, lampWidth: 576, lampEnamel: 'green', lampLowerAngle: -142.6818247177271, lampUpperAngle: 110.41274403236815, onArrange: fn(), onArticulate: fn(), onLamp: fn() },
} satisfies Meta<RoomProps & RoomStoryControls>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The room as the compositions get it: boards, brick, a walnut top and the lamp clamped over it. */
export const Empty: Story = {};

/** Straight down at it, the way everything in this library is drawn, with the room taken away. */
export const Plan: Story = {
  args: { angle: 90, depth: GENTLE_DEPTH, room: false, deskShare: 1, roomLip: 0 },
};

/** The gentle view the behaviors default to: a little off overhead, from a long way back. */
export const Gentle: Story = {
  args: { angle: GENTLE_VIEW, depth: GENTLE_DEPTH, lampLowerAngle: initialAngles.lower, lampUpperAngle: initialAngles.upper },
};

/** Without the lamp there is nothing lighting the room, and only the dark under the desk is left. */
export const LampOff: Story = {
  name: 'Lamp off',
  args: { lamp: false },
};

/** A populated experiment; all numeric ranges are yours to explore. */
export const PhysicalSetup: Story = {
  play: checkPhysicalRoom,
  args: { cameraMode: 'physical', eyeHeightMm: 1650, viewerSetbackMm: 650, deskShare: 0.8, roomLip: 180 },
  render: function Experiment(args) {
    return <RoomExperiment args={args}>{values => <PerspectiveDesk {...withLightTuning(values)} showSettings={false} only={['mug', 'pen', 'handheld', 'cradle']} />}</RoomExperiment>;
  },
};
