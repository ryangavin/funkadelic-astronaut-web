const assert = require('node:assert/strict');
const test = require('node:test');
const { articulateLamp, LAMP_ARMS, LAMP_BASE } = require('../src/components/3D/DeskLamp/articulation.ts');

test('lamp articulation preserves both rigid arm lengths at ordinary and unreachable head positions', () => {
  for (const target of [{ x: 200, y: 420 }, { x: 360, y: 300 }, { x: -10000, y: 10000 }, { x: 540, y: 150 }, { x: 900, y: -300 }]) {
    const { head, elbow } = articulateLamp(target);
    const first = Math.hypot(elbow.x - LAMP_BASE.x, elbow.y - LAMP_BASE.y);
    const second = Math.hypot(head.x + 60 - elbow.x, head.y - 40 - elbow.y);
    assert.ok(Math.abs(first - LAMP_ARMS[0]) < 1e-8);
    assert.ok(Math.abs(second - LAMP_ARMS[1]) < 1e-8);
    assert.ok([head.x, head.y, elbow.x, elbow.y].every(Number.isFinite));
  }
});
