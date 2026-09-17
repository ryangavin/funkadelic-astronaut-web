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

test('lamp elbow folds toward the desk interior in the default placement', () => {
  const { head, elbow } = articulateLamp({ x: 200, y: 420 });
  const neck = { x: head.x + 60, y: head.y - 40 };
  const cross = (neck.x - LAMP_BASE.x) * (elbow.y - LAMP_BASE.y)
    - (neck.y - LAMP_BASE.y) * (elbow.x - LAMP_BASE.x);
  assert.ok(cross < 0, 'elbow must remain on the inward side of the base-to-head line');
});

test('upper joint aims freely while lower hinge holds its pose', () => {
  const previous = articulateLamp({ x: 360, y: 300 });
  const angle = Math.atan2(previous.head.y - 40 - previous.elbow.y, previous.head.x + 60 - previous.elbow.x) + 0.2;
  const target = { x: previous.elbow.x + LAMP_ARMS[1] * Math.cos(angle) - 60, y: previous.elbow.y + LAMP_ARMS[1] * Math.sin(angle) + 40 };
  const next = articulateLamp(target, previous);
  assert.deepEqual(next.elbow, previous.elbow);
  assert.ok(Math.hypot(next.head.x - target.x, next.head.y - target.y) < 1e-8);
});

test('lower hinge yields only when needed and sequential poses retain rigid links', () => {
  let pose = articulateLamp({ x: 360, y: 300 });
  const first = pose.elbow;
  for (let i = 0; i < 60; i++) {
    const target = { x: 260 + Math.cos(i / 10) * 130, y: 280 + Math.sin(i / 10) * 110 };
    pose = articulateLamp(target, pose);
    assert.ok(Math.abs(Math.hypot(pose.elbow.x - LAMP_BASE.x, pose.elbow.y - LAMP_BASE.y) - LAMP_ARMS[0]) < 1e-8);
    assert.ok(Math.abs(Math.hypot(pose.head.x + 60 - pose.elbow.x, pose.head.y - 40 - pose.elbow.y) - LAMP_ARMS[1]) < 1e-8);
    const bounded = articulateLamp(target).head;
    assert.ok(Math.hypot(pose.head.x - bounded.x, pose.head.y - bounded.y) <= 6.00001);
  }
  assert.ok(Math.hypot(first.x - pose.elbow.x, first.y - pose.elbow.y) > 10);
});
