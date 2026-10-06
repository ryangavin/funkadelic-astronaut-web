import { physicalControls, physicalDefaults, withLightTuning, RoomExperiment, type RoomStoryControls } from '../debug/RoomControls/controls';
import { useArgs } from 'storybook/preview-api';
import { articulateLamp, lampPoseAngles } from '../../components/3D/DeskLamp/articulation';
import { DESK_LAMP_ENAMELS } from '../../components/3D/DeskLamp/DeskLamp';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DESK_WOODS } from '../../components/3D/Desk/Desk';
import { FLOOR_WOODS } from '../../components/3D/Floor/Floor';
import { WALL_FINISHES } from '../../components/3D/Wall/Wall';
import { PerspectiveDesk, type PerspectiveDeskProps } from './PerspectiveDesk';

const initialAngles = lampPoseAngles(articulateLamp({ x: 200, y: 420 }));

const meta = {
  title: 'Experience/Perspective Desk',
  component: PerspectiveDesk,
  parameters: { layout: 'fullscreen' },
  render: function Render(args) {
    const [, updateArgs] = useArgs();
    return <PerspectiveDesk {...withLightTuning(args)} onCaptureSettings={settings => updateArgs({ ...settings, ...settings.lightTuning })} />;
  },
  tags: ['autodocs'],
  argTypes: {
    ...physicalControls,
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
    lampLowerAngle: { control: { type: 'number', step: .1 }, description: 'Lower arm angle in the lamp’s local drawing. Use Sync story controls to capture the current dragged pose.', table: { category: 'Lamp articulation' } },
    lampUpperAngle: { control: { type: 'number', step: .1 }, description: 'Upper arm angle; stored separately to preserve the exact elbow bend.', table: { category: 'Lamp articulation' } },
    objectPlacements: { control: 'object', table: { category: 'Desk objects' } },
    showObjects: { control: 'boolean', table: { category: 'Desk objects' } },
    showSettings: { control: 'boolean', table: { category: 'Layout tools' } },
    onCaptureSettings: { table: { disable: true } },
    children: { table: { disable: true } },
    onArrange: { table: { disable: true } },
    onArticulate: { table: { disable: true } },
    onLamp: { table: { disable: true } },
  },
  args: { showPerformance: false, ...physicalDefaults, wood: 'walnut', lamp: true, shadowStrength: .36, lampX: 770, lampY: 100, lampRotation: 0, lampWidth: 576, lampEnamel: 'green', lampLowerAngle: initialAngles.lower, lampUpperAngle: initialAngles.upper },
} satisfies Meta<PerspectiveDeskProps & RoomStoryControls>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The starting point for the main desk: a clear surface and an articulated lamp. */
export const Desk: Story = {
  args: {
    showCamera: false,
    deskShare: .8,
    roomLip: 180,
    lampX: 396,
    lampY: 17,
    lampLowerAngle: -142.6818247177271,
    lampUpperAngle: 110.41274403236815,

    objectPlacements: {
      "sitePlan": {
        "rotation": -8,
        "x": 481,
        "y": 415
      },

      "poster": {
        "rotation": -5,
        "x": 1154,
        "y": 410
      },

      "setTimes": {
        "rotation": 4,
        "x": 812,
        "y": 402
      },

      "contract": {
        "rotation": -3,
        "x": 637,
        "y": 346
      },

      "dossier": {
        "rotation": -9,
        "x": -294,
        "y": 298
      },

      "clock": {
        "rotation": 5.5,
        "x": 681,
        "y": 146
      },

      "cradle": {
        "rotation": -19,
        "x": 39,
        "y": 58
      },

      "mug": {
        "rotation": -15,
        "x": 67,
        "y": 185
      },

      "rolodex": {
        "rotation": 9,
        "x": 1267,
        "y": 15
      },

      "handheld": {
        "rotation": -5,
        "x": 490,
        "y": 297
      },

      "labelBro": {
        "rotation": 3.5,
        "x": 1016,
        "y": 4
      },

      "pen": {
        "rotation": 8,
        "x": 1120,
        "y": 273
      },

      "walkman": {
        "rotation": -6,
        "x": 113,
        "y": 525
      },

      "phone": {
        "rotation": 0,
        "x": 333,
        "y": -32
      }
    },

    showObjects: true,
    wood: "oak"
  },
};

/** A populated experiment; all numeric ranges are yours to explore. */
export const PhysicalSetup: Story = {
  args: { eyeHeightMm: 1650, viewerSetbackMm: 650, deskShare: 0.8, roomLip: 180 },
  render: function Experiment(args) {
    const [currentArgs, updateArgs] = useArgs<typeof args>();
    return <RoomExperiment args={currentArgs} update={updateArgs}>{values => <PerspectiveDesk {...withLightTuning(values)} headTiltDegrees={values.headTiltDegrees} showSettings={false} only={['mug', 'pen', 'handheld', 'cradle']} />}</RoomExperiment>;
  },
};
