/** Inverse projection of the fixed 16:9 Room frame into its two background planes.
 * Only the visible parts are required; material sizes and the desk stay unchanged.
 * Explicit extents override these automatic values at the call site.
 */
export function roomCoverage({ angle, depth: d, deskWidth, deskDepth, stand, deskShare, lip, targetY = deskDepth, frameAnchor = 1 }: {
  angle: number; depth: number; deskWidth: number; deskDepth: number;
  stand: number; deskShare: number; lip: number; targetY?: number; frameAnchor?: number;
}) {
  const tilt = (90 - angle) * Math.PI / 180;
  const c = Math.cos(tilt), s = Math.sin(tilt);
  const width = deskWidth / deskShare;
  const bleed = width * 0.004;
  const top = lip - width * 9 / 16 * frameAnchor - bleed;
  const bottom = lip + width * 9 / 16 * (1 - frameAnchor) + bleed;
  const eyeHeight = d * c, eyeY = targetY + d * s;
  const seamZ = -stand * c - targetY * s;
  const seamY = d * (stand * s - targetY * c) / (d - seamZ);
  const samples = [top, bottom];
  if (Number.isFinite(seamY) && seamY > top && seamY < bottom) samples.push(seamY);
  let span = 0, front = 0, wallHeight = 0;
  for (const y of samples) {
    const floorDenominator = y * s + d * c;
    const floorLambda = (eyeHeight + stand) / floorDenominator;
    const floorY = eyeY + floorLambda * (y * c - d * s);
    if (floorDenominator > 0 && floorY >= -1e-7) {
      front = Math.max(front, floorY - deskDepth);
      span = Math.max(span, (width + 2 * bleed) * floorLambda);
      continue;
    }
    const wallDenominator = d * s - y * c;
    const wallLambda = eyeY / wallDenominator;
    const wallZ = eyeHeight - wallLambda * (y * s + d * c);
    if (wallDenominator > 0 && wallLambda > 0 && wallZ >= -stand - 1e-7) {
      wallHeight = Math.max(wallHeight, wallZ + stand);
      span = Math.max(span, (width + 2 * bleed) * wallLambda);
      continue;
    }
    // A frame ray misses both available room planes (for example beyond the
    // floor horizon). No finite material allocation can cover this view.
    return { span: Infinity, front: Infinity, wallHeight: Infinity };
  }
  return { span, front, wallHeight };
}

/** Limits of this DOM-based material renderer, not restrictions on valid cameras.
 * Count work before Floor builds course/joint arrays or Wall scans brick cells.
 * The course bound also limits independent SVG grain-filter surfaces.
 */
export const ROOM_MATERIAL_BUDGET = { floorCourses: 128, materialCells: 10000 };
export function roomSurfaceExtents(inputs: Parameters<typeof roomCoverage>[0], overrides: {
  span?: number; front?: number; wallHeight?: number;
} = {}) {
  const coverage = roomCoverage(inputs);
  const span = overrides.span ?? Math.max(2640, coverage.span);
  const front = overrides.front ?? Math.max(400, coverage.front);
  const wallHeight = overrides.wallHeight ?? Math.max(2880, coverage.wallHeight);
  const floorDepth = inputs.deskDepth + front;
  const floorCourses = Math.ceil(floorDepth / 96);
  const floorCells = floorCourses * (Math.ceil(span / 360) + 3);
  const wallCells = Math.ceil(wallHeight / 90) * (Math.ceil(span / 270) + 2);
  if (![span, front, wallHeight, floorDepth, floorCells, wallCells].every(Number.isFinite)
      || floorCourses > ROOM_MATERIAL_BUDGET.floorCourses
      || floorCells + wallCells > ROOM_MATERIAL_BUDGET.materialCells) {
    throw new RangeError('Room material renderer capacity exceeded (128 floor courses / 10,000 material cells). This is a rendering resource limit, not an invalid camera. Adjust the camera, reduce room extents, or disable the room background');
  }
  return { span, front, wallHeight };
}
