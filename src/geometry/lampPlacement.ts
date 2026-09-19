/** Lamp artwork and its live Movable box share one pivot, scale and rotation. */
export function lampPlacement(width: number, place: { x: number; y: number; rotation?: number; scale?: number }, rotation = 0) {
  const scale = place.scale ?? 1, unit = width * scale / 720;
  const turn = ((place.rotation ?? 0) + rotation) * Math.PI / 180;
  const c = Math.cos(turn), s = Math.sin(turn);
  const cx = place.x + 360 * unit, cy = place.y + 300 * unit;
  return {
    scale, unit,
    world: (x: number, y: number, height: number, radius = 0) => ({ x: cx + unit * ((x - 360) * c - (y - 300) * s), y: cy + unit * ((x - 360) * s + (y - 300) * c), height: height * scale, radius: radius * unit }),
    local: (x: number, y: number) => ({ x: 360 + ((x - cx) * c + (y - cy) * s) / unit, y: 300 + (-(x - cx) * s + (y - cy) * c) / unit }),
  };
}
