const assert = require('node:assert/strict');
const test = require('node:test');
const { roomSetup } = require('../src/geometry/roomSetup.ts');
const { lightingSetup, DEFAULT_LIGHT_TUNING } = require('../src/geometry/lightingSetup.ts');
const { projectElevation } = require('../src/behaviors/Perspective/elevation.ts');
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);

test('legacy physical dimensions and camera defaults preserve existing Room', () => {
  assert.deepEqual(roomSetup({}, 84, 8000), { camera: { angle: 84, depth: 8000, width: 1440, surfaceHeight: 960 }, stand: 900, edge: 12 });
  assert.equal(roomSetup({ eyeHeightMm: 1, viewerSetbackMm: -1 }, 84, 8000).camera.angle, 84);
});
test('eye and setback derive one physical camera without changing unit scale', () => {
  for (const [eye, desk, setback] of [[1650, 750, 900], [1800, 900, 420], [1650, 750, 0]]) {
    const { camera, stand } = roomSetup({ cameraMode: 'physical', eyeHeightMm: eye, deskHeightMm: desk, viewerSetbackMm: setback, deskWidthMm: 1600, deskDepthMm: 1000 });
    near(camera.angle, Math.atan2(eye - desk, setback) * 180 / Math.PI);
    near(camera.depth, Math.hypot(eye - desk, setback) * 1.2);
    near(camera.depth * Math.sin(camera.angle * Math.PI / 180), (eye - desk) * 1.2);
    assert.equal(camera.width, 1920); assert.equal(camera.surfaceHeight, 1200); assert.equal(stand, desk * 1.2);
  }
});
test('legacy camera can round trip through physical eye coordinates', () => {
  for (const angle of [15, 45, 60, 84, 90]) {
    const depth = 3200, radians = angle * Math.PI / 180;
    const { camera } = roomSetup({ cameraMode: 'physical', eyeHeightMm: 750 + depth * Math.sin(radians) / 1.2, viewerSetbackMm: depth * Math.cos(radians) / 1.2 });
    near(camera.angle, angle); near(camera.depth, depth);
  }
});
test('physical projection agrees with direct 3D and its surface inverse at lower/overhead views', () => {
  for (const angle of [15, 45, 65, 90]) for (const width of [960, 1920]) for (const surfaceHeight of [600, 1200]) {
    const camera = { angle, depth: 2400, width, surfaceHeight };
    const tilt = (90 - angle) * Math.PI / 180, c = Math.cos(tilt), s = Math.sin(tilt);
    const screen = (x, y, h) => { const k = camera.depth / (camera.depth - (y - surfaceHeight) * s - h * c); return { x: width / 2 + (x - width / 2) * k, y: surfaceHeight + ((y - surfaceHeight) * c - h * s) * k }; };
    for (const x of [100, width / 2, width - 100]) for (const y of [50, surfaceHeight - 50]) {
      const plane = projectElevation(x, y, 100, camera);
      const actual = screen(plane.x, plane.y, 0), expected = screen(x, y, 100);
      near(actual.x, expected.x); near(actual.y, expected.y);
      const flat = screen(x, y, 0), up = flat.y - surfaceHeight;
      const back = up * camera.depth / (camera.depth * c + up * s);
      near(back + surfaceHeight, y);
      near(width / 2 + (flat.x - width / 2) * (camera.depth - back * s) / camera.depth, x);
    }
  }
});
test('invalid setups reject explicitly; eye-plane artwork hides without infinity/inversion', () => {
  for (const bad of [0, -1, Infinity, NaN]) for (const key of ['deskWidthMm', 'deskDepthMm', 'deskHeightMm']) assert.throws(() => roomSetup({ [key]: bad }), RangeError);
  for (const eyeHeightMm of [700, 750, NaN, Infinity]) assert.throws(() => roomSetup({ cameraMode: 'physical', eyeHeightMm, viewerSetbackMm: 10 }), RangeError);
  assert.throws(() => roomSetup({ cameraMode: 'physical', eyeHeightMm: 1700 }), /both/);
  assert.throws(() => roomSetup({ cameraMode: 'physical', eyeHeightMm: 1700, viewerSetbackMm: -1 }), RangeError);
  for (const angle of [0, -1, 91, NaN]) assert.throws(() => roomSetup({}, angle, 8000), RangeError);
  const camera = roomSetup({ cameraMode: 'physical', eyeHeightMm: 850, viewerSetbackMm: 100 }).camera;
  for (const h of [120, 121, 1000]) {
    const result = projectElevation(100, 200, h, camera);
    assert.equal(result.scale, 0); assert.ok(Object.values(result).every(Number.isFinite));
  }
});
test('lighting preserves defaults and permits experimental values beyond aesthetic ranges', () => {
  assert.deepEqual(lightingSetup(), DEFAULT_LIGHT_TUNING);
  assert.equal(lightingSetup({ poolSpread: 12, floorShadowTemper: 8 }).poolSpread, 12);
  for (const input of [{ shadowScaleLimit: .9 }, { shadowAttenuation: 0 }, { poolSpread: -1 }, { floorPoolSpread: Infinity }]) assert.throws(() => lightingSetup(input), RangeError);
});
