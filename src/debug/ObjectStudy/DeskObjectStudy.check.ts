import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';

/** Shared interaction contract for every desk preview. */
export async function checkDeskStudy({ canvasElement }: { canvasElement: HTMLElement }) {
  const canvas = within(canvasElement);
  await expect(canvasElement.querySelectorAll('.lamp-cast-shadow__light')).toHaveLength(1);
  const lightShadow = canvasElement.querySelector('.lamp-cast-shadow__light')!;
  const objectShadow = canvasElement.querySelector('.desk-study__cast, .mug-cast-shadow > g');
  await expect(canvas.getByRole('slider', { name: 'View angle' })).toHaveValue('84');
  await expect(Number(lightShadow.getAttribute('opacity'))).toBeGreaterThan(0);
  await userEvent.click(canvas.getByRole('button', { name: 'Turn the lamp off' }));
  await expect(lightShadow).toHaveAttribute('opacity', '0');
  if (objectShadow) await expect(objectShadow).toHaveAttribute('opacity', '0');
  await userEvent.click(canvas.getByRole('button', { name: 'Turn the lamp on' }));
  await expect(Number(lightShadow.getAttribute('opacity'))).toBeGreaterThan(0);
  if (objectShadow) await expect(Number(objectShadow.getAttribute('opacity'))).toBeGreaterThan(0);
  const object = canvasElement.querySelector<HTMLElement>('.movable:not(.perspective__lamp)');
  const lamp = canvas.getByRole('group', { name: 'Desk lamp' });
  const lampBefore = lamp.getAttribute('style');
  lamp.focus();
  await userEvent.keyboard('{ArrowRight}');
  await expect(lamp.getAttribute('style')).not.toBe(lampBefore);
  if (object) {
    const before = object.getAttribute('style');
    // Elevated callbacks and solids must redraw while their wrapper moves;
    // otherwise the raised artwork remains projected from the old location.
    const solid = object.querySelector<HTMLElement>('.solid');
    const geometry = solid
      ? () => [solid.style.getPropertyValue('--solid-rise'), solid.style.getPropertyValue('--solid-splay')].join(',')
      : object.getAttribute('aria-label') === 'Pen'
        ? () => object.querySelectorAll('.pen')[1]?.parentElement?.style.transform
        : object.getAttribute('aria-label') === 'Newton’s cradle'
          ? () => object.querySelector('.cradle-perspective-study__posts rect[transform]')?.getAttribute('transform')
          : undefined;
    const raisedBefore = geometry?.();
    if (geometry) await expect(raisedBefore).toBeTruthy();
    const shadowPath = objectShadow?.querySelector('path');
    const shadowBefore = shadowPath?.getAttribute('transform');
    if (object.getAttribute('aria-label') === 'Newton’s cradle') {
      const slices = [...objectShadow!.querySelectorAll('path')];
      const outlines = [...new Set(slices.map(path => path.getAttribute('d')))];
      await expect(outlines).toHaveLength(2);
      const tops = outlines.map(outline => slices.filter(path => path.getAttribute('d') === outline).at(-1)!.parentElement!.getAttribute('transform'));
      await expect(tops[0]).not.toBe(tops[1]);
    }
    object.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(object.getAttribute('style')).not.toBe(before);
    if (geometry) await waitFor(() => expect(geometry()).not.toBe(raisedBefore));
    if (shadowPath) await expect(shadowPath.getAttribute('transform')).not.toBe(shadowBefore);

    if (geometry) {
      await userEvent.click(canvas.getByRole('button', { name: 'Reset positions' }));
      await expect(object.getAttribute('style')).toBe(before);
      await waitFor(() => expect(geometry()).toBe(raisedBefore));
      const beforeDrag = geometry();
      const box = object.getBoundingClientRect();
      const pointer = (type: string, dx: number) => object.dispatchEvent(new PointerEvent(type, {
        bubbles: true, cancelable: true, pointerId: 27, pointerType: 'mouse',
        isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1,
        clientX: box.x + box.width / 2 + dx, clientY: box.y + box.height / 2,
      }));
      pointer('pointerdown', 0);
      pointer('pointermove', 35);
      // Check while held, before pointerup can trigger a settling render.
      await waitFor(() => expect(geometry()).not.toBe(beforeDrag));
      pointer('pointerup', 35);
      await waitFor(() => expect(object).not.toHaveAttribute('data-dragging'));
    }
    await userEvent.click(canvas.getByRole('button', { name: 'Reset positions' }));
    await expect(object.getAttribute('style')).toBe(before);
    if (geometry) await waitFor(() => expect(geometry()).toBe(raisedBefore));
    if (shadowPath) await expect(shadowPath.getAttribute('transform')).toBe(shadowBefore);
    // Repeated keys and a fresh gesture after reset must read the latest store
    // position, rather than the props from the last parent render.
    const initialX = Number(object.style.getPropertyValue('--movable-x'));
    object.focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    await expect(Number(object.style.getPropertyValue('--movable-x'))).toBe(initialX + 20);
    await userEvent.click(canvas.getByRole('button', { name: 'Reset positions' }));
    await expect(object.getAttribute('style')).toBe(before);
    if (geometry) {
      const view = canvas.getByRole('slider', { name: 'View angle' });
      fireEvent.change(view, { target: { value: '83' } });
      await waitFor(() => expect(geometry()).not.toBe(raisedBefore));
      fireEvent.change(view, { target: { value: '84' } });
      await waitFor(() => expect(geometry()).toBe(raisedBefore));
    }
  } else {
    await userEvent.click(canvas.getByRole('button', { name: 'Reset positions' }));
  }
  await expect(lamp.getAttribute('style')).toBe(lampBefore);
  await userEvent.selectOptions(canvas.getByRole('combobox', { name: 'Preview zoom' }), '1.5');
  await expect(canvas.getByRole('combobox', { name: 'Preview zoom' })).toHaveValue('1.5');
  await userEvent.selectOptions(canvas.getByRole('combobox', { name: 'Preview zoom' }), '1');
}
