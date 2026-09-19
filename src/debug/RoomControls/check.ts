import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';
import { ROOM_DESK_SHARE } from '../../foundations/Room/DeskRoom';
import { referenceFieldOfView } from '../../geometry/roomSetup';
import { roomSeam } from './controls';

/** Exercise real controls and placements, including recovery from invalid geometry. */
export async function checkPhysicalRoom({ canvasElement }: { canvasElement: HTMLElement }) {
  // Ordinary browsing must never rearrange the scene or leave stress-test settings behind.
  if (import.meta.env.MODE !== 'test') return;
  const canvas = within(canvasElement);
  // Controls live in Storybook's props panel, which is outside the canvas; drive the args directly.
  const seam = () => roomSeam(canvasElement);
  const set = (next: Parameters<ReturnType<typeof seam>['set']>[0]) => seam().set(next);
  const room = () => canvasElement.querySelector<HTMLElement>('.room')!;
  const camera = () => canvasElement.querySelector<HTMLElement>('.perspective')!;
  const pool = () => canvasElement.querySelector<HTMLElement>('.lamp-light')!;
  await waitFor(() => expect(pool().style.width).not.toBe(''));
  set({ deskWidthMm: 1600 });
  await waitFor(() => expect(seam().args.deskWidthMm).toBe(1600));
  await waitFor(() => expect(camera().style.getPropertyValue('--perspective-width')).toBe('1920'));
  set({ deskDepthMm: 1000 });
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
  set({ deskWidthMm: 3400 });
  await waitFor(() => expect(camera().style.getPropertyValue('--perspective-width')).toBe('4080'));
  expect(seam().args.deskWidthMm).toBe(3400);
  set({ deskWidthMm: 1600 });
  await waitFor(() => expect(camera().style.getPropertyValue('--perspective-width')).toBe('1920'));
  set({ eyeHeightMm: NaN });
  await waitFor(() => expect(canvas.getByRole('alert')).toHaveTextContent('last valid scene'));
  expect(lamp.style.getPropertyValue('--movable-x')).toBe(lampX);
  set({ eyeHeightMm: 1650 });
  await waitFor(() => expect(canvas.queryByRole('alert')).toBeNull());
  expect(lamp.style.getPropertyValue('--movable-x')).toBe(lampX);
  expect(shade.innerHTML).toBe(aimed);
  await userEvent.click(canvas.getByRole('button', { name: 'Turn the lamp on' }));
  set({ viewerSetbackMm: 500, headTiltDegrees: 90 });
  await waitFor(() => expect(Number(camera().style.getPropertyValue('--perspective-angle'))).toBe(90));
  const position = Number(mug.style.getPropertyValue('--movable-x'));
  const box = mug.getBoundingClientRect();
  const pointer = { pointerId: 1, button: 0, buttons: 1, clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 };
  fireEvent.pointerDown(mug, pointer);
  fireEvent.pointerMove(mug, { ...pointer, clientX: pointer.clientX + 40 });
  fireEvent.pointerUp(mug, { ...pointer, buttons: 0, clientX: pointer.clientX + 40 });
  await waitFor(() => expect(Number(mug.style.getPropertyValue('--movable-x'))).toBeGreaterThan(position));
  set({ eyeHeightMm: 850 });
  await waitFor(() => expect(canvasElement.querySelector('.room__diagnostic')).toHaveTextContent('100.0 mm'));
  for (const node of canvasElement.querySelectorAll('[style], [transform]'))
    expect(`${node.getAttribute('style')} ${node.getAttribute('transform')}`).not.toMatch(/NaN|Infinity/);
  const supportedCamera = camera().getAttribute('style');
  const materialCount = canvasElement.querySelectorAll('.floor__course, .floor__butt, .wall__brick').length;
  set({ eyeHeightMm: 100000 });
  await waitFor(() => expect(canvas.getByRole('alert')).toHaveTextContent('renderer capacity exceeded'));
  expect(canvas.getByRole('alert')).toHaveTextContent('last valid scene');
  expect(seam().args.eyeHeightMm).toBe(100000);
  expect(camera().getAttribute('style')).toBe(supportedCamera);
  expect(canvasElement.querySelectorAll('.floor__course, .floor__butt, .wall__brick')).toHaveLength(materialCount);
  expect(lamp.style.getPropertyValue('--movable-x')).toBe(lampX);
  set({ eyeHeightMm: 700 });
  await waitFor(() => expect(canvas.getByRole('alert')).toHaveTextContent('eye height above tabletop'));
  set({ eyeHeightMm: 1650 });
  await waitFor(() => expect(room()).not.toBeNull());
  set({ lampIntensity: 0 });
  await waitFor(() => expect(pool().style.visibility).toBe('hidden'));
  expect(canvasElement.querySelector<SVGCircleElement>('.desk-room__pool')!.style.visibility).toBe('hidden');
  set({ lampIntensity: 3 });
  await waitFor(() => expect(pool().style.filter).toBe('brightness(3)'));
  const size = parseFloat(pool().style.width);
  set({ poolSpread: 2.8 });
  await waitFor(() => expect(parseFloat(pool().style.width)).toBeCloseTo(size * 2, 5));
  set({ viewerSetbackMm: 650 });
  await waitFor(() => expect(Number(camera().style.getPropertyValue('--perspective-angle'))).toBe(90));
}


/** Pixel measurements protect the fixed physical lens, not just its CSS inputs. */
export async function checkPhysicalLens({ canvasElement }: { canvasElement: HTMLElement }) {
  if (import.meta.env.MODE !== 'test') return;
  const canvas = within(canvasElement);
  const seam = () => roomSeam(canvasElement);
  const set = (next: Parameters<ReturnType<typeof seam>['set']>[0]) => seam().set(next);
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
    set({ deskHeightMm: height, deskDepthMm: deskDepth });
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
  set({ headTiltDegrees: 0 });
  await waitFor(()=>expect(canvas.getByRole('alert')).toHaveTextContent('last valid scene'));
  expect(camera().getAttribute('style')).toBe(acceptedCamera);
  set({ headTiltDegrees: 74.47588900324574 });
  await waitFor(()=>expect(canvas.queryByRole('alert')).toBeNull());
  const initialFov=seam().args.horizontalFieldOfViewDegrees ?? referenceFieldOfView(seam().args.deskShare ?? ROOM_DESK_SHARE);
  const initialWidth=stand().width, initialStick=stick().width, initialPrincipal=targetScreenY();
  const initialPose=camera().getAttribute('style');
  for(const fov of [55,85]) {
    set({ horizontalFieldOfViewDegrees: fov });
    const ratio=Math.tan(initialFov*Math.PI/360)/Math.tan(fov*Math.PI/360);
    await waitFor(()=>expect(stand().width/initialWidth).toBeCloseTo(ratio,3));
    expect(camera().getAttribute('style')).toBe(initialPose);
    expect(stick().width/initialStick).toBeCloseTo(ratio,3);
    expect(targetScreenY()).toBeCloseTo(initialPrincipal,1);
  }
  const validWidth=stand().width;
  set({ horizontalFieldOfViewDegrees: 180 });
  await waitFor(()=>expect(canvas.getByRole('alert')).toHaveTextContent('field of view'));
  expect(stand().width).toBeCloseTo(validWidth,1);
  set({ horizontalFieldOfViewDegrees: initialFov });
  await waitFor(()=>expect(canvas.queryByRole('alert')).toBeNull());
  const originalTarget = targetScreenY();
  const original = stand(), originalAngle = angle(), originalDistance = distance();
  set({ eyeHeightMm: 2400 });
  await waitFor(() => expect(stand().width / original.width).toBeCloseTo(900 / 1650, 3));
  expect(angle()).toBe(originalAngle);
  expect(distance()).toBeGreaterThan(originalDistance);
  set({ eyeHeightMm: 2550, viewerSetbackMm: 900 });
  await waitFor(() => expect(stand().width / original.width).toBeCloseTo(.5, 3));
  expect(angle()).toBeCloseTo(originalAngle, 8);
  expect(distance()).toBeCloseTo(originalDistance * 2, 8);
  expect(targetScreenY()).toBeCloseTo(originalTarget, 1);
  set({ eyeHeightMm: 1650 });
  await waitFor(() => expect(stand().width).toBeCloseTo(original.width, 1));
  expect(angle()).toBe(originalAngle);
  expect(distance()).toBe(originalDistance);
  set({ viewerSetbackMm: 650 });
  await waitFor(() => expect(stand().width).toBeCloseTo(original.width, 1));
  const meterWidth = stick().width;
  set({ deskWidthMm: 1800 });
  await waitFor(() => expect(stand().width / original.width).toBeCloseTo(1.5, 3));
  expect(stick().width).toBeCloseTo(meterWidth, 1);
  expect(targetScreenY()).toBeCloseTo(originalTarget, 1);
  // After both camera and frame dimensions change, a 40 px drag still inverts correctly.
  for (const [wallDistance, pitch] of [[0,115], [400,90], [800,65], [1200,74.47588900324574]]) {
    set({ headTiltDegrees: pitch, viewerSetbackMm: wallDistance });
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
  set({ viewerSetbackMm: 650, headTiltDegrees: 85 });
  await waitFor(() => expect(angle()).toBe(85));
  const target = Number.parseFloat(camera().style.getPropertyValue('--perspective-target').replace('calc(', ''));
  expect(distance()*Math.sin(angle()*Math.PI/180)).toBeCloseTo(1080, 6);
  expect(target+distance()*Math.cos(angle()*Math.PI/180)).toBeCloseTo(780, 6);
  set({ headTiltDegrees: 90, viewerSetbackMm: 400 });
  await waitFor(() => expect(angle()).toBe(90));
  const mug = canvas.getByRole('group', { name: /^Mug$/ });
  const framedWidth = stand().width;
  set({ horizontalFieldOfViewDegrees: 85 });
  await waitFor(()=>expect(Math.abs(stand().width - framedWidth)).toBeGreaterThan(1));
  // Measure the lens only once reframing has stopped; a mid-transition width skews the scale.
  let previous = Number.NaN;
  await waitFor(() => { const width = stand().width; const settled = Math.abs(width - previous) < .5; previous = width; expect(settled).toBe(true); });
  const initialX = Number(mug.style.getPropertyValue('--movable-x'));
  const unitsPerPixel = 2160 / stand().width;
  const box = mug.getBoundingClientRect();
  const pointer = { pointerId: 1, button: 0, buttons: 1, clientX: box.x + box.width / 2, clientY: box.y + box.height / 2 };
  fireEvent.pointerDown(mug, pointer);
  fireEvent.pointerMove(mug, { ...pointer, clientX: pointer.clientX + 40 });
  fireEvent.pointerUp(mug, { ...pointer, buttons: 0, clientX: pointer.clientX + 40 });
  await waitFor(() => expect(Math.abs(Number(mug.style.getPropertyValue('--movable-x')) - initialX - 40 * unitsPerPixel)).toBeLessThanOrEqual(1));
}
