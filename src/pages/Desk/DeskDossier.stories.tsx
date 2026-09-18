import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { PerspectiveDesk } from './PerspectiveDesk';
import { DOSSIER_OPEN_TARGETS, DOSSIER_SPILL_TARGETS } from './DeskDossier';
import { mmToUnits } from '../../geometry/physicalScale';

const meta = {
  title: 'Pages/Desk Dossier',
  component: PerspectiveDesk,
  parameters: { layout: 'fullscreen' },
  args: { showSettings: false, only: ['dossier', 'pen', 'walkman'] },
} satisfies Meta<typeof PerspectiveDesk>;
export default meta;
type Story = StoryObj<typeof meta>;
const x = (element: HTMLElement) => Number(element.style.getPropertyValue('--movable-x'));
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Closed contents cost no mounted media or hidden controls; the cover remains movable. */
export const OpenAndReturn: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dossier = canvas.getByRole('group', { name: 'Band dossier' });
    const pen = canvas.getByRole('group', { name: 'Pen' });
    const penStart = x(pen);
    await expect(canvasElement.querySelectorAll('.spilled, .member-pile, .one-sheet, .polaroid, iframe')).toHaveLength(0);
    dossier.focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    const beforeDrag = x(dossier);
    const box = dossier.getBoundingClientRect();
    const pointer = (type: string, dx: number) => dossier.dispatchEvent(new PointerEvent(type, {
      bubbles: true, pointerId: 41, pointerType: 'mouse', button: 0,
      buttons: type === 'pointerup' ? 0 : 1, clientX: box.x + box.width * .75 + dx, clientY: box.y + box.height / 2,
    }));
    pointer('pointerdown', 0);
    pointer('pointermove', 35);
    pointer('pointerup', 35);
    await waitFor(() => expect(x(dossier)).toBeGreaterThan(beforeDrag));
    const closedPlace = { x: x(dossier), y: Number(dossier.style.getPropertyValue('--movable-y')), rotation: -2 };
    await userEvent.click(canvas.getByRole('button', { name: 'Open the press package' }));
    const spill = canvasElement.querySelector<HTMLElement>('.desk-dossier__spill')!;
    await expect(spill.closest('.folder__contents-layer')).not.toBeNull();
    await expect(spill).toHaveAttribute('data-hide-packed', 'false');
    await expect(spill.querySelectorAll('.spilled')).toHaveLength(10);
    // The surrounding pen takes intermediate positions rather than teleporting.
    await waitFor(() => expect(Number(pen.style.getPropertyValue('--movable-y'))).toBeLessThan(330));
    await expect(Number(pen.style.getPropertyValue('--movable-y'))).toBeGreaterThan(DOSSIER_OPEN_TARGETS.pen.y);
    await waitFor(() => expect(x(dossier)).toBe(DOSSIER_OPEN_TARGETS.dossier.x), { timeout: 1500 });
    await expect(x(pen)).toBe(DOSSIER_OPEN_TARGETS.pen.x);
    const packet = await canvas.findByRole('group', { name: 'Ryan Gavin packet' }, { timeout: 3000 });
    await expect(x(packet)).toBe(DOSSIER_SPILL_TARGETS['dossier-ryan'].x);
    const content = packet.querySelector('.packet');
    packet.focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    await expect(x(packet)).toBe(DOSSIER_SPILL_TARGETS['dossier-ryan'].x + 20);
    await expect(packet.querySelector('.packet')).toBe(content);
    await userEvent.click(canvas.getByRole('button', { name: 'Close the press package' }));
    await expect(spill).toHaveAttribute('inert');
    await expect(dossier).toHaveAttribute('data-dossier-phase', 'returning');
    await expect(dossier.querySelector('.folder')).toHaveAttribute('data-open', 'true');
    const returnedPacket = spill.querySelector('.packet');
    await waitFor(() => expect(dossier).toHaveAttribute('data-dossier-phase', 'closing'), { timeout: 2300 });
    await expect(spill.querySelector('.packet')).toBe(returnedPacket);
    for (const paper of spill.querySelectorAll('.spilled')) {
      await expect(getComputedStyle(paper).visibility).toBe('visible');
      await expect(getComputedStyle(paper).opacity).toBe('1');
    }
    await expect(dossier.querySelector('.folder')).toHaveAttribute('data-open', 'false');
    await expect(spill.querySelectorAll('.spilled')).toHaveLength(10);
    await waitFor(() => expect(x(dossier)).toBe(closedPlace.x), { timeout: 1500 });
    await expect(x(pen)).toBe(penStart);
    await waitFor(() => expect(canvasElement.querySelectorAll('.spilled')).toHaveLength(0), { timeout: 3500 });
    await expect(canvasElement.querySelectorAll('iframe, .packet, .one-sheet')).toHaveLength(0);
    // Reopen, rapidly reverse twice, then let the old closing deadline pass.
    await userEvent.click(canvas.getByRole('button', { name: 'Open the press package' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Close the press package' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Open the press package' }));
    await wait(3100);
    const reopenedSpill = canvasElement.querySelector('.desk-dossier__spill')!;
    await expect(reopenedSpill.querySelectorAll('.spilled')).toHaveLength(10);
    await expect(reopenedSpill).not.toHaveAttribute('inert');
    await expect(x(canvas.getByRole('group', { name: 'Ryan Gavin packet' }))).toBe(DOSSIER_SPILL_TARGETS['dossier-ryan'].x);
  },
};

/** Complete room composition for visual arrangement inspection. */
export const WholeRoom: Story = { args: { only: undefined } };

/** The real room's lamp and spilled papers leave the tab reachable by pointer. */
export const ReachableTab: Story = {
  args: { only: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const reachable = (button: HTMLElement) => {
      const box = button.getBoundingClientRect();
      const hit = canvasElement.ownerDocument.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      expect(hit === button || button.contains(hit)).toBe(true);
    };
    const open = canvas.getByRole('button', { name: 'Open the press package' });
    await waitFor(() => reachable(open));
    await userEvent.click(open);
    const close = canvas.getByRole('button', { name: 'Close the press package' });
    await wait(2300);
    reachable(close);
    await userEvent.click(close);
    await waitFor(() => expect(canvasElement.querySelectorAll('.spilled')).toHaveLength(0), { timeout: 3500 });
  },
};

/** Store coordinates, rendered movement and solid projection agree mid-flight. */
export const MotionStaysAligned: Story = {
  args: { only: ['dossier', 'pen', 'mug', 'phone', 'rolodex', 'labelBro'], angle: 80, depth: 5000 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pen = canvas.getByRole('group', { name: 'Pen' });
    const ordinaryTransition = getComputedStyle(pen).transitionProperty;
    const solids = ['Mug', 'Desk phone', 'Rolodex', 'Label Bro'].map(name => {
      const body = canvas.getAllByRole('group', { name }).find(element => element.classList.contains('movable'))!;
      const solid = body.querySelector<HTMLElement>('.solid')!;
      const projection = () => ['--solid-rise', '--solid-splay', '--solid-turn'].map(key => solid.style.getPropertyValue(key)).join(',');
      return { body, solid, projection, before: projection(), content: solid.querySelector('.solid__upright')!.firstElementChild };
    });
    await userEvent.click(canvas.getByRole('button', { name: 'Open the press package' }));
    await waitFor(() => expect(Number(pen.style.getPropertyValue('--movable-y'))).toBeLessThan(320));
    await expect(pen).toHaveAttribute('data-arranging');
    await expect(pen).not.toHaveAttribute('data-dragging');
    // Computed translate is the browser's rendered value, not the requested
    // custom property: double easing used to leave these tens of pixels apart.
    const rendered = getComputedStyle(pen);
    const unit = parseFloat(rendered.width) / mmToUnits(149);
    const translation = rendered.translate.split(' ').map(parseFloat);
    await expect(translation[0]).toBeCloseTo(x(pen) * unit, 1);
    await expect(translation[1]).toBeCloseTo(Number(pen.style.getPropertyValue('--movable-y')) * unit, 1);
    const lifted = getComputedStyle(pen.querySelector('.movable__lift')!);
    await expect(parseFloat(lifted.rotate)).toBeCloseTo(parseFloat(pen.style.getPropertyValue('--movable-rotation')), 2);
    for (const item of solids) {
      await waitFor(() => expect(item.projection()).not.toBe(item.before));
      await expect(item.body.querySelector('.solid')).toBe(item.solid);
      await expect(item.solid.querySelector('.solid__upright')!.firstElementChild).toBe(item.content);
    }
    await waitFor(() => expect(pen).not.toHaveAttribute('data-arranging'), { timeout: 1500 });
    await expect(getComputedStyle(pen).transitionProperty).toBe(ordinaryTransition);
  },
};

/** Papers stay opaque and mounted under the actual cover through both swings. */
export const CoverOcclusion: Story = {
  args: { only: ['dossier'], cameraMode: 'physical', eyeHeightMm: 2100, viewerSetbackMm: 750 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dossier = canvas.getByRole('group', { name: 'Band dossier' });
    dossier.focus();
    await userEvent.keyboard('{ArrowRight}{ArrowDown}]]++');
    const phase = (name: string) => waitFor(() => expect(dossier).toHaveAttribute('data-dossier-phase', name), { timeout: 3500 });
    const cover = dossier.querySelector<HTMLElement>('.folder__cover')!;
    const back = dossier.querySelector<HTMLElement>('.folder__back')!;
    const checkPacked = () => {
      const bounds = back.getBoundingClientRect();
      const layer = dossier.querySelector('.folder__contents-layer')!;
      expect(Number(getComputedStyle(layer).zIndex)).toBeLessThan(Number(getComputedStyle(cover).zIndex));
      for (const paper of dossier.querySelectorAll<HTMLElement>('.spilled')) {
        const style = getComputedStyle(paper);
        expect(style.visibility).toBe('visible');
        expect(style.opacity).toBe('1');
        const box = paper.getBoundingClientRect();
        expect(box.left).toBeGreaterThan(bounds.left - 3);
        expect(box.right).toBeLessThan(bounds.right + 3);
        expect(box.top).toBeGreaterThan(bounds.top - 3);
        expect(box.bottom).toBeLessThan(bounds.bottom + 3);
      }
    };
    await userEvent.click(canvas.getByRole('button', { name: 'Open the press package' }));
    await phase('opening');
    await waitFor(checkPacked, { timeout: 800 });
    const contents = [...dossier.querySelectorAll('.spilled')];
    await phase('open');
    // A child's pointer gesture must never start dragging its containing dossier.
    const paper = contents[2] as HTMLElement;
    const folderBefore = x(dossier);
    const box = paper.getBoundingClientRect();
    for (const [type, dx] of [['pointerdown', 0], ['pointermove', 30], ['pointerup', 30]] as const) {
      paper.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 51, pointerType: 'mouse', button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: box.x + 20 + dx, clientY: box.y + 20 }));
    }
    expect(x(dossier)).toBe(folderBefore);
    await userEvent.click(canvas.getByRole('button', { name: 'Close the press package' }));
    await phase('returning');
    expect(cover.closest('.folder')).toHaveAttribute('data-open', 'true');
    await wait(350);
    await userEvent.click(canvas.getByRole('button', { name: 'Open the press package' }));
    expect([...dossier.querySelectorAll('.spilled')]).toEqual(contents);
    await phase('open');
    await userEvent.click(canvas.getByRole('button', { name: 'Close the press package' }));
    await phase('closing');
    checkPacked();
    expect([...dossier.querySelectorAll('.spilled')]).toEqual(contents);
    await wait(400);
    checkPacked();
    expect([...dossier.querySelectorAll('.spilled')]).toEqual(contents);
    await phase('closed');
    expect(dossier.querySelectorAll('.spilled, iframe, .packet')).toHaveLength(0);
  },
};

/** Run with the browser context's reducedMotion preference set to reduce. */
export const ReducedMotion: Story = {
  play: async ({ canvasElement }) => {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = within(canvasElement);
    const dossier = canvas.getByRole('group', { name: 'Band dossier' });
    await userEvent.click(canvas.getByRole('button', { name: 'Open the press package' }));
    await waitFor(() => expect(dossier).toHaveAttribute('data-dossier-phase', 'open'), { timeout: 500 });
    expect(dossier.querySelectorAll('.spilled')).toHaveLength(10);
    expect(getComputedStyle(dossier.querySelector('.folder__cover')!).transitionDuration).toBe('0s');
    expect(getComputedStyle(dossier.querySelector('.spilled')!).transitionDuration).toBe('0s');
    await userEvent.click(canvas.getByRole('button', { name: 'Close the press package' }));
    await waitFor(() => expect(dossier).toHaveAttribute('data-dossier-phase', 'closed'), { timeout: 500 });
    expect(dossier.querySelectorAll('.spilled, iframe')).toHaveLength(0);
  },
};

/** A preference change during the return must not discard the saved folder pose. */
export const ReduceMotionDuringReturn: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dossier = canvas.getByRole('group', { name: 'Band dossier' });
    const original = window.matchMedia;
    let reduced = false;
    const motion = new EventTarget() as MediaQueryList;
    Object.defineProperties(motion, {
      matches: { get: () => reduced },
      media: { value: '(prefers-reduced-motion: reduce)' },
    });
    window.matchMedia = query => query === motion.media ? motion : original.call(window, query);
    const pose = () => ['--movable-x', '--movable-y', '--movable-rotation', '--movable-width']
      .map(name => dossier.style.getPropertyValue(name));
    try {
      dossier.focus();
      await userEvent.keyboard('{ArrowRight}{ArrowDown}]]+');
      const closedPose = pose();
      await userEvent.click(canvas.getByRole('button', { name: 'Open the press package' }));
      await waitFor(() => expect(dossier).toHaveAttribute('data-dossier-phase', 'open'), { timeout: 3500 });
      expect(pose()).not.toEqual(closedPose);
      await userEvent.click(canvas.getByRole('button', { name: 'Close the press package' }));
      await waitFor(() => expect(dossier).toHaveAttribute('data-dossier-phase', 'returning'));
      await wait(150);
      reduced = true;
      motion.dispatchEvent(new Event('change'));
      await waitFor(() => expect(dossier).toHaveAttribute('data-dossier-phase', 'closed'), { timeout: 500 });
      expect(pose()).toEqual(closedPose);
      expect(dossier.querySelectorAll('.spilled, iframe')).toHaveLength(0);
      // Reopening must snapshot the restored layout, not the abandoned open pose.
      await userEvent.click(canvas.getByRole('button', { name: 'Open the press package' }));
      await waitFor(() => expect(dossier).toHaveAttribute('data-dossier-phase', 'open'), { timeout: 500 });
      await userEvent.click(canvas.getByRole('button', { name: 'Close the press package' }));
      await waitFor(() => expect(dossier).toHaveAttribute('data-dossier-phase', 'closed'), { timeout: 500 });
      expect(pose()).toEqual(closedPose);
    } finally {
      window.matchMedia = original;
    }
  },
};
