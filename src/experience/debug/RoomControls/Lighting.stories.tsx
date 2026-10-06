import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DeskLighting } from '../../../behaviors/DeskLighting/DeskLighting';
import { DeskLamp } from '../../../components/3D/DeskLamp/DeskLamp';
import { LampPool } from '../../../components/3D/DeskLamp/LampShadows';
import { DEFAULT_LIGHT_TUNING } from '../../../geometry/lightingSetup';

function DirectLight() {
  const [intensity, setIntensity] = useState(1);
  const [spread, setSpread] = useState(1.4);
  return <>
    <button onClick={() => setIntensity(3)}>Brighter</button>
    <button onClick={() => setIntensity(0)}>Zero emission</button>
    <button onClick={() => setSpread(2.8)}>Wider pool</button>
    <DeskLighting>
      <div style={{ position: 'relative', width: 720, height: 480, background: '#4d3220' }}>
        <LampPool surfaceWidth={1440} surfaceHeight={960} />
        <div style={{ width: 250 }}><DeskLamp intensity={intensity} tuning={{ ...DEFAULT_LIGHT_TUNING, poolSpread: spread }} lightPosition={{ x: 500, y: 350, width: 576, height: 420 }} /></div>
      </div>
    </DeskLighting>
  </>;
}
const meta = { title: 'Experience/Debug/Room lighting', component: DirectLight } satisfies Meta<typeof DirectLight>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A lamp lighting its pool outside a Room, with no placeId; the buttons brighten it, widen the pool and switch it off. */
export const DirectRegistration: Story = {};
