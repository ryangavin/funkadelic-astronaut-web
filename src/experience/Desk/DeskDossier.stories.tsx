import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { PerspectiveDesk } from './PerspectiveDesk';
import { DOSSIER_OPEN_TARGETS, DOSSIER_RETURN_MS, DOSSIER_SPILL_TARGETS } from './DeskDossier';
import { mmToUnits } from '../../geometry/physicalScale';
import { FOLDER_CLOSE_MS } from '../../components/2D/Folder/Folder';
import { SPILL_FLIGHT_MS, SPILL_STAGGER_MS } from '../../behaviors/Spill/Spill';

const meta = {
  title: 'Experience/Desk Dossier',
  component: PerspectiveDesk,
  parameters: { layout: 'fullscreen' },
  args: { showSettings: false, only: ['dossier', 'pen', 'walkman'] },
} satisfies Meta<typeof PerspectiveDesk>;
export default meta;
type Story = StoryObj<typeof meta>;
const x = (element: HTMLElement) => Number(element.style.getPropertyValue('--movable-x'));
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
/** Ceiling for waits on the dossier's timed phases and flights: CI's software renderer can hold frames and timers back by seconds. */
const SLOW = { timeout: 15000 };
/** The timers the dossier's motion runs on. A reduced-motion path must schedule none of them. */
const MOTION_DELAYS = [FOLDER_CLOSE_MS, SPILL_FLIGHT_MS + 9 * SPILL_STAGGER_MS, DOSSIER_RETURN_MS];

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
    // The surrounding pen takes intermediate positions rather than teleporting. waitFor
    // re-checks on every write to the pen, so one sample is taken per frame of the flight.
    await waitFor(() => {
      const y = Number(pen.style.getPropertyValue('--movable-y'));
      expect(y).toBeLessThan(330);
      expect(y).toBeGreaterThan(DOSSIER_OPEN_TARGETS.pen.y);
    }, SLOW);
    await waitFor(() => expect(x(dossier)).toBe(DOSSIER_OPEN_TARGETS.dossier.x), SLOW);
    await expect(x(pen)).toBe(DOSSIER_OPEN_TARGETS.pen.x);
    const packet = await canvas.findByRole('group', { name: 'Ryan Gavin packet' }, SLOW);
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
    await waitFor(() => expect(dossier).toHaveAttribute('data-dossier-phase', 'closing'), SLOW);
    await expect(spill.querySelector('.packet')).toBe(returnedPacket);
    for (const paper of spill.querySelectorAll('.spilled')) {
      await expect(getComputedStyle(paper).visibility).toBe('visible');
      await expect(getComputedStyle(paper).opacity).toBe('1');
    }
    await expect(dossier.querySelector('.folder')).toHaveAttribute('data-open', 'false');
    await expect(spill.querySelectorAll('.spilled')).toHaveLength(10);
    await waitFor(() => expect(x(dossier)).toBe(closedPlace.x), SLOW);
    await expect(x(pen)).toBe(penStart);
    await waitFor(() => expect(canvasElement.querySelectorAll('.spilled')).toHaveLength(0), SLOW);
    await expect(canvasElement.querySelectorAll('iframe, .packet, .one-sheet')).toHaveLength(0);
    // Reopen, rapidly reverse twice, then let the old closing deadline pass: it was set
    // before the reopening's own timers, so reaching "open" means it has come and gone.
    await userEvent.click(canvas.getByRole('button', { name: 'Open the press package' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Close the press package' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Open the press package' }));
    await waitFor(() => expect(dossier).toHaveAttribute('data-dossier-phase', 'open'), SLOW);
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
    const dossier = canvas.getByRole('group', { name: 'Band dossier' });
    await waitFor(() => expect(dossier).toHaveAttribute('data-dossier-phase', 'open'), SLOW);
    reachable(close);
    await userEvent.click(close);
    await waitFor(() => expect(canvasElement.querySelectorAll('.spilled')).toHaveLength(0), SLOW);
  },
};

/** Store coordinates, rendered movement and solid projection agree mid-flight. */
export const MotionStaysAligned: Story = {
  args: { only: ['dossier', 'pen', 'mug', 'phone', 'rolodex', 'labelBro'], headTiltDegrees: 80, eyeHeightMm: 2400, viewerSetbackMm: 700 },
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
    // Sampled on the write that moves it, so the flight is caught in progress however slow frames are.
    await waitFor(() => {
      expect(Number(pen.style.getPropertyValue('--movable-y'))).toBeLessThan(320);
      expect(pen).toHaveAttribute('data-arranging');
    }, SLOW);
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
      await waitFor(() => expect(item.projection()).not.toBe(item.before), SLOW);
      await expect(item.body.querySelector('.solid')).toBe(item.solid);
      await expect(item.solid.querySelector('.solid__upright')!.firstElementChild).toBe(item.content);
    }
    await waitFor(() => expect(pen).not.toHaveAttribute('data-arranging'), SLOW);
    await expect(getComputedStyle(pen).transitionProperty).toBe(ordinaryTransition);
  },
};

/** Papers stay opaque and mounted under the actual cover through both swings. */
export const CoverOcclusion: Story = {
  args: { only: ['dossier'], eyeHeightMm: 2100, viewerSetbackMm: 750 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dossier = canvas.getByRole('group', { name: 'Band dossier' });
    dossier.focus();
    await userEvent.keyboard('{ArrowRight}{ArrowDown}]]++');
    const phase = (name: string) => waitFor(() => expect(dossier).toHaveAttribute('data-dossier-phase', name), SLOW);
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
    // Packed while the cover is still swinging open; once it has moved on they never will be.
    await waitFor(() => {
      expect(dossier).toHaveAttribute('data-dossier-phase', 'opening');
      checkPacked();
    }, SLOW);
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
    // Interrupt the return while it is under way.
    await userEvent.click(canvas.getByRole('button', { name: 'Open the press package' }));
    expect([...dossier.querySelectorAll('.spilled')]).toEqual(contents);
    await phase('open');
    await userEvent.click(canvas.getByRole('button', { name: 'Close the press package' }));
    await phase('closing');
    // Every frame of the swing shut, however many the renderer manages.
    do {
      checkPacked();
      expect([...dossier.querySelectorAll('.spilled')]).toEqual(contents);
      await nextFrame();
    } while (dossier.getAttribute('data-dossier-phase') === 'closing');
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
    const phase = (name: string) => waitFor(() => expect(dossier).toHaveAttribute('data-dossier-phase', name), SLOW);
    // "Almost instantly" is proved by what the dossier waits on, not by a stopwatch a slow
    // renderer can overrun: every phase it passes through, and every timer it starts.
    const phases: string[] = [];
    const watch = new MutationObserver(() => phases.push(dossier.getAttribute('data-dossier-phase')!));
    watch.observe(dossier, { attributes: true, attributeFilter: ['data-dossier-phase'] });
    const delays: number[] = [];
    const timeout = window.setTimeout;
    window.setTimeout = ((handler: TimerHandler, delay?: number, ...rest: unknown[]) => {
      delays.push(Number(delay) || 0);
      return timeout(handler, delay, ...rest);
    }) as typeof window.setTimeout;
    const motionTimers = () => delays.filter(delay => MOTION_DELAYS.includes(delay));
    try {
      dossier.focus();
      await userEvent.keyboard('{ArrowRight}{ArrowDown}]]+');
      const closedPose = pose();
      await userEvent.click(canvas.getByRole('button', { name: 'Open the press package' }));
      await phase('open');
      expect(pose()).not.toEqual(closedPose);
      await userEvent.click(canvas.getByRole('button', { name: 'Close the press package' }));
      await phase('returning');
      // The spy sees the full-motion timers, so their absence below means something.
      expect(motionTimers()).toEqual(expect.arrayContaining(MOTION_DELAYS));
      await wait(150);
      phases.length = 0;
      delays.length = 0;
      reduced = true;
      motion.dispatchEvent(new Event('change'));
      await phase('closed');
      // Straight from the return to closed: no swing shut, and nothing timed to wait for.
      expect(phases).toEqual(['closed']);
      expect(motionTimers()).toEqual([]);
      expect(pose()).toEqual(closedPose);
      expect(dossier.querySelectorAll('.spilled, iframe')).toHaveLength(0);
      // Reopening must snapshot the restored layout, not the abandoned open pose.
      await userEvent.click(canvas.getByRole('button', { name: 'Open the press package' }));
      await phase('open');
      await userEvent.click(canvas.getByRole('button', { name: 'Close the press package' }));
      await phase('closed');
      expect(motionTimers()).toEqual([]);
      expect(pose()).toEqual(closedPose);
    } finally {
      window.setTimeout = timeout;
      watch.disconnect();
      window.matchMedia = original;
    }
  },
};
