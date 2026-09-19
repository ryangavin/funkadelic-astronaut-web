/** Millimetres, anchored to the wall-floor seam rather than coverage bounds. */
export const WALL_WINDOW = { width: 1100, height: 1000, sill: 1000, artWidth: 1600, artHeight: 1200, artBelow: 120 } as const;
export function windowLandmarks(height:number=WALL_WINDOW.height,sill:number=WALL_WINDOW.sill) {
  const {width}=WALL_WINDOW;
  return {bottomLeft:{x:-width/2,y:0,z:sill},bottomRight:{x:width/2,y:0,z:sill},topLeft:{x:-width/2,y:0,z:sill+height},topRight:{x:width/2,y:0,z:sill+height}};
}
