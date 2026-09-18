import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type CSSProperties } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import demoTape from '../../../assets/audio/demo-tape.mp3';
import { Desk } from '../../components/3D/Desk/Desk';
import { Walkman } from '../../components/3D/Walkman/Walkman';
import { Movable, type Place } from '../Movable/Movable';
import { GENTLE_DEPTH, GENTLE_VIEW, Perspective, type PerspectiveProps } from './Perspective';
import './WalkmanPerspective.css';
import { elevatedLayer } from './elevation';
import { mmToUnits as mm } from '../../geometry/physicalScale';

const meta = {
  title: 'Foundations/Behaviors/Perspective',
  component: Perspective,
  parameters: { layout: 'fullscreen' },
  args: { angle: GENTLE_VIEW, depth: GENTLE_DEPTH, width: 1440 },
  argTypes: {
    angle: { control: { type: 'range', min: 78, max: 90, step: 1 } },
    depth: { control: { type: 'range', min: 6000, max: 10000, step: 100 } },
    children: { control: false },
  },
} satisfies Meta<typeof Perspective>;
export default meta;
type Story = StoryObj<typeof meta>;

// Match the existing desk's 112 mm width at the shared physical scale. Thickness is
// explicitly estimated: this illustration is not a measured hardware model.
const WIDTH = mm(112);
const CASE_HEIGHT = mm(30);
const DESK_HEIGHT = 850;

function WalkmanStudy(args: PerspectiveProps) {
  const [place, setPlace] = useState<Place>({ x: 450, y: 220, rotation: -9 });
  const layerStyle = (height: number) => {
    const layer = elevatedLayer(height, { ...place, width: WIDTH, drawingWidth: 720, drawingHeight: 590 }, {
      angle: args.angle ?? GENTLE_VIEW, depth: args.depth ?? GENTLE_DEPTH,
      width: args.width ?? 1440, surfaceHeight: DESK_HEIGHT,
    });
    return {
      '--walkman-study-lift-x': `${layer.x / 720 * 100}%`,
      '--walkman-study-lift-y': `${layer.y / 590 * 100}%`,
      '--walkman-study-grow': layer.scale,
    } as CSSProperties;
  };
  return (
    <div className="walkman-study">
      <div className="walkman-study__frame">
        <p>Gentle Walkman · Drag the case; scrub its corner handle to turn. Play the tape or roll the volume wheel. 112 mm drawing width; estimated 30 mm case thickness. 1.2 desk units = 1 mm.</p>
        <Perspective {...args}>
          <Desk height={DESK_HEIGHT} edge={0}>
            <Movable {...place} width={WIDTH} label="Walkman study" onMove={(next) => setPlace((current) => ({ ...current, ...next }))}>
              <div className="walkman-study__case">
                {/* Close slices form a continuous shallow wall, never a cast shadow. */}
                {Array.from({ length: 9 }, (_, index) => (
                  <span key={index} aria-hidden="true" className="walkman-study__wall" style={layerStyle(CASE_HEIGHT * index / 8)} />
                ))}
                <div className="walkman-study__face" style={layerStyle(CASE_HEIGHT)}>
                  <Walkman src={demoTape} title="Spacewalk demo" label="spacewalk demo" finish="silver" rotation={0} volume={0.4} />
                </div>
              </div>
            </Movable>
          </Desk>
        </Perspective>
      </div>
    </div>
  );
}

export const GentleWalkman: Story = {
  name: 'Gentle Walkman',
  render: (args) => <WalkmanStudy {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    const player = canvas.getByRole('group', { name: 'Walkman study' });
    const play = canvas.getByRole('button', { name: 'Play' });
    await expect(play).toBeEnabled();
    // Hold a transport key: exercises its real pointer interaction without
    // depending on the browser's audio-autoplay policy in automated runs.
    const rewind = canvas.getByRole('button', { name: 'Rewind' });
    await user.pointer({ keys: '[MouseLeft>]', target: rewind });
    await expect(canvas.getByRole('status')).toHaveTextContent('Rewinding');
    await user.pointer({ keys: '[/MouseLeft]', target: rewind });
    await expect(canvas.getByRole('status')).toHaveTextContent('Stopped');
    await expect(canvas.getByRole('slider', { name: 'Volume' })).toHaveValue('0.4');
    await expect(player.style.getPropertyValue('--movable-x')).toBe('450');
    player.focus();
    await user.keyboard('{ArrowRight}');
    await expect(player.style.getPropertyValue('--movable-x')).toBe('460');
    await user.keyboard('{ArrowLeft}');
    player.blur();
  },
};
