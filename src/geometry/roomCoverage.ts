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
