import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type CSSProperties } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import performance from '../../../assets/ambient/repainted-performance.mp4';
import { Desk } from '../../components/3D/Desk/Desk';
import { Handheld } from '../../components/3D/Handheld/Handheld';
import { Movable, type Place } from '../Movable/Movable';
import { GENTLE_DEPTH, GENTLE_VIEW, Perspective } from './Perspective';
import { elevatedLayer } from './elevation';
import { mm, SIZES } from '../../pages/Desk/PromoterDesk';
import './HandheldPerspective.css';

const meta = {
  title: 'Behaviors/Perspective',
  component: Perspective,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    angle: { control: { type: 'range', min: 78, max: 90, step: 1 } },
    depth: { control: { type: 'range', min: 6000, max: 12000, step: 100 } },
    children: { control: false },
  },
  args: { angle: GENTLE_VIEW, depth: GENTLE_DEPTH, width: 1440 },
} satisfies Meta<typeof Perspective>;
export default meta;
type Story = StoryObj<typeof meta>;

// Preserve the shared desk layout width: its original 170 mm shell is scaled to 204 mm.
// Thickness remains an explicit 23 mm estimate for this PSP-like component.
const HANDHELD_THICKNESS_MM = 23;

function GentleHandheldScene(args: Story['args']) {
  const [place, setPlace] = useState<Place>({ x: 550, y: 320, rotation: -7 });
  const layerStyle = (fraction: number): CSSProperties => {
    const layer = elevatedLayer(mm(HANDHELD_THICKNESS_MM) * fraction,
      { ...place, width: SIZES.handheld, drawingWidth: 720, drawingHeight: 327 },
      { angle: args?.angle ?? GENTLE_VIEW, depth: args?.depth ?? GENTLE_DEPTH, width: 1440, surfaceHeight: 800 });
    return { '--shell-x': layer.x, '--shell-y': layer.y, '--shell-scale': layer.scale } as CSSProperties;
  };
  return (
    <div className="handheld-perspective-study">
      <div className="handheld-perspective-study__frame">
        <p>Gentle handheld · 204 mm desk width (original 170 mm art); estimated thickness 23 mm. Drag the shell; scrub the corner handle to turn. The original player controls still work. Set Angle to 90° to compare overhead.</p>
        <Perspective {...args}>
          <Desk height={800} edge={0}>
            <Movable {...place} width={SIZES.handheld} label="Handheld console" onMove={(to) => setPlace((at) => ({ ...at, ...to }))}>
                <div className="handheld-perspective-shell">
                  {/* Eight overlapping silhouettes close the shallow gap without redrawing the original controls. */}
                  {Array.from({ length: 8 }, (_, index) => (
                    <div key={index} aria-hidden="true" className="handheld-perspective-shell__layer" style={layerStyle(index / 8)}>
                      <div className="handheld-perspective-shell__side" />
                    </div>
                  ))}
                  <div className="handheld-perspective-shell__face" style={layerStyle(1)}>
                    <Handheld video={performance} title="Funkadelic Astronaut · performance" finish="silver" />
                  </div>
                </div>
            </Movable>
          </Desk>
        </Perspective>
      </div>
    </div>
  );
}

export const GentleHandheld: Story = {
  name: 'Gentle handheld',
  render: (args) => <GentleHandheldScene {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const movable = canvas.getByRole('group', { name: 'Handheld console' });
    const player = canvas.getByRole('group', { name: 'Handheld player: Funkadelic Astronaut · performance' });
    const readout = canvas.getByRole('button', { name: 'Select: show readout' });
    await userEvent.click(readout);
    await expect(readout).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', { name: 'Triangle: show readout' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(readout);
    await userEvent.click(canvas.getByRole('button', { name: 'Display brightness' }));
    await expect(player.style.getPropertyValue('--handheld-brightness')).toBe('0.85');
    await userEvent.click(canvas.getByRole('button', { name: 'Display brightness' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Display brightness' }));
    await expect(movable.style.getPropertyValue('--movable-x')).toBe('550');
    movable.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(movable.style.getPropertyValue('--movable-x')).toBe('560');
    await userEvent.keyboard('{ArrowLeft}');
    const grip = canvas.getByRole('button', { name: 'Rotate Handheld console' });
    grip.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(movable.style.getPropertyValue('--movable-rotation')).toBe('-6deg');
    await userEvent.keyboard('{ArrowLeft}');
    grip.blur();
  },
};
