export type CylinderLayer = { x:number; y:number; scale:number };
export const BASE_LAYER: CylinderLayer = {x:0,y:0,scale:1};
/** Tangent side silhouette joining two circular artwork layers; no surface mesh. */
export function cylinderSide(a:CylinderLayer, ar:number, b:CylinderLayer, br:number) {
  const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),r=ar*a.scale,R=br*b.scale;
  if(d<=Math.abs(R-r)||!d)return '';
  const along=(r-R)/d,across=Math.sqrt(1-along*along),ux=dx/d,uy=dy/d;
  const n1={x:ux*along-uy*across,y:uy*along+ux*across},n2={x:ux*along+uy*across,y:uy*along-ux*across};
  const point=(p:CylinderLayer,radius:number,n:{x:number;y:number})=>`${180+p.x+radius*n.x} ${180+p.y+radius*n.y}`;
  return `M${point(a,r,n1)}L${point(b,R,n1)}L${point(b,R,n2)}L${point(a,r,n2)}Z`;
}
export const layerTransform=({x,y,scale}:CylinderLayer)=>`translate(${180+x} ${180+y}) scale(${scale}) translate(-180 -180)`;
