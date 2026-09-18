/** Inverse projection of the fixed 16:9 Room frame into its two background planes.
 * Only the visible parts are required; material sizes and the desk stay unchanged.
 * Explicit extents override these automatic values at the call site.
 */
export function roomCoverage({ angle, depth: d, deskWidth, deskDepth, stand, deskShare, lip }: {
  angle: number; depth: number; deskWidth: number; deskDepth: number;
  stand: number; deskShare: number; lip: number;
}) {
  const tilt = (90 - angle) * Math.PI / 180;
  const c = Math.cos(tilt), s = Math.sin(tilt);
  const width = deskWidth / deskShare;
  // A small bleed hides antialiasing and the room's blur at the crop boundary.
  const bleed = width * 0.004;
  const top = lip - width * 9 / 16 - bleed, bottom = lip + bleed;
  const seamZ = -stand * c - deskDepth * s;
  const seamY = d * (stand * s - deskDepth * c) / (d - seamZ);
  let span = 0, front = 0, wallHeight = 0;
  const coverWidth = (z: number) => { span = Math.max(span, (width + 2 * bleed) * (d - z) / d); };
  if (bottom >= seamY) {
    for (const y of [Math.max(top, seamY), bottom]) {
      const denominator = d * c + y * s;
      if (denominator <= 0) continue; // Ray parallel to, or behind, this plane.
      const t = (y * (d + stand * c) - d * stand * s) / denominator;
      front = Math.max(front, t);
      coverWidth(-stand * c + t * s);
    }
  }
  if (top <= seamY) {
    for (const y of [top, Math.min(bottom, seamY)]) {
      const denominator = d * s - y * c;
      if (denominator <= 0) continue;
      const h = (d * (stand * s - deskDepth * c) - y * (d - seamZ)) / denominator;
      wallHeight = Math.max(wallHeight, h);
      coverWidth(seamZ + h * c);
    }
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
    throw new RangeError('Room material renderer capacity exceeded (128 floor courses / 10,000 material cells). This is a rendering resource limit, not an invalid camera. Increase eye clearance, reduce room extents, or disable the room background');
  }
  return { span, front, wallHeight };
}
