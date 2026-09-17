import { checkDeskStudy } from '../../../behaviors/Perspective/DeskObjectStudy.check';
import { DeskObjectStudy } from '../../../behaviors/Perspective/DeskObjectStudy';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Movable, type Place } from '../../../behaviors/Movable/Movable';
import { Perspective, GENTLE_VIEW, GENTLE_DEPTH } from '../../../behaviors/Perspective/Perspective';
import { DeskLighting, useDeskLight } from '../../../behaviors/DeskLighting/DeskLighting';
import { Desk } from '../Desk/Desk';
import { LampShadows } from './LampShadows';
import { DESK_LAMP_ENAMELS, DeskLamp, LampLight } from './DeskLamp';

const meta = {
  title: 'Components/3D/Desk Lamp',
  component: DeskLamp,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: {
    shadowStrength: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    enamel: { control: 'inline-radio', options: DESK_LAMP_ENAMELS },
    rotation: { control: { type: 'range', min: -180, max: 180, step: 1 } },
  },
  args: { shadowStrength: 0.36, on: true, enamel: 'red', rotation: 0, onToggle: fn() },
} satisfies Meta<typeof DeskLamp>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The lamp on a desk, throwing its pool; the shade is the switch, and the desk dims when it is off. */
function Lit(args: Story['args']) { return <ArticulatedLamp {...args} />; }

/** On. Click the shade. */
export const On: Story = {
  render: (args) => <Lit {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector('.lamp-light')).toHaveAttribute('data-on');
    await userEvent.click(canvas.getByRole('button', { name: 'Turn the lamp off' }));
    await expect(args.onToggle).toHaveBeenCalledWith(false);
    await expect(canvasElement.querySelector('.lamp-light')).not.toHaveAttribute('data-on');
    await expect(canvas.getByRole('button', { name: 'Turn the lamp on' })).toHaveAttribute('aria-pressed', 'false');
  },
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
      <Movable {...place} width={960} className="perspective__lamp" label="Desk lamp" onMove={(to) => setPlace((at) => ({ ...at, ...to }))}>
        <DeskLamp {...args} rotation={0} camera={camera} lightPosition={{ ...place, width: 960, height: 700 }} on={on} onToggle={(next) => { setOn(next); args?.onToggle?.(next); }} />
      </Movable>
    </Desk></Perspective></DeskLighting>
  </div>;
}

export const Articulated: Story = {
  render: (args) => <ArticulatedLamp {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const lamp = canvas.getByRole('group', { name: 'Desk lamp' });
    const head = canvas.getByRole('button', { name: 'Turn the lamp off' });
    const base = canvasElement.querySelector<HTMLElement>('.desk-lamp__base-handle')!;
    const pool = canvasElement.querySelector<HTMLElement>('.lamp-light')!;
    const dragBy = async (element: HTMLElement, dx: number, dy: number) => {
      const box = element.getBoundingClientRect();
      const x = box.left + box.width / 2, y = box.top + box.height / 2;
      await userEvent.pointer([
        { keys: '[MouseLeft>]', target: element, coords: { clientX: x, clientY: y } },
        { coords: { clientX: x + dx / 2, clientY: y + dy / 2 } },
        { coords: { clientX: x + dx, clientY: y + dy } },
        { keys: '[/MouseLeft]' },
      ]);
    };
    const lampBefore = lamp.getAttribute('style');
    const baseBefore = base.getBoundingClientRect();
    const poolBefore = pool.style.left;
    const cast = canvasElement.querySelector('.lamp-cast-shadow__light')!;
    const armShadow = canvasElement.querySelector('.lamp-cast-shadow__upper-arm')!;
    const armBefore = armShadow.getAttribute('d');
    await dragBy(head, 60, -25);
    await expect(lamp.getAttribute('style')).toBe(lampBefore);
    await expect(base.getBoundingClientRect().left).toBeCloseTo(baseBefore.left, 1);
    await expect(pool.style.left).not.toBe(poolBefore);
    await expect(armShadow.getAttribute('d')).not.toBe(armBefore);
    await expect(Number(cast.getAttribute('opacity'))).toBeGreaterThan(0);
    await expect(head).toHaveAttribute('aria-pressed', 'true');
    await dragBy(base, -55, 20);
    await expect(lamp.getAttribute('style')).not.toBe(lampBefore);
    const grip = canvas.getByRole('button', { name: 'Rotate Desk lamp' });
    grip.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(lamp.style.getPropertyValue('--movable-rotation')).toBe('1deg');
    const headBefore = canvasElement.querySelector('.desk-lamp__shade')!.getAttribute('transform');
    head.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvasElement.querySelector('.desk-lamp__shade')!.getAttribute('transform')).not.toBe(headBefore);
    await userEvent.click(head);
    await expect(head).toHaveAttribute('aria-pressed', 'false');
    await expect(cast).toHaveAttribute('opacity', '0');
    await expect(canvasElement.querySelector('.lamp-contact-shadow')).toBeInTheDocument();
    await userEvent.click(head);
    head.blur();
  },
};

export const OnDesk: Story = {
  play: checkDeskStudy,
  name: 'On desk',
  parameters: { layout: 'fullscreen', composition: true },
  render: () => <DeskObjectStudy name="Desk lamp" bare />,
};
