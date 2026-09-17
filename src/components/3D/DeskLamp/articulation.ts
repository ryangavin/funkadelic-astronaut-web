export type LampPoint = { x: number; y: number };
export const LAMP_BASE = { x: 600, y: 110 };
// Horizontal lengths at the fixed base/elbow/head elevations, in the original artwork's units.
export const LAMP_ARMS = [Math.hypot(180, 140), Math.hypot(220, 170)] as const;

/** Two rigid links, one consistent inward elbow bend, with a small margin at full extension/folding. */
export type LampPose = { head: LampPoint; elbow: LampPoint };

export function articulateLamp(target: LampPoint, previous?: LampPose, give = 6): LampPose {
  const [a, b] = LAMP_ARMS;
  const dx = target.x - LAMP_BASE.x, dy = target.y - LAMP_BASE.y;
  const distance = Math.hypot(dx, dy);
  const reach = Math.min(a + b - 0.01, Math.max(Math.abs(a - b) + 0.01, distance));
  const ux = distance > 0 ? dx / distance : -1;
  const uy = distance > 0 ? dy / distance : 0;
  const along = (a * a - b * b + reach * reach) / (2 * reach);
  const bend = Math.sqrt(Math.max(0, a * a - along * along));
  const pose = {
    head: { x: LAMP_BASE.x + ux * reach, y: LAMP_BASE.y + uy * reach },
    elbow: { x: LAMP_BASE.x + ux * along + uy * bend, y: LAMP_BASE.y + uy * along - ux * bend },
  };
  if (!previous) return pose;
  const alternate = { x: LAMP_BASE.x + ux * along - uy * bend, y: LAMP_BASE.y + uy * along + ux * bend };
  const distanceToPrevious = (p: LampPoint) => Math.hypot(p.x - previous.elbow.x, p.y - previous.elbow.y);
  if (distanceToPrevious(alternate) < distanceToPrevious(pose.elbow)) pose.elbow = alternate;
  if (give <= 0) return pose;

  // Static friction at the lower hinge: let the upper link aim freely first.
  // Only rotate the lower link enough to bring the target within a small give
  // distance. Both links stay rigid and the weighted base never translates.
  const neck = { x: pose.head.x, y: pose.head.y };
  const from = Math.atan2(previous.elbow.y - LAMP_BASE.y, previous.elbow.x - LAMP_BASE.x);
  const to = Math.atan2(pose.elbow.y - LAMP_BASE.y, pose.elbow.x - LAMP_BASE.x);
  const delta = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  const elbowAt = (t: number) => ({ x: LAMP_BASE.x + a * Math.cos(from + delta * t), y: LAMP_BASE.y + a * Math.sin(from + delta * t) });
  const error = (p: LampPoint) => Math.abs(Math.hypot(neck.x - p.x, neck.y - p.y) - b);
  let elbow = previous.elbow;
  if (error(elbow) > give) {
    let low = 0, high = 1;
    for (let i = 0; i < 32; i++) {
      const middle = (low + high) / 2;
      if (error(elbowAt(middle)) > give) low = middle;
      else high = middle;
    }
    elbow = elbowAt(high);
  }
  const upperAngle = Math.atan2(neck.y - elbow.y, neck.x - elbow.x);
  return { elbow, head: { x: elbow.x + b * Math.cos(upperAngle), y: elbow.y + b * Math.sin(upperAngle) } };
}

/** Absolute local arm angles in degrees preserve the exact bend, including its side. */
export function lampPoseAngles(pose: LampPose) {
  return {
    lower: Math.atan2(pose.elbow.y - LAMP_BASE.y, pose.elbow.x - LAMP_BASE.x) * 180 / Math.PI,
    upper: Math.atan2(pose.head.y - pose.elbow.y, pose.head.x - pose.elbow.x) * 180 / Math.PI,
  };
}

export function lampPoseFromAngles(lower: number, upper: number): LampPose {
  const a = lower * Math.PI / 180, b = upper * Math.PI / 180;
  const elbow = { x: LAMP_BASE.x + LAMP_ARMS[0] * Math.cos(a), y: LAMP_BASE.y + LAMP_ARMS[0] * Math.sin(a) };
  return { elbow, head: { x: elbow.x + LAMP_ARMS[1] * Math.cos(b), y: elbow.y + LAMP_ARMS[1] * Math.sin(b) } };
}
