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
  input('Head tilt from horizontal (degrees)', '90');
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
  await waitFor(() => expect(Number(camera().style.getPropertyValue('--perspective-angle'))).toBe(90));
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
    const target = parseFloat(camera().style.getPropertyValue('--perspective-target').replace('calc(', ''));
    return eye.top + target * stand().width / Number(camera().style.getPropertyValue('--perspective-width'));
  };
  // Real transformed DOM landmarks on the floor and wall must not follow the desk.
  const markers: HTMLElement[] = [];
  for (const [surface, offset] of [['floor', 'top:calc(1100 * var(--desk-room-unit))'], ['wall', 'bottom:calc(700 * var(--desk-room-unit))']]) {
    const plane=canvasElement.querySelector(`.desk-room__${surface}`);
    if (!plane) continue;
    const marker=document.createElement('i');
    marker.style.cssText=`position:absolute;left:calc(50% + 200 * var(--desk-room-unit));${offset};width:0;height:0`;
    plane.append(marker); markers.push(marker);
  }
  const positions=markers.map(marker=>marker.getBoundingClientRect());
  for (const [height, deskDepth] of [[500,600],[1100,1400],[750,800]]) {
    input('Desk height (mm)',height); input('Desk depth (mm)',deskDepth);
    await waitFor(()=>expect(canvasElement.querySelector('.desk-study__shadow')).toHaveAttribute('viewBox', `0 0 1440 ${deskDepth*1.2}`));
    expect(angle()).toBeCloseTo(74.47588900324574,8);
    await waitFor(()=>{
      expect(canvas.queryByRole('alert')).toBeNull();
      markers.forEach((marker,index)=>{
        const actual=marker.getBoundingClientRect();
        expect(actual.x).toBeCloseTo(positions[index].x,0);
        expect(actual.y).toBeCloseTo(positions[index].y,0);
      });
    });
  }
  markers.forEach(marker=>marker.remove());
  const acceptedCamera=camera().getAttribute('style');
  input('Head tilt from horizontal (degrees)',0);
  await waitFor(()=>expect(canvas.getByRole('alert')).toHaveTextContent('last valid scene'));
  expect(camera().getAttribute('style')).toBe(acceptedCamera);
  input('Head tilt from horizontal (degrees)',74.47588900324574);
  await waitFor(()=>expect(canvas.queryByRole('alert')).toBeNull());
  const initialFov=Number((canvas.getByRole('spinbutton',{name:'Horizontal field of view (degrees)'}) as HTMLInputElement).value);
  const initialWidth=stand().width, initialStick=stick().width, initialPrincipal=targetScreenY();
  const initialPose=camera().getAttribute('style');
  for(const fov of [55,85]) {
    input('Horizontal field of view (degrees)',fov);
    const ratio=Math.tan(initialFov*Math.PI/360)/Math.tan(fov*Math.PI/360);
    await waitFor(()=>expect(stand().width/initialWidth).toBeCloseTo(ratio,3));
    expect(camera().getAttribute('style')).toBe(initialPose);
    expect(stick().width/initialStick).toBeCloseTo(ratio,3);
    expect(targetScreenY()).toBeCloseTo(initialPrincipal,1);
  }
  const validWidth=stand().width;
  input('Horizontal field of view (degrees)',180);
  await waitFor(()=>expect(canvas.getByRole('alert')).toHaveTextContent('field of view'));
  expect(stand().width).toBeCloseTo(validWidth,1);
  input('Horizontal field of view (degrees)',initialFov);
  await waitFor(()=>expect(canvas.queryByRole('alert')).toBeNull());
  const originalTarget = targetScreenY();
  const original = stand(), originalAngle = angle(), originalDistance = distance();
  input('Eye height (mm)', 2400);
  await waitFor(() => expect(stand().width / original.width).toBeCloseTo(900 / 1650, 3));
  expect(angle()).toBe(originalAngle);
  expect(distance()).toBeGreaterThan(originalDistance);
  input('Eye height (mm)', 2550);
  input('Wall distance (mm)', 900);
  await waitFor(() => expect(stand().width / original.width).toBeCloseTo(.5, 3));
  expect(angle()).toBeCloseTo(originalAngle, 8);
  expect(distance()).toBeCloseTo(originalDistance * 2, 8);
  expect(targetScreenY()).toBeCloseTo(originalTarget, 1);
  input('Eye height (mm)', 1650);
  await waitFor(() => expect(stand().width).toBeCloseTo(original.width, 1));
  expect(angle()).toBe(originalAngle);
  expect(distance()).toBe(originalDistance);
  input('Wall distance (mm)', 650);
  await waitFor(() => expect(stand().width).toBeCloseTo(original.width, 1));
  const meterWidth = stick().width;
  input('Desk width (mm)', 1800);
  await waitFor(() => expect(stand().width / original.width).toBeCloseTo(1.5, 3));
  expect(stick().width).toBeCloseTo(meterWidth, 1);
  expect(targetScreenY()).toBeCloseTo(originalTarget, 1);
  // After both camera and frame dimensions change, a 40 px drag still inverts correctly.
  for (const [wallDistance, pitch] of [[0,115], [400,90], [800,65], [1200,74.47588900324574]]) {
    input('Head tilt from horizontal (degrees)', pitch);
    input('Wall distance (mm)', wallDistance);
    await waitFor(() => expect(angle()).toBeCloseTo(pitch, 6));
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
  input('Head tilt from horizontal (degrees)', 85);
  await waitFor(() => expect(angle()).toBe(85));
  const target = Number.parseFloat(camera().style.getPropertyValue('--perspective-target').replace('calc(', ''));
  expect(distance()*Math.sin(angle()*Math.PI/180)).toBeCloseTo(1080, 6);
  expect(target+distance()*Math.cos(angle()*Math.PI/180)).toBeCloseTo(780, 6);
  input('Head tilt from horizontal (degrees)', 90);
  input('Wall distance (mm)', 400);
  await waitFor(() => expect(angle()).toBe(90));
  const mug = canvas.getByRole('group', { name: /^Mug$/ });
  input('Horizontal field of view (degrees)',85);
  await waitFor(()=>expect(Number((canvas.getByRole('spinbutton',{name:'Horizontal field of view (degrees)'}) as HTMLInputElement).value)).toBe(85));
  const initialX = Number(mug.style.getPropertyValue('--movable-x'));
  const unitsPerPixel = 2160 / stand().width;
  const box = mug.getBoundingClientRect();
  const pointer = { pointerId: 1, button: 0, buttons: 1, clientX: box.x + box.width / 2, clientY: box.y + box.height / 2 };
  fireEvent.pointerDown(mug, pointer);
  fireEvent.pointerMove(mug, { ...pointer, clientX: pointer.clientX + 40 });
  fireEvent.pointerUp(mug, { ...pointer, buttons: 0, clientX: pointer.clientX + 40 });
  await waitFor(() => expect(Math.abs(Number(mug.style.getPropertyValue('--movable-x')) - initialX - 40 * unitsPerPixel)).toBeLessThanOrEqual(1));
}
