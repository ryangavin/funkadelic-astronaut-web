import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Desk } from '../Desk/Desk';
import { Pin } from '../Pin/Pin';
import { Stage } from '../Stage/Stage';
import { DESK_LAMP_ENAMELS, DeskLamp, LampLight } from './DeskLamp';

const meta = {
  title: 'Components/Desk Lamp',
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
function Lit(args: Story['args']) {
  const [on, setOn] = useState(args?.on ?? true);
  return (
    <Stage height={600}>
      <Desk height={600} light={on ? 1 : 0.5}>
        <Pin x={160} y={80} width={900}>
          <LampLight on={on} />
        </Pin>
        <Pin x={300} y={-60} width={960}>
          <DeskLamp
            {...args}
            on={on}
            onToggle={(next) => {
              setOn(next);
              args?.onToggle?.(next);
            }}
          />
        </Pin>
      </Desk>
    </Stage>
  );
}

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
