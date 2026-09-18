import { expect, userEvent, within } from 'storybook/test';

/** Shared interaction contract for every desk preview. */
export async function checkDeskStudy({ canvasElement }: { canvasElement: HTMLElement }) {
  const canvas = within(canvasElement);
  const lightShadow = canvasElement.querySelector('.lamp-cast-shadow__light')!;
  const objectShadow = canvasElement.querySelector('.desk-study__cast, .mug-cast-shadow > g');
  await expect(canvas.getByRole('slider', { name: 'View angle' })).toHaveValue('84');
  await expect(Number(lightShadow.getAttribute('opacity'))).toBeGreaterThan(0);
  await userEvent.click(canvas.getByRole('button', { name: 'Turn the lamp off' }));
  await expect(lightShadow).toHaveAttribute('opacity', '0');
  if (objectShadow) await expect(objectShadow).toHaveAttribute('opacity', '0');
  await userEvent.click(canvas.getByRole('button', { name: 'Turn the lamp on' }));
  await expect(Number(lightShadow.getAttribute('opacity'))).toBeGreaterThan(0);
  const object = canvasElement.querySelector<HTMLElement>('.movable:not(.perspective__lamp)');
  if (object) {
    const before = object.getAttribute('style');
    object.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(object.getAttribute('style')).not.toBe(before);
    await userEvent.click(canvas.getByRole('button', { name: 'Reset positions' }));
    await expect(object.getAttribute('style')).toBe(before);
  }
  await userEvent.selectOptions(canvas.getByRole('combobox', { name: 'Preview zoom' }), '1.5');
  await expect(canvas.getByRole('combobox', { name: 'Preview zoom' })).toHaveValue('1.5');
  await userEvent.selectOptions(canvas.getByRole('combobox', { name: 'Preview zoom' }), '1');
}
