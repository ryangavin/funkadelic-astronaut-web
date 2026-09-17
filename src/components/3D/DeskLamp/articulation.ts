export type LampPoint = { x: number; y: number };
export const LAMP_BASE = { x: 600, y: 110 };
// Horizontal lengths at the fixed base/elbow/head elevations, in the original artwork's units.
export const LAMP_ARMS = [Math.hypot(180, 140), Math.hypot(160, 130)] as const;

/** Two rigid links, one consistent elbow bend, with a small margin at full extension/folding. */
export function articulateLamp(target: LampPoint) {
  const [a, b] = LAMP_ARMS;
  const dx = target.x + 60 - LAMP_BASE.x, dy = target.y - 40 - LAMP_BASE.y;
  const distance = Math.hypot(dx, dy);
  const reach = Math.min(a + b - 0.01, Math.max(Math.abs(a - b) + 0.01, distance));
  const ux = distance > 0 ? dx / distance : -1;
  const uy = distance > 0 ? dy / distance : 0;
  const along = (a * a - b * b + reach * reach) / (2 * reach);
  const bend = Math.sqrt(Math.max(0, a * a - along * along));
  return {
    head: { x: LAMP_BASE.x + ux * reach - 60, y: LAMP_BASE.y + uy * reach + 40 },
    elbow: { x: LAMP_BASE.x + ux * along - uy * bend, y: LAMP_BASE.y + uy * along + ux * bend },
  };
}
