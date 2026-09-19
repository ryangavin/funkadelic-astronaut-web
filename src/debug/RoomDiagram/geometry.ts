import { unitsToMm } from '../../geometry/physicalScale.ts';
import type { RoomSceneGeometry } from '../../foundations/Room/Room';
import type { DeskLight } from '../../behaviors/DeskLighting/DeskLighting';
export type Point3 = { x: number; y: number; z: number };
export function diagramGeometry({ setup, extents, lensFieldOfViewDegrees }: RoomSceneGeometry, light: DeskLight | null) {
  const { camera, stand, edge } = setup, pitch = camera.angle * Math.PI / 180;
  const width = unitsToMm(camera.width), depth = unitsToMm(camera.surfaceHeight), height = unitsToMm(stand);
  const target = { x: 0, y: unitsToMm(camera.targetY ?? camera.surfaceHeight), z: height };
  const eye = { x: 0, y: target.y + unitsToMm(camera.depth) * Math.cos(pitch), z: height + unitsToMm(camera.depth) * Math.sin(pitch) };
  const center = { x: 0, y: depth / 2, z: height };
  const point = (value: { x: number; y: number; height: number }): Point3 => ({ x: unitsToMm(value.x) - width / 2, y: unitsToMm(value.y), z: height + unitsToMm(value.height) });
  return { width, depth, height, lensFieldOfViewDegrees, edge: unitsToMm(edge), eye, target, center, pitch: camera.angle,
    span: extents ? unitsToMm(extents.span) : width, floorDepth: extents ? depth + unitsToMm(extents.front) : depth, wallHeight: extents ? unitsToMm(extents.wallHeight) : 0,
    lamp: light?.lamp ? { base: point(light.lamp.base), elbow: point(light.lamp.elbow), neck: point(light.lamp.neck), shade: point(light.lamp.shade ?? light.lamp.neck), bulb: point(light), baseRadius: unitsToMm(light.lamp.base.radius), shadeRadius: unitsToMm(light.lamp.shade?.radius ?? light.lamp.neck.radius * 130 / 11), on: light.on } : null,
  };
}
/** Orthographic orbit only: independent of the physical scene camera. */
export function projectDiagram(point: Point3, yaw: number, pitch: number) {
  const a = yaw * Math.PI / 180, b = pitch * Math.PI / 180;
  const sideways = point.x * Math.cos(a) - point.y * Math.sin(a);
  const forward = point.x * Math.sin(a) + point.y * Math.cos(a);
  return { x: sideways, y: forward * Math.sin(b) - point.z * Math.cos(b), depth: forward * Math.cos(b) + point.z * Math.sin(b) };
}
