import { useArgs } from 'storybook/preview-api';
import { articulateLamp, lampPoseAngles } from '../../components/3D/DeskLamp/articulation';
import { DESK_LAMP_ENAMELS } from '../../components/3D/DeskLamp/DeskLamp';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { GENTLE_DEPTH, GENTLE_VIEW } from '../../behaviors/Perspective/Perspective';
import { DESK_WOODS } from '../../components/3D/Desk/Desk';
import { FLOOR_WOODS } from '../../components/3D/Floor/Floor';
import { WALL_FINISHES } from '../../components/3D/Wall/Wall';
import { PerspectiveDesk } from './PerspectiveDesk';

const initialAngles = lampPoseAngles(articulateLamp({ x: 200, y: 420 }));

const meta = {
  title: 'Pages/Perspective Desk',
  component: PerspectiveDesk,
  parameters: { layout: 'fullscreen' },
  render: function Render(args) {
    const [, updateArgs] = useArgs();
    return <PerspectiveDesk {...args} onCaptureSettings={settings => updateArgs(settings)} />;
  },
  tags: ['autodocs'],
  argTypes: {
    angle: { table: { category: 'Camera' }, control: { type: 'range', min: 78, max: 90, step: 1 } },
    depth: { table: { category: 'Camera' }, control: { type: 'range', min: 4000, max: 12000, step: 100 } },
    wood: { table: { category: 'Desktop' }, control: 'inline-radio', options: DESK_WOODS },
    room: { table: { category: 'Room' }, control: 'boolean' },
    floor: { table: { category: 'Room' }, control: 'inline-radio', options: FLOOR_WOODS },
    wall: { table: { category: 'Room' }, control: 'inline-radio', options: WALL_FINISHES },
    deskShare: { table: { category: 'Room' }, control: { type: 'range', min: 0.6, max: 1, step: 0.01 } },
    roomLip: { table: { category: 'Room' }, control: { type: 'range', min: 0, max: 300, step: 5 } },
    roomBlur: { table: { category: 'Room' }, control: { type: 'range', min: 0, max: 3, step: 0.1 } },
    roomDim: { table: { category: 'Room' }, control: { type: 'range', min: 0, max: 1, step: 0.02 } },
    shadowStrength: { table: { category: 'Lighting' }, control: { type: 'range', min: 0, max: 1, step: .01 } },
    lamp: { control: 'boolean', table: { category: 'Lighting' } },
    lampX: { control: { type: 'number', step: 1 }, table: { category: 'Lamp placement' } },
    lampY: { control: { type: 'number', step: 1 }, table: { category: 'Lamp placement' } },
    lampRotation: { control: { type: 'range', min: -180, max: 180, step: .1 }, table: { category: 'Lamp placement' } },
    lampWidth: { control: { type: 'range', min: 240, max: 1440, step: 1 }, table: { category: 'Lamp appearance' } },
    lampEnamel: { control: 'inline-radio', options: DESK_LAMP_ENAMELS, table: { category: 'Lamp appearance' } },
    lampLowerAngle: { control: { type: 'range', min: -180, max: 180, step: .1 }, description: 'Lower arm angle in the lamp’s local drawing. Use Sync story controls to capture the current dragged pose.', table: { category: 'Lamp articulation' } },
    lampUpperAngle: { control: { type: 'range', min: -180, max: 180, step: .1 }, description: 'Upper arm angle; stored separately to preserve the exact elbow bend.', table: { category: 'Lamp articulation' } },
    objectPlacements: { control: 'object', table: { category: 'Desk objects' } },
    showObjects: { control: 'boolean', table: { category: 'Desk objects' } },
    showSettings: { control: 'boolean', table: { category: 'Layout tools' } },
    onCaptureSettings: { table: { disable: true } },
    children: { table: { disable: true } },
    onArrange: { table: { disable: true } },
    onArticulate: { table: { disable: true } },
    onLamp: { table: { disable: true } },
  },
  args: { angle: GENTLE_VIEW, depth: GENTLE_DEPTH, wood: 'walnut', lamp: true, shadowStrength: .36, lampX: 770, lampY: 100, lampRotation: 0, lampWidth: 576, lampEnamel: 'green', lampLowerAngle: initialAngles.lower, lampUpperAngle: initialAngles.upper, onArrange: fn(), onArticulate: fn(), onLamp: fn() },
} satisfies Meta<typeof PerspectiveDesk>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The starting point for the main desk: a clear surface and an articulated lamp. */
export const Desk: Story = {
  args: {
    angle: 78,
    depth: 5700,
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

  play: async ({ canvasElement, args }) => {
    if (import.meta.env.MODE !== 'test') return;
    const canvas = within(canvasElement);
    const lamp = canvas.getByRole('group', { name: 'Desk lamp' });
    const before = lamp.getAttribute('style');
    lamp.focus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(lamp.getAttribute('style')).not.toBe(before);
    await expect(args.onArrange).toHaveBeenCalled();
    const head = canvas.getByRole('button', { name: 'Turn the lamp off' });
    const shade = canvasElement.querySelector('.desk-lamp__shade')!;
    const pose = shade.getAttribute('transform');
    head.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(shade.getAttribute('transform')).not.toBe(pose);
    await userEvent.click(head);
    await expect(args.onLamp).toHaveBeenCalledWith(false);
    await expect(canvasElement.querySelector('.lamp-cast-shadow__light')).toHaveAttribute('opacity', '0');
    await userEvent.click(canvas.getByRole('button', { name: 'Turn the lamp on' }));
    head.blur();
  }
};
