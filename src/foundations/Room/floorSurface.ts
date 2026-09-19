import type { roomSetup } from '../../geometry/roomSetup.ts';
/** Re-express the same eye and lens relative to the floor for ordinary Solid artwork. */
export function floorCamera(camera:ReturnType<typeof roomSetup>['camera'],stand:number,share:number,lip:number) {
  const pitch=camera.angle*Math.PI/180;
  const depth=camera.depth+stand/Math.sin(pitch);
  return {camera:{...camera,depth,targetY:(camera.targetY??camera.surfaceHeight)-stand/Math.tan(pitch)},share:share*camera.depth/depth,lip:lip*depth/camera.depth};
}
