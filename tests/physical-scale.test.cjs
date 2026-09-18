const assert = require('node:assert/strict');
const test = require('node:test');
const { DESK_SIZE, PAPER_MM, LAMP_WIDTH, LAMP_HEIGHT, mmToUnits, unitsToMm } = require('../src/geometry/physicalScale.ts');
const { elevatedLayer } = require('../src/behaviors/Perspective/elevation.ts');
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} differs from ${b}`);

test('physical scale preserves fractional millimetres and approved desk and paper sizes', () => {
  assert.deepEqual(DESK_SIZE, { width: 1440, depth: 960, height: 900 });
  close(mmToUnits(PAPER_MM.width), 264);
  close(mmToUnits(PAPER_MM.height), 336);
  for (const size of [0.2, 3.5, 107.95, 215.9, 1200]) close(unitsToMm(mmToUnits(size)), size);
  close(LAMP_WIDTH, 576);
  close(LAMP_HEIGHT, 420);
});

test('a resized solid and relief retain the same height to width ratio', () => {
  const camera = { angle: 84, depth: 8000, width: DESK_SIZE.width, surfaceHeight: DESK_SIZE.depth };
  for (const scale of [0.8, 1, 1.2]) {
    const width = mmToUnits(140) * scale;
    const solidHeight = width * (70 / 140);
    const reliefHeight = mmToUnits(70 * scale);
    close(solidHeight, reliefHeight);
    const object = { x: 100, y: 200, width, drawingWidth: 720, drawingHeight: 720 };
    assert.deepEqual(elevatedLayer(solidHeight, object, camera), elevatedLayer(reliefHeight, object, camera));
  }
});
