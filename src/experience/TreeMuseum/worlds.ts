import { chapters, projects } from './journey';
import type { TreeGeometry } from './tree-geometry';
export type WorldMode='garden'|'ink'|'orrery';
export interface Stroke {id:number;born:number;points:{x:number;y:number}[];active:boolean}
export function initialMode():WorldMode {const mode=new URLSearchParams(location.search).get('mode');return mode==='ink'||mode==='orrery'?mode:'garden';}
export function buildWorld(mode:WorldMode,samples:Int8Array,time:number,aspect:number,chapter:number,autonomous:boolean,strokes:Stroke[]):TreeGeometry {
  const lines:Float32Array[]=[],orders:number[]=[],junctions:{x:number;y:number}[]=[],anchors=new Map<number,{x:number;y:number}>();
  const line=(count:number,at:(t:number)=>{x:number;y:number},order=1)=>{const points=new Float32Array((count+1)*2);for(let i=0;i<=count;i++){const point=at(i/count);points[i*2]=point.x;points[i*2+1]=point.y;}lines.push(points);orders.push(order);};
  const wave=(t:number)=>samples[Math.floor(t*(samples.length-1))]/128;
  const group=chapters[chapter];
  const sites=[{x:.2,y:.35},{x:.72,y:.3},{x:.43,y:.55},{x:.78,y:.73},{x:.22,y:.78}];
  group.projects.slice(0,5).forEach((project,index)=>{
    const point=sites[index];
    anchors.set(projects.findIndex(item=>item.url===project.url),point);junctions.push(point);
    if(autonomous&&mode==='garden')for(let ring=0;ring<2;ring++){const phase=(time*.035+index*.21+ring*.5)%1;line(72,t=>{const theta=t*Math.PI*2,r=.012+phase*.17+wave(t)*.003;return {x:point.x+Math.cos(theta)*r/aspect,y:point.y+Math.sin(theta)*r};},2);}
  });
  if(autonomous){
    if(mode==='ink')for(let ribbon=0;ribbon<3;ribbon++)line(128,t=>{const angle=t*Math.PI*2+time*.025+ribbon*.5;return{x:.12+t*.76+Math.sin(angle*2)*.025,y:.5+Math.sin(angle+ribbon*.8)*.24+wave(t)*.006};},ribbon?2:1);
    if(mode==='orrery')for(const [instrument,center] of [{x:.23,y:.44},{x:.7,y:.4},{x:.53,y:.75}].entries())for(let orbit=0;orbit<3;orbit++){const phase=time*.055*(1+orbit*.2)+instrument,radius=.045+orbit*.037;line(96,t=>{const theta=t*Math.PI*2;return{x:center.x+Math.cos(theta+phase)*radius/aspect,y:center.y+Math.sin(theta*(instrument===1?2:1))*radius*(orbit%2?.6:1)};},2);const node={x:center.x+Math.cos(phase)*radius/aspect,y:center.y+Math.sin(phase)*radius*(orbit%2?.6:1)};junctions.push(node);line(24,t=>{const theta=t*Math.PI*2;return{x:node.x+Math.cos(theta)*.007/aspect,y:node.y+Math.sin(theta)*.007};},0);}
  }
  strokes.forEach(stroke=>{
    const age=time-stroke.born;if(age>12&&!stroke.active)return;
    if(stroke.points.length>1){const points=new Float32Array(stroke.points.length*2);stroke.points.forEach((point,index)=>{points[index*2]=point.x;points[index*2+1]=point.y;});lines.push(points);orders.push(0);}
    const origin=stroke.points[0];if(!origin)return;
    if(mode==='garden')for(let ring=0;ring<2;ring++){const radius=Math.max(.008,age*.055-ring*.04);if(radius>.5||radius<.005)continue;line(96,t=>{const theta=t*Math.PI*2;return{x:origin.x+Math.cos(theta)*radius/aspect,y:origin.y+Math.sin(theta)*radius};},2);}
    if(mode==='garden'){
      const nearest=sites.map(point=>({point,distance:Math.hypot((point.x-origin.x)*aspect,point.y-origin.y)})).sort((a,b)=>a.distance-b.distance).slice(0,2);
      for(const {point,distance} of nearest){const responseAge=age-distance/.055;if(responseAge<0||responseAge>4)continue;line(48,t=>{const theta=t*Math.PI*2,r=.008+responseAge*.025;return{x:point.x+Math.cos(theta)*r/aspect,y:point.y+Math.sin(theta)*r};},1);}
    }
    if(mode==='ink'&&stroke.points.length===1)line(48,t=>{const theta=t*Math.PI*2;return{x:origin.x+Math.cos(theta)*.025/aspect,y:origin.y+Math.sin(theta)*.04};},1);
    if(mode==='orrery'){const radius=.035+Math.min(age*.008,.06);line(96,t=>{const theta=t*Math.PI*2;return{x:origin.x+Math.cos(theta)*radius/aspect,y:origin.y+Math.sin(theta*3+age*.04)*radius};},1);}
  });
  return {lines,orders,junctions,anchors};
}
