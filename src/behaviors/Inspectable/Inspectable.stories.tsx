import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Desk, DESK_WIDTH } from '../../components/3D/Desk/Desk';
import { Handbill } from '../../experiments/BandIntro/Handbill';
import { BAND_HANDBILL_FRONT, BAND_HANDBILL_BACK } from '../../experiments/BandIntro/Handbill.band';
import { LabelBro, LABEL_BRO_FOOT, LABEL_BRO_HEIGHT } from '../../components/3D/LabelBro/LabelBro';
import { Mug } from '../../components/3D/Mug/Mug';
import { Movable, type Place } from '../Movable/Movable';
import { GENTLE_DEPTH, GENTLE_VIEW, Perspective, Solid } from '../Perspective/Perspective';
import { Inspectable, Inspector, InspectorVeil } from './Inspectable';

const meta = {
  title: 'Foundations/Behaviors/Inspectable',
  component: Inspectable,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: { children: { control: false } },
  args: { id: 'handbill' },
} satisfies Meta<typeof Inspectable>;

export default meta;
type Story = StoryObj<typeof meta>;

const DESK_DEPTH = 900;
/* A thing held up has to be drawn over the veil, and the veil over everything still lying down. */
const DESK_LAYER = 10;
const HELD_LAYER = 5000;

type Id = 'handbill' | 'printer' | 'mug';
const START: Record<Id, Place> = {
  handbill: { x: 170, y: 330, rotation: -7 },
  printer: { x: 640, y: 300, rotation: -4 },
  mug: { x: 1120, y: 330, rotation: -15 },
};
const WIDTHS: Record<Id, number> = { handbill: 300, printer: 260, mug: 200 };
const LABELS: Record<Id, string> = { handbill: 'Band handbill', printer: 'Label printer', mug: 'Mug' };

/**
 * Three things on a desk seen from where someone stands at it. Two of them are
 * worth looking at and one is only ever scenery: click the handbill or the
 * label printer and it comes up off the desk to the middle of the frame, and
 * the mug stays a mug.
 */
function Things() {
  const [places, setPlaces] = useState(START);
  const [held, setHeld] = useState<string>();
  const camera = { angle: GENTLE_VIEW, depth: GENTLE_DEPTH, width: DESK_WIDTH, surfaceHeight: DESK_DEPTH };
  const thing = (id: Id) => ({
    ...places[id],
    width: WIDTHS[id],
    label: LABELS[id],
    z: held === id ? HELD_LAYER : DESK_LAYER,
    resizable: true,
    onMove: (to: Place) => setPlaces(all => ({ ...all, [id]: { ...all[id], ...to } })),
  });
  return (
    <Inspector className="inspectable-story" held={held} onInspect={setHeld} style={{ position: 'relative', background: '#211b16', padding: '2vw' }}>
      <Perspective {...camera}>
        <Desk height={DESK_DEPTH}>
          <InspectorVeil />
          {/* The whole face of a handbill is the button that turns it over, so it is picked up anywhere on it. */}
          <Movable {...thing('handbill')} grab="anywhere">
            <Inspectable id="handbill" grab="anywhere" fill={0.9}>
              <Handbill front={BAND_HANDBILL_FRONT} back={BAND_HANDBILL_BACK} stock="goldenrod" spot="purple" />
            </Inspectable>
          </Movable>
          <Movable {...thing('printer')} pivot={{ x: LABEL_BRO_FOOT.x, y: LABEL_BRO_FOOT.y / (772 / 732) }}>
            <Inspectable id="printer" fill={0.7} upright={false}>
              <Solid localCoordinates height={LABEL_BRO_HEIGHT} foot={LABEL_BRO_FOOT}>
                <LabelBro rotation={0} defaultOn defaultText="BACKLINE" />
              </Solid>
            </Inspectable>
          </Movable>
          <Movable {...thing('mug')}>
            <Mug shadow="contact" />
          </Movable>
        </Desk>
      </Perspective>
    </Inspector>
  );
}

/**
 * Click a thing to bring it up. It never leaves the desk it is lying on, so it
 * keeps the desk's angle as it comes: it is the same object, near to, not a
 * picture of one. Click away or press Escape and it settles back exactly where
 * it was.
 */
export const OnADesk: Story = {
  render: () => <Things />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const held = () => canvasElement.querySelector<HTMLElement>('.inspectable[data-held]');
    /* Nothing is up, so there is nothing to put down: the veil is not in the tree to be found by its name yet. */
    const veil = canvasElement.querySelector<HTMLElement>('.inspector__veil')!;
    await expect(canvas.queryByRole('button', { name: 'Put it back down' })).toBe(null);
    const printer = canvas.getByRole('group', { name: 'Label printer' });
    const face = printer.querySelector<HTMLElement>('.inspectable')!;
    const was = { x: printer.style.getPropertyValue('--movable-x'), y: printer.style.getPropertyValue('--movable-y') };

    // Nothing is up to start with, and the mug is not something to look at.
    await expect(held()).toBe(null);
    await expect(canvas.getByRole('group', { name: 'Mug' }).querySelector('.inspectable')).toBe(null);

    // A press that stays put picks it up: it is carried across the desk and grown, and the veil comes in behind it.
    await userEvent.click(face);
    await waitFor(() => expect(held()).toBe(face));
    await expect(canvas.getByRole('button', { name: 'Put it back down' })).toBe(veil);
    await expect(Number(face.style.getPropertyValue('--inspect-scale'))).toBeGreaterThan(1);
    await expect(Number(getComputedStyle(printer).zIndex)).toBe(HELD_LAYER);
    // Up in the air it is nothing to do with the desk: it has not been moved, and there is nothing to drag it by.
    await expect(printer.style.getPropertyValue('--movable-x')).toBe(was.x);
    await expect(printer.style.getPropertyValue('--movable-y')).toBe(was.y);
    await waitFor(() => expect(getComputedStyle(canvas.getByRole('button', { name: 'Rotate Label printer' })).opacity).toBe('0'));
    // Every key on it still works while it is up, and working it does not put it down.
    await userEvent.click(within(printer).getByRole('button', { name: 'X' }));
    await expect(within(printer).getByLabelText(/the screen reads BACKLINEX/)).toBeInTheDocument();
    await expect(held()).toBe(face);

    // Escape puts it back, exactly where it was lying.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(held()).toBe(null));
    await expect(veil).not.toHaveAttribute('data-held');
    await expect(printer.style.getPropertyValue('--movable-x')).toBe(was.x);
    await expect(Number(getComputedStyle(printer).zIndex)).toBe(DESK_LAYER);

    // Enter on the thing the keyboard has hold of does the same as the click.
    printer.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(held()).toBe(face));
    // And the veil is what puts it down again.
    await userEvent.click(veil);
    await waitFor(() => expect(held()).toBe(null));
  },
};

/**
 * A handbill is one big button to turn it over, so there is nothing left of its
 * face to pick it up by: the first press takes it off the desk without the face
 * ever hearing it, and every press after that turns it over while it is up.
 */
export const PickedUpAnywhere: Story = {
  render: () => <Things />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const held = () => canvasElement.querySelector<HTMLElement>('.inspectable[data-held]');
    const handbill = canvas.getByRole('group', { name: 'Band handbill' });
    const face = handbill.querySelector<HTMLElement>('.inspectable')!;
    const turn = within(handbill).getByRole('button', { name: 'Turn the handbill over' });

    await userEvent.click(turn);
    await waitFor(() => expect(held()).toBe(face));
    // It came up the right way round: picking it up was not also turning it over.
    await expect(turn).toHaveAccessibleName('Turn the handbill over');
    await userEvent.click(turn);
    await waitFor(() => expect(turn).toHaveAccessibleName('Turn the handbill back'));
    await expect(held()).toBe(face);
  },
};
