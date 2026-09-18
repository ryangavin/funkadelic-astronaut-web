import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';

/** Exercise real controls and placements, including recovery from invalid geometry. */
export async function checkPhysicalRoom({ canvasElement }: { canvasElement: HTMLElement }) {
  // Ordinary browsing must never rearrange the scene or leave stress-test settings behind.
  if (import.meta.env.MODE !== 'test') return;
  const canvas = within(canvasElement);
  const input = (label: string, value: string) => fireEvent.change(canvas.getByRole('spinbutton', { name: label }), { target: { value } });
  const room = () => canvasElement.querySelector<HTMLElement>('.room')!;
  const camera = () => canvasElement.querySelector<HTMLElement>('.perspective')!;
  const pool = () => canvasElement.querySelector<HTMLElement>('.lamp-light')!;
  await waitFor(() => expect(pool().style.width).not.toBe(''));
  expect(canvas.getByLabelText('Desk width (mm) inches')).toHaveTextContent('47.24 in');
  fireEvent.change(canvas.getByRole('slider', { name: 'Desk width (mm) slider' }), { target: { value: '1600' } });
  await waitFor(() => expect(canvas.getByRole('spinbutton', { name: 'Desk width (mm)' })).toHaveValue(1600));
  expect(canvas.getByLabelText('Desk width (mm) inches')).toHaveTextContent('62.99 in');
  await waitFor(() => expect(camera().style.getPropertyValue('--perspective-width')).toBe('1920'));
  input('Desk depth (mm)', '1000');
  await waitFor(() => expect(canvasElement.querySelector('.desk-study__shadow')).toHaveAttribute('viewBox', '0 0 1920 1200'));
  expect(canvasElement.querySelector('.desk-study__shadow')).toHaveAttribute('viewBox', '0 0 1920 1200');
  expect(canvasElement.querySelector('.lamp-cast-shadow')).toHaveAttribute('viewBox', '0 0 1920 1200');
  const mug = canvas.getByRole('group', { name: /^Mug$/ });
  const desk = canvasElement.querySelector<HTMLElement>('.desk')!;
  const physicalWidth = () => parseFloat(getComputedStyle(mug).width) / parseFloat(getComputedStyle(desk).width) * 1920;
  expect(physicalWidth()).toBeCloseTo(168, 0);
  const before = Number(mug.style.getPropertyValue('--movable-x'));
  mug.focus();
  await userEvent.keyboard('{ArrowRight}{ArrowRight}');
  expect(Number(mug.style.getPropertyValue('--movable-x'))).toBe(before + 20);
  const lamp = canvas.getByRole('group', { name: 'Desk lamp' });
  lamp.focus();
  await userEvent.keyboard('{ArrowRight}{ArrowRight}');
  const lampX = lamp.style.getPropertyValue('--movable-x');
  const head = canvas.getByRole('button', { name: 'Turn the lamp off' });
  const shade = canvasElement.querySelector('.desk-lamp__shade')!;
  const originalPose = shade.innerHTML;
  const headBox = head.getBoundingClientRect();
  const aim = { pointerId: 1, button: 0, buttons: 1, clientX: headBox.left + headBox.width / 2, clientY: headBox.top + headBox.height / 2 };
  fireEvent.pointerDown(head, aim);
  fireEvent.pointerMove(head, { ...aim, clientX: aim.clientX + 30, clientY: aim.clientY + 20 });
  fireEvent.pointerUp(head, { ...aim, buttons: 0, clientX: aim.clientX + 30, clientY: aim.clientY + 20 });
  await waitFor(() => expect(shade.innerHTML).not.toBe(originalPose));
  // A dragged shade suppresses its trailing click; a new pointer-down starts a click.
  fireEvent.pointerDown(head, aim); fireEvent.pointerUp(head, { ...aim, buttons: 0 });
  fireEvent.click(head);
  await waitFor(() => expect(canvas.getByRole('button', { name: 'Turn the lamp on' })).toBeInTheDocument());
  const aimed = shade.innerHTML;
  input('Desk width (mm)', '3400');
  await waitFor(() => expect(camera().style.getPropertyValue('--perspective-width')).toBe('4080'));
  expect(canvas.getByRole('spinbutton', { name: 'Desk width (mm)' })).toHaveValue(3400);
  expect(canvas.getByRole('slider', { name: 'Desk width (mm) slider' })).toHaveValue('3000');
  fireEvent.change(canvas.getByRole('slider', { name: 'Desk width (mm) slider' }), { target: { value: '1600' } });
  await waitFor(() => expect(camera().style.getPropertyValue('--perspective-width')).toBe('1920'));
  input('Eye height (mm)', '');
  await expect(canvas.getByRole('alert')).toHaveTextContent('last valid scene');
  expect(lamp.style.getPropertyValue('--movable-x')).toBe(lampX);
  input('Eye height (mm)', '1650');
  await waitFor(() => expect(canvas.queryByRole('alert')).toBeNull());
  expect(lamp.style.getPropertyValue('--movable-x')).toBe(lampX);
  expect(shade.innerHTML).toBe(aimed);
  await userEvent.click(canvas.getByRole('button', { name: 'Turn the lamp on' }));
  input('Wall distance (mm)', '500');
  await waitFor(() => expect(Number(camera().style.getPropertyValue('--perspective-angle'))).toBe(90));
  const position = Number(mug.style.getPropertyValue('--movable-x'));
  const box = mug.getBoundingClientRect();
  const pointer = { pointerId: 1, button: 0, buttons: 1, clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 };
  fireEvent.pointerDown(mug, pointer);
  fireEvent.pointerMove(mug, { ...pointer, clientX: pointer.clientX + 40 });
  fireEvent.pointerUp(mug, { ...pointer, buttons: 0, clientX: pointer.clientX + 40 });
  await waitFor(() => expect(Number(mug.style.getPropertyValue('--movable-x'))).toBeGreaterThan(position));
  input('Eye height (mm)', '850');
  await waitFor(() => expect(canvasElement.querySelector('.room__diagnostic')).toHaveTextContent('100.0 mm'));
  for (const node of canvasElement.querySelectorAll('[style], [transform]'))
    expect(`${node.getAttribute('style')} ${node.getAttribute('transform')}`).not.toMatch(/NaN|Infinity/);
  const supportedCamera = camera().getAttribute('style');
  const materialCount = canvasElement.querySelectorAll('.floor__course, .floor__butt, .wall__brick').length;
  input('Eye height (mm)', '100000');
  await waitFor(() => expect(canvas.getByRole('alert')).toHaveTextContent('renderer capacity exceeded'));
  expect(canvas.getByRole('alert')).toHaveTextContent('last valid scene');
  expect(canvas.getByRole('spinbutton', { name: 'Eye height (mm)' })).toHaveValue(100000);
  expect(camera().getAttribute('style')).toBe(supportedCamera);
  expect(canvasElement.querySelectorAll('.floor__course, .floor__butt, .wall__brick')).toHaveLength(materialCount);
  expect(lamp.style.getPropertyValue('--movable-x')).toBe(lampX);
  input('Eye height (mm)', '700');
  await expect(canvas.getByRole('alert')).toHaveTextContent('eye height above tabletop');
  input('Eye height (mm)', '1650');
  await waitFor(() => expect(room()).not.toBeNull());
  input('Light intensity', '0');
  await waitFor(() => expect(pool().style.visibility).toBe('hidden'));
  expect(canvasElement.querySelector<SVGCircleElement>('.desk-room__pool')!.style.visibility).toBe('hidden');
  input('Light intensity', '3');
  await waitFor(() => expect(pool().style.filter).toBe('brightness(3)'));
  const size = parseFloat(pool().style.width);
  input('Pool spread', '2.8');
  await waitFor(() => expect(parseFloat(pool().style.width)).toBeCloseTo(size * 2, 5));
  input('Wall distance (mm)', '650');
  await waitFor(() => expect(Number(camera().style.getPropertyValue('--perspective-angle'))).toBeCloseTo(80.5377, 3));
}


/** Pixel measurements protect the fixed physical lens, not just its CSS inputs. */
export async function checkPhysicalLens({ canvasElement }: { canvasElement: HTMLElement }) {
  if (import.meta.env.MODE !== 'test') return;
  const canvas = within(canvasElement);
  const input = (name: string, value: number) => fireEvent.change(canvas.getByRole('spinbutton', { name }), { target: { value: String(value) } });
  const stand = () => canvasElement.querySelector<HTMLElement>('.room__stand')!.getBoundingClientRect();
  const camera = () => canvasElement.querySelector<HTMLElement>('.perspective')!;
  const angle = () => Number(camera().style.getPropertyValue('--perspective-angle'));
  const distance = () => Number(camera().style.getPropertyValue('--perspective-depth'));
  const stick = () => canvas.getByRole('img', { name: /One meter stick/ }).getBoundingClientRect();
  const targetScreenY = () => {
    const eye = canvasElement.querySelector<HTMLElement>('.perspective__eye')!.getBoundingClientRect();
    const target = 480;
    return eye.top + target * stand().width / Number(camera().style.getPropertyValue('--perspective-width'));
  };
  const originalTarget = targetScreenY();
  const original = stand(), originalAngle = angle(), originalDistance = distance();
  input('Eye height (mm)', 2400);
  await waitFor(() => expect(stand().width / original.width).toBeCloseTo(Math.hypot(900, 250) / Math.hypot(1650, 250), 3));
  expect(angle()).toBeGreaterThan(originalAngle);
  expect(distance()).toBeGreaterThan(originalDistance);
  input('Eye height (mm)', 2550);
  input('Wall distance (mm)', 900);
  await waitFor(() => expect(stand().width / original.width).toBeCloseTo(.5, 3));
  expect(angle()).toBeCloseTo(originalAngle, 8);
  expect(distance()).toBeCloseTo(originalDistance * 2, 8);
  expect(targetScreenY()).toBeCloseTo(originalTarget, 1);
  input('Eye height (mm)', 1650);
  await waitFor(() => expect(angle()).toBeLessThan(originalAngle));
  expect(stand().width).toBeLessThan(original.width);
  expect(distance()).toBeGreaterThan(originalDistance);
  input('Wall distance (mm)', 650);
  await waitFor(() => expect(stand().width).toBeCloseTo(original.width, 1));
  const meterWidth = stick().width;
  input('Desk width (mm)', 1800);
  await waitFor(() => expect(stand().width / original.width).toBeCloseTo(1.5, 3));
  expect(stick().width).toBeCloseTo(meterWidth, 1);
  expect(targetScreenY()).toBeCloseTo(originalTarget, 1);
  // After both camera and frame dimensions change, a 40 px drag still inverts correctly.
  for (const wallDistance of [0, 400, 800, 1200]) {
    input('Wall distance (mm)', wallDistance);
    await waitFor(() => expect(angle()).toBeCloseTo(Math.atan2(900, wallDistance - 400) * 180 / Math.PI, 6));
    expect(targetScreenY()).toBeCloseTo(originalTarget, 1);
    const mug = canvas.getByRole('group', { name: /^Mug$/ });
    const pivot = mug.querySelector<HTMLElement>('.movable__pivot')!;
    const before = pivot.getBoundingClientRect();
    const pointer = { pointerId: 1, button: 0, buttons: 1, clientX: before.x, clientY: before.y };
    fireEvent.pointerDown(mug, pointer);
    fireEvent.pointerMove(mug, { ...pointer, clientX: before.x + 30, clientY: before.y + 15 });
    fireEvent.pointerUp(mug, { ...pointer, buttons: 0, clientX: before.x + 30, clientY: before.y + 15 });
    await waitFor(() => expect(Math.abs(pivot.getBoundingClientRect().x - before.x - 30)).toBeLessThan(2));
    expect(Math.abs(pivot.getBoundingClientRect().y - before.y - 15)).toBeLessThan(2);
    if (wallDistance === 0 || wallDistance === 800) {
      const head = canvas.getByRole('button', { name: /^Turn the lamp/ });
      const shade = canvasElement.querySelector('.desk-lamp__shade')!;
      const previousPose = shade.innerHTML;
      const box = head.getBoundingClientRect();
      const aim = { pointerId: 1, button: 0, buttons: 1, clientX: box.x + box.width / 2, clientY: box.y + box.height / 2 };
      fireEvent.pointerDown(head, aim);
      fireEvent.pointerMove(head, { ...aim, clientX: aim.clientX + 12, clientY: aim.clientY + 8 });
      fireEvent.pointerUp(head, { ...aim, buttons: 0, clientX: aim.clientX + 12, clientY: aim.clientY + 8 });
      await waitFor(() => expect(shade.innerHTML).not.toBe(previousPose));
      expect(shade.innerHTML).not.toMatch(/NaN|Infinity/);
    }
  }
  input('Wall distance (mm)', 650);
  input('Head tilt (degrees)', 15);
  await waitFor(() => expect(angle()).toBeCloseTo(Math.atan2(900,250)*180/Math.PI+15, 6));
  const target = Number.parseFloat(camera().style.getPropertyValue('--perspective-target').replace('calc(', ''));
  expect(distance()*Math.sin(angle()*Math.PI/180)).toBeCloseTo(1080, 6);
  expect(target+distance()*Math.cos(angle()*Math.PI/180)).toBeCloseTo(780, 6);
  input('Head tilt (degrees)', 0);
  input('Wall distance (mm)', 400);
  await waitFor(() => expect(angle()).toBe(90));
  const mug = canvas.getByRole('group', { name: /^Mug$/ });
  const initialX = Number(mug.style.getPropertyValue('--movable-x'));
  const unitsPerPixel = 2160 / stand().width;
  const box = mug.getBoundingClientRect();
  const pointer = { pointerId: 1, button: 0, buttons: 1, clientX: box.x + box.width / 2, clientY: box.y + box.height / 2 };
  fireEvent.pointerDown(mug, pointer);
  fireEvent.pointerMove(mug, { ...pointer, clientX: pointer.clientX + 40 });
  fireEvent.pointerUp(mug, { ...pointer, buttons: 0, clientX: pointer.clientX + 40 });
  await waitFor(() => expect(Math.abs(Number(mug.style.getPropertyValue('--movable-x')) - initialX - 40 * unitsPerPixel)).toBeLessThanOrEqual(1));
}
