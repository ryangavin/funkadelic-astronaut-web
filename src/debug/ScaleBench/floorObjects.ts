import { mmToUnits } from '../../geometry/physicalScale.ts';
import type { RoomFloorMesh, WorldPoint } from '../../foundations/Room/floorGeometry.ts';
const p=(x:number,y:number,z:number):WorldPoint=>({x:mmToUnits(x),y:mmToUnits(y),z:mmToUnits(z)});
function vessel(name:string,x:number,y:number,height:number,base:number,rim:number,colors:string[],inside:string):RoomFloorMesh {
  const ring=(radius:number,z:number)=>Array.from({length:24},(_,i)=>p(x+radius*Math.cos(i*Math.PI/12),y+radius*Math.sin(i*Math.PI/12),z));
  const low=ring(base,0),high=ring(rim,height);
  return {name,faces:[{points:ring(rim*1.15,1),fill:'#30261b55'},...low.map((a,i)=>({points:[a,low[(i+1)%24],high[(i+1)%24],high[i]],fill:colors[i%colors.length]})),{points:high,fill:inside},...high.map((a,i)=>({points:[a,high[(i+1)%24],ring(rim-12,height)[(i+1)%24],ring(rim-12,height)[i]],fill:colors[0]}))]};
}
/** Fixed floor scale cues: 320 mm pot, 950 mm plant, 360 mm wastebasket. */
const plant=vessel('Potted plant',-1200,350,320,110,155,['#ad6547','#ba7150','#98583f'],'#3c3025');
for(let i=0;i<11;i++) {
  const a=i*2.39996,reach=180+(i%3)*30,z=620+(i%4)*110;
  const x=-1200+Math.cos(a)*reach,y=350+Math.sin(a)*reach;
  const stem=p(-1200,350,300),tip=p(x,y,z),side=28;
  plant.faces.push({points:[stem,p(-1196,354,300),tip],fill:'#4d6540'});
  plant.faces.push({points:[p(-1200,350,z-200),p(x-Math.sin(a)*side,y+Math.cos(a)*side,z-80),tip,p(x+Math.sin(a)*side,y-Math.cos(a)*side,z-105)],fill:i%2?'#466c43':'#62854c'});
}
export const SCALE_FLOOR_OBJECTS:readonly RoomFloorMesh[]=[plant,vessel('Wastebasket',1200,650,360,115,145,['#68746c','#7f8c81','#58655e'],'#303c35')];
