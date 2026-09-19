import { boxFaces, clipHeight, deskLegs, projectFloorPoint, type RoomFloorMesh } from './floorGeometry';
import type { roomSetup } from '../../geometry/roomSetup';
/** Physical meshes share the room camera; tabletop compositing occludes lower pieces. */
export function RoomFloorGeometry({ camera, stand, edge, share, lip, anchor, objects = [], above = false }: {
  camera: ReturnType<typeof roomSetup>['camera']; stand:number; edge:number; share:number; lip:number; anchor:number; objects?:readonly RoomFloorMesh[]; above?:boolean;
}) {
  const legs=deskLegs(camera.width,camera.surfaceHeight,stand,edge);
  const meshes:readonly RoomFloorMesh[]=above?objects:[...legs.map((leg,i)=>({name:`Desk leg ${i+1}`,faces:[{points:Array.from({length:16},(_,j)=>({x:leg.x+leg.size*.85*Math.cos(j*Math.PI/8),y:leg.y+leg.size*.85*Math.sin(j*Math.PI/8),z:0})),fill:'#251c1650'},...boxFaces(leg.x,leg.y,leg.bottom,leg.top,leg.size)]})),...objects];
  const faces=meshes.flatMap(mesh=>mesh.faces.map(face=>{
    const world=clipHeight(face.points,stand,above);
    const points=world.map(point=>projectFloorPoint(point,camera,stand,share,lip,anchor));
    return {name:mesh.name,fill:face.fill,points,depth:points.reduce((sum,p)=>sum+p.distance,0)/points.length};
  })).filter(face=>face.points.length>=3&&face.points.every(p=>p.distance>0&&Number.isFinite(p.x)&&Number.isFinite(p.y))).sort((a,b)=>b.depth-a.depth);
  return <svg className={`room__floor-geometry${above?' room__floor-geometry--above':''}`} viewBox="0 0 1440 810" aria-hidden="true" style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}}>
    {faces.map((face,i)=><polygon key={i} data-floor-object={face.name} points={face.points.map(p=>`${p.x},${p.y}`).join(' ')} fill={face.fill} stroke={face.fill} strokeWidth=".4" />)}
  </svg>;
}
