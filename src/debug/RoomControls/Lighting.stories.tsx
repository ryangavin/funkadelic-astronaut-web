import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { DeskLighting } from '../../behaviors/DeskLighting/DeskLighting';
import { DeskLamp } from '../../components/3D/DeskLamp/DeskLamp';
import { LampPool } from '../../components/3D/DeskLamp/LampShadows';
import { DEFAULT_LIGHT_TUNING } from '../../geometry/lightingSetup';

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
const meta = { title: 'Debug/Room lighting', component: DirectLight } satisfies Meta<typeof DirectLight>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Standalone callers have no placeId; registration must carry the same tuning as Room. */
export const DirectRegistration: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pool = canvasElement.querySelector<HTMLElement>('.lamp-light')!;
    await waitFor(() => expect(pool).toHaveAttribute('data-on'));
    const width = parseFloat(pool.style.width);
    await userEvent.click(canvas.getByRole('button', { name: 'Brighter' }));
    await waitFor(() => expect(pool.style.filter).toBe('brightness(3)'));
    await userEvent.click(canvas.getByRole('button', { name: 'Wider pool' }));
    await waitFor(() => expect(parseFloat(pool.style.width)).toBeCloseTo(width * 2));
    await userEvent.click(canvas.getByRole('button', { name: 'Zero emission' }));
    await waitFor(() => expect(pool.style.visibility).toBe('hidden'));
    expect(pool).not.toHaveAttribute('data-on');
  },
};
