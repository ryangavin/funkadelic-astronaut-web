import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Desk } from '../../components/Desk/Desk';
import { CRADLE_BALLS, CRADLE_PERIOD_MS, CRADLE_RADIUS, CRADLE_RAILS, CRADLE_REST, CRADLE_SWING, NewtonsCradle } from '../../components/NewtonsCradle/NewtonsCradle';
import { Movable, type Place } from '../Movable/Movable';
import { GENTLE_DEPTH, GENTLE_VIEW, Perspective, type PerspectiveProps } from './Perspective';
import { SIZES, mm } from '../../pages/Desk/PromoterDesk';
import { projectElevation } from './elevation';
import './CradlePerspective.css';

const meta = {
  title: 'Behaviors/Perspective',
  component: Perspective,
  parameters: { layout: 'fullscreen' },
  args: { angle: GENTLE_VIEW, depth: GENTLE_DEPTH, width: 1440 },
  argTypes: {
    angle: { control: { type: 'range', min: 78, max: 90, step: 1 } },
    depth: { control: { type: 'range', min: 4000, max: 10000, step: 100 } },
    children: { control: false },
  },
} satisfies Meta<typeof Perspective>;
export default meta;
type Story = StoryObj<typeof meta>;

function CradleScene(args: PerspectiveProps) {
  const [place, setPlace] = useState<Place>({ x: 440, y: 150, rotation: -8 });
  const [swinging, setSwinging] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!swinging) { setElapsed(0); return; }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => { setElapsed(now - start); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [swinging]);
  const camera = { angle: args.angle ?? GENTLE_VIEW, depth: args.depth ?? GENTLE_DEPTH, width: args.width ?? 1440, surfaceHeight: 800 };
  const turn = (place.rotation ?? 0) * Math.PI / 180;
  const unit = SIZES.cradle / 720;
  // Width is the existing 120 mm. These elevations are explicit estimates:
  // base top 8 mm, rail centre 90 mm, resting ball centre 20 mm.
  const point = (x: number, y: number, heightMm: number) => {
    const lx = (x - 360) * unit;
    const ly = (y - 300) * unit;
    const cx = place.x + SIZES.cradle / 2;
    const cy = place.y + 600 * unit / 2;
    const projected = projectElevation(cx + lx * Math.cos(turn) - ly * Math.sin(turn), cy + lx * Math.sin(turn) + ly * Math.cos(turn), heightMm * mm(1), camera);
    const dx = projected.x - cx;
    const dy = projected.y - cy;
    return { x: 360 + (dx * Math.cos(turn) + dy * Math.sin(turn)) / unit, y: 300 + (-dx * Math.sin(turn) + dy * Math.cos(turn)) / unit, scale: projected.scale };
  };
  const line = (a: ReturnType<typeof point>, b: ReturnType<typeof point>) => `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
  const phase = elapsed / CRADLE_PERIOD_MS * 2 * Math.PI;
  const balls = CRADLE_BALLS.map((x, index) => {
    const travel = swinging ? (index === 0 ? -Math.max(0, Math.sin(phase)) : index === 4 ? Math.max(0, -Math.sin(phase)) : 0) * CRADLE_SWING : 0;
    const horizontalMm = travel / 6;
    // Constant string length: a displaced ball rises, with both anchors fixed.
    const height = 90 - Math.sqrt(70 ** 2 - horizontalMm ** 2);
    return { x, at: point(x + travel, CRADLE_REST, height) };
  });
  const base = point(360, 300, 8);
  return (
    <div className="cradle-perspective-study">
      <div className="cradle-perspective-study__scene">
        <p>Gentle Newton’s cradle · Click to swing or stop. Drag the base; scrub the corner handle to rotate. Set Angle to 90° to compare overhead.</p>
        <Perspective {...args}>
          <Desk height={800} edge={0}>
            <Movable {...place} width={SIZES.cradle} label="Newton’s cradle" grab="anywhere" onMove={next => setPlace(current => ({ ...current, ...next }))}>
              <div className="cradle-perspective-study__object">
                <NewtonsCradle sound={false} onSwing={setSwinging} />
                <svg className="cradle-perspective-study__posts" viewBox="0 0 720 600" aria-hidden="true">
                  <rect x="20" y="30" width="680" height="540" rx="34" fill="#110d0a" />
                  <rect x="20" y="30" width="680" height="540" rx="34" fill="url(#cradle-base)" stroke="#534036" strokeWidth="2" transform={`translate(${base.x} ${base.y}) scale(${base.scale}) translate(-360 -300)`} />
                  {CRADLE_RAILS.map(y => (
                    <g key={y}>
                      {[70, 650].map(x => <path key={x} d={line(point(x, y, 8), point(x, y, 90))} stroke="#949aa1" strokeWidth="19" strokeLinecap="round" />)}
                      <path d={line(point(70, y, 90), point(650, y, 90))} stroke="#bdc2ca" strokeWidth="14" strokeLinecap="round" />
                      {[70, 650].map(x => { const cap = point(x, y, 90); return <circle key={x} cx={cap.x} cy={cap.y} r={16 * cap.scale} fill="url(#cradle-rail)" />; })}
                    </g>
                  ))}
                  {balls.map(({ x, at }) => (
                    <g key={x}>
                      {CRADLE_RAILS.map(y => <path key={y} d={line(point(x, y, 90), at)} stroke="#d8dbdf" strokeWidth="2" />)}
                      <circle cx={at.x} cy={at.y} r={CRADLE_RADIUS * at.scale} fill="url(#cradle-ball)" />
                      <circle cx={at.x - 14 * at.scale} cy={at.y - 18 * at.scale} r={9 * at.scale} fill="#fff" opacity="0.7" />
                    </g>
                  ))}
                </svg>
              </div>
            </Movable>
          </Desk>
        </Perspective>
        <p className="cradle-perspective-study__note">120 × 100 mm footprint at the shared desk scale. Estimated elevations: base 8 mm, rails 90 mm, resting ball centres 20 mm. Each point projects through the same camera; strings join raised rails to moving balls. Ball height follows fixed string length. Original start/stop and settling remain; motion is illustrative, not a collision simulation.</p>
      </div>
    </div>
  );
}

export const GentleCradle: Story = {
  name: 'Gentle Newton’s cradle',
  render: args => <CradleScene {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const object = canvas.getByRole('group', { name: 'Newton’s cradle' });
    await userEvent.click(canvas.getByRole('button', { name: 'Set the cradle going' }));
    await expect(canvas.getByRole('button', { name: 'Stop the cradle' })).toHaveAttribute('aria-pressed', 'true');
    const ball = canvasElement.querySelector('.newtons-cradle__hanger[data-end="left"] .newtons-cradle__ball')!;
    await expect(getComputedStyle(ball).animationName).toBe('cradle-swing-left');
    await userEvent.click(canvas.getByRole('button', { name: 'Stop the cradle' }));
    await expect(canvas.getByRole('button', { name: 'Set the cradle going' })).toHaveAttribute('aria-pressed', 'false');
    object.focus();
    await userEvent.keyboard('{ArrowRight}]');
    await expect(object.style.getPropertyValue('--movable-x')).toBe('450');
    await expect(object.style.getPropertyValue('--movable-rotation')).toBe('-7deg');
    await userEvent.keyboard('{ArrowLeft}[[');
    object.blur();
  },
};
