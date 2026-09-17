const assert = require('node:assert/strict');
const test = require('node:test');
const { projectElevation, elevatedLayer } = require('../src/behaviors/Perspective/elevation.ts');

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} differs from ${b}`);

test('elevated layers agree with direct 3D camera projection across the desk', () => {
  for (const angle of [78, 84, 90]) {
    const camera = { angle, depth: 8000, width: 1440, surfaceHeight: 800 };
    const tilt = (90 - angle) * Math.PI / 180;
    const screen = (x, y, h) => {
      const b = y - 800;
      const q = 8000 / (8000 - b * Math.sin(tilt) - h * Math.cos(tilt));
      return { x: 720 + (x - 720) * q, y: 800 + (b * Math.cos(tilt) - h * Math.sin(tilt)) * q };
    };
    for (const x of [100, 720, 1300]) for (const y of [50, 400, 750]) for (const h of [0, 46, 60, 180]) {
      const plane = projectElevation(x, y, h, camera);
      const actual = screen(plane.x, plane.y, 0);
      const expected = screen(x, y, h);
      close(actual.x, expected.x);
      close(actual.y, expected.y);
    }
  }
});

test('layer transforms preserve physical position through arbitrary object rotation', () => {
  const camera = { angle: 84, depth: 8000, width: 1440, surfaceHeight: 800 };
  for (const rotation of [-130, -8, 0, 70, 180]) {
    const object = { x: 450, y: 220, width: 224, drawingWidth: 720, drawingHeight: 590, rotation };
    const layer = elevatedLayer(60, object, camera);
    const turn = rotation * Math.PI / 180;
    const unit = 224 / 720;
    const cx = 562, cy = 220 + 590 * unit / 2;
    const target = projectElevation(cx, cy, 60, camera);
    close(cx + (layer.x * Math.cos(turn) - layer.y * Math.sin(turn)) * unit, target.x);
    close(cy + (layer.x * Math.sin(turn) + layer.y * Math.cos(turn)) * unit, target.y);
    close(layer.scale, target.scale);
  }
});
