const assert = require('node:assert/strict');
const test = require('node:test');
const { articulateLamp, LAMP_ARMS, LAMP_BASE } = require('../src/components/3D/DeskLamp/articulation.ts');

test('lamp articulation preserves both rigid arm lengths at ordinary and unreachable head positions', () => {
  for (const target of [{ x: 200, y: 420 }, { x: 360, y: 300 }, { x: -10000, y: 10000 }, { x: 540, y: 150 }, { x: 900, y: -300 }]) {
    const { head, elbow } = articulateLamp(target);
    const first = Math.hypot(elbow.x - LAMP_BASE.x, elbow.y - LAMP_BASE.y);
    const second = Math.hypot(head.x - elbow.x, head.y - elbow.y);
    assert.ok(Math.abs(first - LAMP_ARMS[0]) < 1e-8);
    assert.ok(Math.abs(second - LAMP_ARMS[1]) < 1e-8);
    assert.ok([head.x, head.y, elbow.x, elbow.y].every(Number.isFinite));
  }
});

test('lamp elbow folds toward the desk interior in the default placement', () => {
  const { head, elbow } = articulateLamp({ x: 200, y: 420 });
  const neck = { x: head.x, y: head.y };
  const cross = (neck.x - LAMP_BASE.x) * (elbow.y - LAMP_BASE.y)
    - (neck.y - LAMP_BASE.y) * (elbow.x - LAMP_BASE.x);
  assert.ok(cross < 0, 'elbow must remain on the inward side of the base-to-head line');
});

test('upper joint aims freely while lower hinge holds its pose', () => {
  const previous = articulateLamp({ x: 360, y: 300 });
  const angle = Math.atan2(previous.head.y - previous.elbow.y, previous.head.x - previous.elbow.x) + 0.2;
  const target = { x: previous.elbow.x + LAMP_ARMS[1] * Math.cos(angle), y: previous.elbow.y + LAMP_ARMS[1] * Math.sin(angle) };
  const next = articulateLamp(target, previous);
  assert.deepEqual(next.elbow, previous.elbow);
  assert.ok(Math.hypot(next.head.x - target.x, next.head.y - target.y) < 1e-8);
});

test('lower hinge yields only when needed and sequential poses retain rigid links', () => {
  let pose = articulateLamp({ x: 360, y: 300 });
  const first = pose.elbow;
  let excursion = 0;
  for (let i = 0; i < 60; i++) {
    const target = { x: 260 + Math.cos(i / 10) * 130, y: 280 + Math.sin(i / 10) * 110 };
    pose = articulateLamp(target, pose);
    excursion = Math.max(excursion, Math.hypot(first.x - pose.elbow.x, first.y - pose.elbow.y));
    assert.ok(Math.abs(Math.hypot(pose.elbow.x - LAMP_BASE.x, pose.elbow.y - LAMP_BASE.y) - LAMP_ARMS[0]) < 1e-8);
    assert.ok(Math.abs(Math.hypot(pose.head.x - pose.elbow.x, pose.head.y - pose.elbow.y) - LAMP_ARMS[1]) < 1e-8);
    const bounded = articulateLamp(target).head;
    assert.ok(Math.hypot(pose.head.x - bounded.x, pose.head.y - bounded.y) <= 6.00001);
  }
  assert.ok(excursion > 10);
});

test('the head reaches any target within the arms\' span exactly, and stops just short of full extension or full fold beyond it', () => {
  const [a, b] = LAMP_ARMS;
  const headDistance = pose => Math.hypot(pose.head.x - LAMP_BASE.x, pose.head.y - LAMP_BASE.y);
  for (const direction of [0, 0.7, 2, -2.5]) {
    const towards = distance => ({ x: LAMP_BASE.x + distance * Math.cos(direction), y: LAMP_BASE.y + distance * Math.sin(direction) });
    for (const distance of [Math.abs(a - b) + 1, (a + b) / 2, a + b - 1]) {
      const target = towards(distance), { head } = articulateLamp(target);
      assert.ok(Math.hypot(head.x - target.x, head.y - target.y) < 1e-8);
    }
    for (const distance of [a + b, a + b + 50, 1e6]) {
      const pose = articulateLamp(towards(distance));
      assert.ok(Math.abs(headDistance(pose) - (a + b - 0.01)) < 1e-8);
      assert.ok(Math.abs(Math.atan2(pose.head.y - LAMP_BASE.y, pose.head.x - LAMP_BASE.x) - direction) < 1e-8, 'stays on the line to the target');
    }
    for (const distance of [Math.abs(a - b), 1]) assert.ok(Math.abs(headDistance(articulateLamp(towards(distance))) - (Math.abs(a - b) + 0.01)) < 1e-8);
  }
  // Aimed at its own base there is no direction to reach in; it folds to the left rather than failing.
  const folded = articulateLamp(LAMP_BASE);
  assert.ok(Math.abs(folded.head.y - LAMP_BASE.y) < 1e-8 && folded.head.x < LAMP_BASE.x);
});

test('joint angles turned into a pose and back give the same angles', () => {
  const { lampPoseAngles, lampPoseFromAngles } = require('../src/components/3D/DeskLamp/articulation.ts');
  for (const lower of [-170, -45, 0, 38, 120]) for (const upper of [-90, 10, 179]) {
    const angles = lampPoseAngles(lampPoseFromAngles(lower, upper));
    assert.ok(Math.abs(angles.lower - lower) < 1e-8);
    assert.ok(Math.abs(angles.upper - upper) < 1e-8);
  }
});

test('saved joint angles restore the exact articulated pose', () => {
  const { lampPoseAngles, lampPoseFromAngles } = require('../src/components/3D/DeskLamp/articulation.ts');
  let pose = articulateLamp({ x: 200, y: 420 });
  for (const target of [{ x: 350, y: 200 }, { x: 500, y: 400 }, { x: 140, y: 330 }]) {
    pose = articulateLamp(target, pose);
    const angles = JSON.parse(JSON.stringify(lampPoseAngles(pose)));
    const restored = lampPoseFromAngles(angles.lower, angles.upper);
    assert.ok(Math.hypot(pose.head.x - restored.head.x, pose.head.y - restored.head.y) < 1e-8);
    assert.ok(Math.hypot(pose.elbow.x - restored.elbow.x, pose.elbow.y - restored.elbow.y) < 1e-8);
  }
});
