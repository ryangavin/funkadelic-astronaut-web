/** Project a point above the desk back into its CSS surface plane. Distances
 * are desk units (see geometry/physicalScale.ts). Perspective then supplies the
 * final screen projection. Algebraically identical to stand()/unproject(). */
export function projectElevation(
  x: number, y: number, height: number,
  { angle, depth, width, surfaceHeight, targetY = surfaceHeight }: { angle: number; depth: number; width: number; surfaceHeight: number; targetY?: number },
) {
  const tilt = (90 - angle) * Math.PI / 180;
  const clearance = depth * Math.cos(tilt);
  // This 2.5D surface representation cannot express a plane through/above the eye.
  // Hide that layer explicitly instead of emitting infinity or an inverted scale.
  if (clearance - height <= Number.EPSILON * Math.max(1, clearance, height) * 8) return { x: width / 2, y: targetY, scale: 0 };
  const scale = clearance / (clearance - height);
  return {
    x: width / 2 + (x - width / 2) * scale,
    y: targetY + (y - targetY - height * Math.tan(tilt)) * scale,
    scale,
  };
}

/** Affine transform for a horizontal artwork layer at a physical elevation.
 * Its origin is the drawing's centre; rotation is its existing desk rotation. */
export function elevatedLayer(
  height: number,
  object: { x: number; y: number; width: number; drawingWidth: number; drawingHeight: number; rotation?: number },
  camera: Parameters<typeof projectElevation>[3],
) {
  const unitsPerPixel = object.width / object.drawingWidth;
  const cx = object.x + object.width / 2;
  const cy = object.y + object.drawingHeight * unitsPerPixel / 2;
  const projected = projectElevation(cx, cy, height, camera);
  const turn = (object.rotation ?? 0) * Math.PI / 180;
  const dx = projected.x - cx;
  const dy = projected.y - cy;
  const x = (dx * Math.cos(turn) + dy * Math.sin(turn)) / unitsPerPixel;
  const y = (-dx * Math.sin(turn) + dy * Math.cos(turn)) / unitsPerPixel;
  return { x, y, scale: projected.scale };
}

/** The view a horizontal layer is elevated through: an object's surface, seen from somewhere. */
export type StudyCamera = Parameters<typeof elevatedLayer>[2];

/** One outline of a thing in plan, and how far above the desk that part of it reaches. */
export type StudyShape = { path: string; heightMm?: number };

/** The default footprint: a rounded square, for a thing that has not been drawn one. */
export const ROUND_CASE = 'M8 0H92Q100 0 100 8V92Q100 100 92 100H8Q0 100 0 92V8Q0 0 8 0Z';
