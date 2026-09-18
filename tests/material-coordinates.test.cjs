const test = require('node:test');
const assert = require('node:assert/strict');
const { materialRows, floorMaterialJoints, floorGrainTile, wallMaterialBricks } = require('../src/geometry/materialCoordinates.ts');

test('signed material rows retain their identity when a crop expands in any direction', () => {
  assert.deepEqual(materialRows(-201, 301, 90), [-3, -2, -1, 0, 1]);
  assert.deepEqual(materialRows(-180, 180, 90), [-2, -1]);
});
test('floor joints and grain remain anchored across negative coordinates and fractional crop edges', () => {
  for (const row of [-12, -1, 0, 7]) {
    const initial = floorMaterialJoints(row, -1319.5, 2639, 360);
    const expanded = floorMaterialJoints(row, -2333.3, 4666.6, 360).filter(x => x >= -1319.5 && x < 1319.5);
    assert.deepEqual(initial, expanded);
    assert.ok(initial.some(x => x < 0));
    assert.notEqual(floorGrainTile(row, 96), floorGrainTile(row + 1, 96));
  }
  assert.deepEqual(floorMaterialJoints(0, -500, 1000, 0), []);
});
test('wall wear and running bond belong to world cells, regardless of crop width or height', () => {
  const crop = { x: -1319.5, y: -2881.1 };
  const before = wallMaterialBricks(crop, 2639, 2881.1, 270, 90, 100);
  const after = wallMaterialBricks({ x: -2333.3, y: -4007.5 }, 4666.6, 4007.5, 270, 90, 100);
  const cells = new Map(after.map(cell => [`${cell.x}:${cell.y}`, cell]));
  for (const cell of before) assert.deepEqual(cell, cells.get(`${cell.x}:${cell.y}`));
  assert.ok(before.some(cell => cell.x < 0 && cell.y < 0));
  for (const cell of before) assert.equal(Math.abs(cell.x % 270), Math.abs((cell.y / 90) % 2) ? 135 : 0);
});
