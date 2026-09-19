import { DESK_MM, mmToUnits } from './physicalScale.ts';

export const DEFAULT_HEAD_TILT_DEGREES = 74.47588900324574;

export type PhysicalRoomInputs = {
  /** Legacy ignores physical eye values; physical derives angle/depth from the eye. */
  cameraMode?: 'legacy' | 'physical';
  deskWidthMm?: number; deskDepthMm?: number; deskHeightMm?: number; deskEdgeMm?: number;
  /** Supply both when cameraMode is physical; angle/depth are then ignored. Eye height is above the floor. */
  eyeHeightMm?: number;
  /** Horizontal eye distance from the wall; zero is over the back edge. */
  viewerSetbackMm?: number;
  /** Absolute downward pitch from horizontal, strictly between 0 and 180 degrees. */
  headTiltDegrees?: number;
};

export function positive(name: string, value: number, allowZero = false) {
  if (!Number.isFinite(value) || (allowZero ? value < 0 : value <= 0))
    throw new RangeError(`${name} must be finite and ${allowZero ? 'nonnegative' : 'positive'}`);
  return value;
}

/** Millimetres stay physical; deskShare and viewport size control only framing. */
export function roomSetup({ cameraMode = 'legacy', deskWidthMm = DESK_MM.width, deskDepthMm = DESK_MM.depth,
  deskHeightMm = DESK_MM.height, deskEdgeMm = 10, eyeHeightMm, viewerSetbackMm, headTiltDegrees = DEFAULT_HEAD_TILT_DEGREES }: PhysicalRoomInputs,
  angle = 84, depth = 8000) {
  const width = positive('desk width in units', mmToUnits(positive('deskWidthMm', deskWidthMm)));
  const surfaceHeight = positive('desk depth in units', mmToUnits(positive('deskDepthMm', deskDepthMm)));
  const stand = positive('desk height in units', mmToUnits(positive('deskHeightMm', deskHeightMm)));
  const edge = positive('desk edge in units', mmToUnits(positive('deskEdgeMm', deskEdgeMm, true)), true);
  let targetY: number | undefined;
  if (cameraMode === 'physical') {
    if (eyeHeightMm === undefined || viewerSetbackMm === undefined)
      throw new RangeError('Supply both eyeHeightMm and viewerSetbackMm');
    positive('eyeHeightMm', eyeHeightMm);
    positive('viewerSetbackMm', viewerSetbackMm, true);
    const clearance = eyeHeightMm - deskHeightMm;
    positive('eye height above tabletop', clearance);
    angle = headTiltDegrees;
    if (!Number.isFinite(angle) || angle <= 0 || angle >= 180)
      throw new RangeError('physical look angle must be greater than 0 and less than 180 degrees');
    const pitch = angle * Math.PI / 180;
    depth = mmToUnits(clearance / Math.sin(pitch));
    // CSS projection uses the gaze intersection with the desk plane; it never drives the eye or pitch.
    targetY = mmToUnits(viewerSetbackMm - clearance / Math.tan(pitch));
    if (!Number.isFinite(targetY)) throw new RangeError('camera target must be finite');
  }
  positive('camera depth', depth);
  if (cameraMode !== 'physical' && (!Number.isFinite(angle) || angle <= 0 || angle > 90))
    throw new RangeError('camera angle must be greater than 0 and at most 90 degrees');
  return { camera: { angle, depth, width, surfaceHeight, ...(targetY === undefined ? {} : { targetY }) }, stand, edge };
}

/** Horizontal field of view of the original reference framing. */
export function referenceFieldOfView(deskShare: number) {
  return 2 * Math.atan(1200 / (2 * deskShare * Math.hypot(900, 650))) * 180 / Math.PI;
}

/** Reference lens: the existing 1200 mm desk, viewed 900 mm above and 650 mm back.
 * Perspective's CSS depth is also its focal length. Compensate the outer frame
 * so focal length in viewport pixels stays fixed as the eye moves.
 */
export function roomFraming(camera: { width: number; depth: number }, physical: boolean, deskShare: number, lip: number, horizontalFieldOfViewDegrees?: number) {
  if (!physical) return { deskShare, lip };
  const referenceDistance = mmToUnits(Math.hypot(900, 650));
  const fieldOfView = horizontalFieldOfViewDegrees ?? referenceFieldOfView(deskShare);
  if (!Number.isFinite(fieldOfView) || fieldOfView <= 0 || fieldOfView >= 180)
    throw new RangeError('horizontal field of view must be greater than 0 and less than 180 degrees');
  const focal = 1 / (2 * Math.tan(fieldOfView * Math.PI / 360));
  const zoom = horizontalFieldOfViewDegrees === undefined ? 1 : focal / (deskShare * referenceDistance / mmToUnits(1200));
  // Lens changes preserve the principal point as well as physical eye and gaze.
  const effectiveLip = lip * (camera.depth / referenceDistance) / zoom;
  if (!Number.isFinite(effectiveLip)) throw new RangeError('physical frame lip must be finite');
  return {
    deskShare: positive('physical frame share', deskShare * (camera.width / mmToUnits(1200)) * (referenceDistance / camera.depth) * zoom),
    lip: effectiveLip,
  };
}
