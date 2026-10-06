import { LAMP_WIDTH, LAMP_HEIGHT } from '../../../geometry/physicalScale';
import { DeskObjectStudy } from '../../../experience/debug/ObjectStudy/DeskObjectStudy';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Movable, type Place } from '../../../behaviors/Movable/Movable';
import { Perspective, GENTLE_VIEW, GENTLE_DEPTH } from '../../../behaviors/Perspective/Perspective';
import { DeskLighting, useDeskLight } from '../../../behaviors/DeskLighting/DeskLighting';
import { Desk } from '../Desk/Desk';
import { LampShadows } from './LampShadows';
import { DESK_LAMP_ENAMELS, DeskLamp, LampLight } from './DeskLamp';

const meta = {
  title: 'Library/Components/3D/Desk Lamp',
  component: DeskLamp,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: {
    shadowStrength: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    enamel: { control: 'inline-radio', options: DESK_LAMP_ENAMELS },
    rotation: { control: { type: 'range', min: -180, max: 180, step: 1 } },
  },
  args: { shadowStrength: 0.36, on: true, enamel: 'red', rotation: 0 },
} satisfies Meta<typeof DeskLamp>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The lamp on a desk, throwing its pool; the shade is the switch, and the desk dims when it is off. */
function Lit(args: Story['args']) { return <ArticulatedLamp {...args} />; }

/** On. Click the shade. */
export const On: Story = {
  render: (args) => <Lit {...args} />,
};

/** Off, in a mustard enamel. */
export const Off: Story = {
  args: { on: false, enamel: 'mustard' },
  render: (args) => <Lit {...args} />,
};

function RegisteredPool() {
  const light = useDeskLight();
  if (!light) return null;
  const width = light.height * 1.4;
  return <LampLight on={light.on} style={{ position: 'absolute', width: `${width / 1440 * 100}%`, aspectRatio: '1', left: `${(light.x - width / 2) / 1440 * 100}%`, top: `${(light.y - width / 2) / 900 * 100}%` }} />;
}
function ArticulatedLamp(args: Story['args']) {
  const [place, setPlace] = useState<Place>({ x: 240, y: 100, rotation: args?.rotation ?? 0 });
  const [on, setOn] = useState(args?.on ?? true);
  const camera = { angle: GENTLE_VIEW, depth: GENTLE_DEPTH, width: 1440, surfaceHeight: 900 };
  return <div style={{ maxWidth: 1100, margin: 'auto', padding: 24, background: '#211b16' }}>
    <p style={{ color: '#e8dfcc', font: '15px/1.5 system-ui' }}>Drag the base to move. Use the corner grip to rotate. Drag the shade to aim; click to switch.</p>
    <DeskLighting><Perspective {...camera} className="perspective--lamp-study"><Desk height={900}>
      <RegisteredPool />
      <LampShadows surfaceHeight={900} />
      <Movable {...place} width={LAMP_WIDTH} className="perspective__lamp" label="Desk lamp" onMove={(to) => setPlace((at) => ({ ...at, ...to }))}>
        <DeskLamp {...args} rotation={0} camera={camera} lightPosition={{ ...place, width: LAMP_WIDTH, height: LAMP_HEIGHT }} on={on} onToggle={(next) => { setOn(next); args?.onToggle?.(next); }} />
      </Movable>
    </Desk></Perspective></DeskLighting>
  </div>;
}

export const OnDesk: Story = {
  name: 'On desk',
  parameters: { layout: 'fullscreen', composition: true },
  render: () => <DeskObjectStudy name="Desk lamp" bare />,
};
