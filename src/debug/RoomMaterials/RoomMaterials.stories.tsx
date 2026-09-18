import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DeskRoom } from '../../foundations/Room/DeskRoom';

function MaterialCrop() {
  const [expanded, setExpanded] = useState(false);
  return <>
    <button onClick={() => setExpanded(value => !value)}>Toggle coverage</button>
    <div data-material-preview style={{ position: 'relative', width: 800, aspectRatio: '16 / 9', containerType: 'inline-size' }}>
      <DeskRoom angle={54} depth={3000} deskShare={.8} deskWidth={1440} deskDepth={960} stand={900} lip={180}
        span={expanded ? 7201 : 5600} front={expanded ? 1807 : 1400} wallHeight={expanded ? 3701 : 2880}
        blur={0} dim={0} shadowStrength={0} />
    </div>
  </>;
}
const meta = { title: 'Debug/Room Materials', component: MaterialCrop, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof MaterialCrop>;
export default meta;
export const StableCoverage: StoryObj<typeof meta> = {};
