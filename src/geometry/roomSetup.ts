import { DESK_MM, mmToUnits } from './physicalScale.ts';

export type PhysicalRoomInputs = {
  /** Legacy ignores physical eye values; physical derives angle/depth from the eye. */
  cameraMode?: 'legacy' | 'physical';
  deskWidthMm?: number; deskDepthMm?: number; deskHeightMm?: number; deskEdgeMm?: number;
  /** Supply both when cameraMode is physical; angle/depth are then ignored. Eye height is above the floor. */
  eyeHeightMm?: number; viewerSetbackMm?: number;
};

export function positive(name: string, value: number, allowZero = false) {
  if (!Number.isFinite(value) || (allowZero ? value < 0 : value <= 0))
    throw new RangeError(`${name} must be finite and ${allowZero ? 'nonnegative' : 'positive'}`);
  return value;
}

/** Millimetres stay physical; deskShare and viewport size control only framing. */
export function roomSetup({ cameraMode = 'legacy', deskWidthMm = DESK_MM.width, deskDepthMm = DESK_MM.depth,
  deskHeightMm = DESK_MM.height, deskEdgeMm = 10, eyeHeightMm, viewerSetbackMm }: PhysicalRoomInputs,
  angle = 84, depth = 8000) {
  const width = positive('desk width in units', mmToUnits(positive('deskWidthMm', deskWidthMm)));
  const surfaceHeight = positive('desk depth in units', mmToUnits(positive('deskDepthMm', deskDepthMm)));
  const stand = positive('desk height in units', mmToUnits(positive('deskHeightMm', deskHeightMm)));
  const edge = positive('desk edge in units', mmToUnits(positive('deskEdgeMm', deskEdgeMm, true)), true);
  if (cameraMode === 'physical') {
    if (eyeHeightMm === undefined || viewerSetbackMm === undefined)
      throw new RangeError('Supply both eyeHeightMm and viewerSetbackMm');
    positive('eyeHeightMm', eyeHeightMm);
    positive('viewerSetbackMm', viewerSetbackMm, true);
    const clearance = eyeHeightMm - deskHeightMm;
    positive('eye height above tabletop', clearance);
    angle = Math.atan2(clearance, viewerSetbackMm) * 180 / Math.PI;
    depth = mmToUnits(Math.hypot(clearance, viewerSetbackMm));
  }
  positive('camera depth', depth);
  if (!Number.isFinite(angle) || angle <= 0 || angle > 90)
    throw new RangeError('camera angle must be greater than 0 and at most 90 degrees');
  return { camera: { angle, depth, width, surfaceHeight }, stand, edge };
}

/** Reference lens: the existing 1200 mm desk, viewed 900 mm above and 650 mm back.
 * Perspective's CSS depth is also its focal length. Compensate the outer frame
 * so focal length in viewport pixels stays fixed as the eye moves.
 */
export function roomFraming(camera: { width: number; depth: number }, physical: boolean, deskShare: number, lip: number) {
  if (!physical) return { deskShare, lip };
  const referenceDistance = mmToUnits(Math.hypot(900, 650));
  const effectiveLip = lip * (camera.depth / referenceDistance);
  if (!Number.isFinite(effectiveLip)) throw new RangeError('physical frame lip must be finite');
  return {
    deskShare: positive('physical frame share', deskShare * (camera.width / mmToUnits(1200)) * (referenceDistance / camera.depth)),
    lip: effectiveLip,
  };
}
