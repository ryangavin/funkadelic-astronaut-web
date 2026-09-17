/** Project a point above the desk back into its CSS surface plane. Distances
 * are desk units (the project uses 2 units/mm). Perspective then supplies the
 * final screen projection. Algebraically identical to stand()/unproject(). */
export function projectElevation(
  x: number, y: number, height: number,
  { angle, depth, width, surfaceHeight }: { angle: number; depth: number; width: number; surfaceHeight: number },
) {
  const tilt = (90 - angle) * Math.PI / 180;
  const scale = depth * Math.cos(tilt) / (depth * Math.cos(tilt) - height);
  return {
    x: width / 2 + (x - width / 2) * scale,
    y: surfaceHeight + (y - surfaceHeight - height * Math.tan(tilt)) * scale,
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
