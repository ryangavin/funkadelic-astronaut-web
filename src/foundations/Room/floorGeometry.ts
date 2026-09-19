import { mmToUnits } from '../../geometry/physicalScale.ts';
export type WorldPoint = { x: number; y: number; z: number };
export type RoomFloorMesh = { name: string; faces: { points: WorldPoint[]; fill: string }[] };
/** World origin is the wall-floor seam, centered across the desk, in desk units. */
export function deskLegs(width: number, depth: number, stand: number, edge: number) {
  const size = Math.min(mmToUnits(50), width / 6, depth / 6);
  const inset = Math.min(mmToUnits(65), width / 4, depth / 4);
  return [-width / 2 + inset, width / 2 - inset].flatMap(x => [inset, depth - inset].map(y => ({ x, y, bottom: 0, top: Math.max(0, stand - edge), size })));
}
export function boxFaces(x:number,y:number,bottom:number,top:number,size:number):RoomFloorMesh['faces'] {
  const p=(dx:number,dy:number,z:number)=>({x:x+dx*size/2,y:y+dy*size/2,z});
  const a=p(-1,-1,bottom),b=p(1,-1,bottom),c=p(1,1,bottom),d=p(-1,1,bottom);
  const A=p(-1,-1,top),B=p(1,-1,top),C=p(1,1,top),D=p(-1,1,top);
  return [{points:[a,b,B,A],fill:'#60452f'},{points:[b,c,C,B],fill:'#806043'},{points:[c,d,D,C],fill:'#98704c'},{points:[d,a,A,D],fill:'#705035'}];
}
/** Split at tabletop height: raised portions belong in front of the desktop. */
export function clipHeight(points:WorldPoint[],height:number,above:boolean) {
  const result:WorldPoint[]=[];
  for(let i=0;i<points.length;i++) {
    const a=points[i],b=points[(i+1)%points.length];
    const inside=(p:WorldPoint)=>above?p.z>=height:p.z<=height;
    if(inside(a))result.push(a);
    if(inside(a)!==inside(b)) {const t=(height-a.z)/(b.z-a.z);result.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:height});}
  }
  return result;
}
export function projectFloorPoint(point:WorldPoint,camera:{angle:number;depth:number;width:number;surfaceHeight:number;targetY?:number},stand:number,share:number,lip:number,anchor:number) {
  const alpha=camera.angle*Math.PI/180,c=Math.sin(alpha),s=Math.cos(alpha);
  const y=point.y-(camera.targetY??camera.surfaceHeight),h=point.z-stand;
  const distance=camera.depth-y*s-h*c, scale=1440*share/camera.width;
  return {x:720+point.x*camera.depth/distance*scale,y:810*anchor-lip*scale+(y*c-h*s)*camera.depth/distance*scale,distance};
}
